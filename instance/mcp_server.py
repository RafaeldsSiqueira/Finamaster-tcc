from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import pymysql
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from pathlib import Path
import os
from dotenv import load_dotenv

# Garantir carregamento do .env na raiz do projeto, mesmo executando a partir de instance/
ROOT_ENV = Path(__file__).resolve().parents[1] / '.env'
load_dotenv(dotenv_path=str(ROOT_ENV))
app = FastAPI(title="FinanMaster MCP", version="1.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos Pydantic
class ReportRequest(BaseModel):
    report_type: Optional[str] = "financial"
    period: Optional[str] = "current_month"
    categories: Optional[List[str]] = None
    insights: bool = True
    user_id: Optional[int] = None

class ReportResponse(BaseModel):
    report_type: str
    data: Dict[str, Any]
    insights: List[str]
    recommendations: List[str]
    generated_at: str

class AIAgentRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = None
    user_id: Optional[int] = None

class AIAgentResponse(BaseModel):
    response: str
    actions: List[Dict[str, Any]]
    confidence: float

# Configuração do banco de dados (MySQL, mesmo .env do app Flask)
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "finanmaster")

def get_db_connection():
    """Cria conexão com o banco de dados MySQL"""
    return pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        charset="utf8mb4",
        autocommit=True,
        cursorclass=pymysql.cursors.Cursor,
    )

def execute_query(query: str, params: tuple = ()) -> List[tuple]:
    """Executa query no banco de dados"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            results = cursor.fetchall()
            return results
    finally:
        conn.close()

# Mensagem padrão quando não há dados
def no_data_message() -> str:
    return (
        "📝 Você ainda não possui dados cadastrados neste período.\n\n"
        "Para começar a gerar insights:\n"
        "• Adicione sua primeira transação (Receita ou Despesa)\n"
        "• Defina um orçamento e metas financeiras\n\n"
        "Posso abrir o formulário de nova transação para você agora."
    )

def get_transactions_data(period: str = "current_month", user_id: Optional[int] = None) -> pd.DataFrame:
    """Obtém dados de transações como DataFrame (filtragem de período feita em pandas para evitar diferenças de timezone)."""
    params: List[Any] = []
    query = (
        "SELECT description, value, category, `type`, `date`, created_at, user_id "
        "FROM transactions"
    )
    if user_id is not None:
        query += " WHERE user_id = %s"
        params.append(user_id)
    query += " ORDER BY `date` DESC"

    try:
        results = execute_query(query, tuple(params))
        if not results:
            return pd.DataFrame(columns=['description', 'value', 'category', 'type', 'date', 'created_at'])

        df = pd.DataFrame(results, columns=['description', 'value', 'category', 'type', 'date', 'created_at', 'user_id'])
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        df['value'] = pd.to_numeric(df['value'], errors='coerce')
        df = df.dropna(subset=['date'])

        now = pd.Timestamp.now()
        if period == 'current_month':
            df = df[(df['date'].dt.year == now.year) & (df['date'].dt.month == now.month)]
        elif period == 'last_3_months':
            df = df[df['date'] >= now - pd.DateOffset(months=3)]
        elif period == 'last_6_months':
            df = df[df['date'] >= now - pd.DateOffset(months=6)]

        return df[['description', 'value', 'category', 'type', 'date', 'created_at']]
    except Exception as e:
        print(f"Erro ao obter dados: {e}")
        return pd.DataFrame(columns=['description', 'value', 'category', 'type', 'date', 'created_at'])

def generate_insights(df: pd.DataFrame) -> List[str]:
    """Gera insights baseados nos dados"""
    insights = []
    
    if df.empty:
        insights.append("Nenhuma transação encontrada no período selecionado.")
        return insights
    
    # Análise de receitas vs despesas
    receitas = df[df['type'] == 'Receita']['value'].sum()
    despesas = df[df['type'] == 'Despesa']['value'].sum()
    saldo = receitas - despesas
    
    insights.append(f"Receitas totais: R$ {receitas:,.2f}")
    insights.append(f"Despesas totais: R$ {despesas:,.2f}")
    insights.append(f"Saldo: R$ {saldo:,.2f}")
    
    if saldo > 0:
        insights.append("✅ Saldo positivo - suas finanças estão saudáveis!")
    else:
        insights.append("⚠️ Saldo negativo - considere reduzir despesas ou aumentar receitas.")
    
    # Análise de categorias
    if not df[df['type'] == 'Despesa'].empty:
        despesas_categoria = df[df['type'] == 'Despesa'].groupby('category')['value'].sum()
        maior_categoria = despesas_categoria.idxmax()
        maior_valor = despesas_categoria.max()
        
        insights.append(f"Maior categoria de despesa: {maior_categoria} (R$ {maior_valor:,.2f})")
        
        # Identificar categorias com gastos altos
        media_despesas = despesas_categoria.mean()
        categorias_altas = despesas_categoria[despesas_categoria > media_despesas * 1.5]
        if len(categorias_altas) > 0:
            insights.append(f"⚠️ Categorias com gastos acima da média: {', '.join(categorias_altas.index)}")
    
    # Análise temporal
    if len(df) > 1 and 'date' in df.columns and df['date'].dtype.name.startswith('datetime'):
        try:
            df_copy = df.copy()
            df_copy["month"] = df_copy["date"].dt.to_period("M").astype(str)
            gastos_mensais = df_copy[df_copy['type'] == 'Despesa'].groupby('month')['value'].sum()
            
            if len(gastos_mensais) > 1:
                tendencia = gastos_mensais.iloc[-1] - gastos_mensais.iloc[-2]
                if tendencia > 0:
                    insights.append("📈 Tendência de aumento nos gastos mensais")
                else:
                    insights.append("📉 Tendência de redução nos gastos mensais")
        except Exception as e:
            print(f"Erro na análise temporal: {e}")
            pass
    
    return insights

def generate_recommendations(df: pd.DataFrame) -> List[str]:
    """Gera recomendações baseadas nos dados"""
    recommendations = []
    
    if df.empty:
        recommendations.append("Comece registrando suas primeiras transações para obter insights personalizados.")
        return recommendations
    
    receitas = df[df['type'] == 'Receita']['value'].sum()
    despesas = df[df['type'] == 'Despesa']['value'].sum()
    saldo = receitas - despesas
    
    # Recomendações baseadas no saldo
    if saldo < 0:
        recommendations.append("💡 Considere criar um orçamento mensal para controlar gastos")
        recommendations.append("💡 Identifique despesas desnecessárias que podem ser reduzidas")
        recommendations.append("💡 Procure formas de aumentar suas receitas (freelance, investimentos)")
    
    # Recomendações baseadas em categorias
    if not df[df['type'] == 'Despesa'].empty:
        despesas_categoria = df[df['type'] == 'Despesa'].groupby('category')['value'].sum()
        maior_categoria = despesas_categoria.idxmax()
        
        if maior_categoria in ['Lazer', 'Alimentação']:
            recommendations.append(f"🎯 Considere reduzir gastos em {maior_categoria} para economizar mais")
        
        if 'Moradia' in despesas_categoria and despesas_categoria['Moradia'] > receitas * 0.3:
            recommendations.append("🏠 Gastos com moradia estão altos (>30% da receita). Considere alternativas.")
    
    # Recomendações gerais
    recommendations.append("📊 Mantenha o registro regular de todas as transações")
    recommendations.append("🎯 Defina metas financeiras específicas e acompanhe o progresso")
    recommendations.append("💰 Considere investir parte do saldo em aplicações financeiras")
    
    return recommendations

@app.get("/")
async def root():
    """Endpoint raiz do MCP"""
    return {
        "message": "FinanMaster MCP - Sistema de Relatórios Inteligentes",
        "version": "1.0.0",
        "endpoints": {
            "/reports/generate": "Gerar relatórios financeiros",
            "/ai/analyze": "Análise inteligente com IA",
            "/ai/chat": "Chat com agente IA"
        }
    }

@app.post("/reports/generate", response_model=ReportResponse)
async def generate_report(request: ReportRequest):
    """Gera relatório financeiro com insights"""
    try:
        # Obter dados
        df = get_transactions_data(request.period, request.user_id)
        # Logs de diagnóstico
        print("[MCP] /reports/generate",
              "user_id=", request.user_id,
              "period=", request.period,
              "rows=", 0 if df is None else len(df))
        if df is not None and not df.empty:
            try:
                print("[MCP] first_rows:", df[['description','value','category','type','date']].head(3).to_dict('records'))
            except Exception:
                pass
        
        # Filtrar por categorias se especificado
        if request.categories:
            df = df[df['category'].isin(request.categories)]
        
        # Calcular métricas básicas
        receitas = df[df['type'] == 'Receita']['value'].sum()
        despesas = df[df['type'] == 'Despesa']['value'].sum()
        saldo = receitas - despesas
        
        # Dados por categoria
        if not df.empty:
            despesas_categoria = df[df['type'] == 'Despesa'].groupby('category')['value'].sum().to_dict()
            receitas_categoria = df[df['type'] == 'Receita'].groupby('category')['value'].sum().to_dict()
        else:
            despesas_categoria = {}
            receitas_categoria = {}
        
        # Dados temporais
        if not df.empty and 'date' in df.columns:
            try:
                df_copy = df.copy()
                df_copy['date'] = pd.to_datetime(df_copy['date'], errors='coerce')
                df_copy["month"] = df_copy["date"].dt.to_period("M").astype(str)
                gastos_mensais = df_copy[df_copy['type'] == 'Despesa'].groupby('month')['value'].sum().to_dict()
            except Exception as e:
                print(f"Erro ao processar dados temporais: {e}")
                gastos_mensais = {}
        else:
            gastos_mensais = {}
        
        # Converter DataFrame para lista de dicionários para a tabela
        transactions_list = []
        if not df.empty:
            for _, row in df.iterrows():
                transactions_list.append({
                    "description": str(row['description']),
                    "value": float(row['value']),
                    "category": str(row['category']),
                    "type": str(row['type']),
                    "date": row['date'].isoformat() if pd.notna(row['date']) else None
                })
        
        # Estruturar dados do relatório
        report_data = {
            "period": request.period,
            "summary": {
                "total_receitas": float(receitas),
                "total_despesas": float(despesas),
                "saldo": float(saldo),
                "num_transactions": len(df)
            },
            "by_category": {
                "despesas": despesas_categoria,
                "receitas": receitas_categoria
            },
            "temporal": {
                "gastos_mensais": gastos_mensais
            },
            "transactions": transactions_list
        }
        
        # Gerar insights e recomendações
        insights = generate_insights(df) if request.insights else []
        recommendations = generate_recommendations(df)
        
        return ReportResponse(
            report_type=request.report_type,
            data=report_data,
            insights=insights,
            recommendations=recommendations,
            generated_at=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar relatório: {str(e)}")

@app.post("/ai/analyze", response_model=AIAgentResponse)
async def analyze_with_ai(request: AIAgentRequest):
    """Análise inteligente com IA"""
    try:
        # Obter dados recentes para contexto
        df = get_transactions_data("current_month", request.user_id)

        # Sem dados -> orientar cadastro
        if df.empty:
            return AIAgentResponse(
                response=no_data_message(),
                actions=[{"type": "prompt_add_data", "data": {}}],
                confidence=0.95
            )
        
        # Análise básica baseada na query
        query_lower = request.query.lower()
        response = ""
        actions = []
        confidence = 0.8
        
        # Navegação por comandos naturais
        def nav_response(section: str, open_modal: bool = False, text: str = ""):
            txt = text or {
                'transactions': 'Abrindo Transações…',
                'budget': 'Abrindo Orçamento…',
                'goals': 'Abrindo Metas…',
                'reports': 'Abrindo Relatórios…',
                'dashboard': 'Indo para o Dashboard…'
            }.get(section, 'Abrindo seção…')
            return AIAgentResponse(
                response=txt,
                actions=[{"type": "navigate_to_section", "data": {"section": section, "openModal": open_modal}}],
                confidence=0.95
            )

        if any(k in query_lower for k in ["abrir transa", "nova transa", "lançament", "lancament"]):
            return nav_response('transactions', True, 'Abrindo Transações e o formulário de nova transação…')
        if any(k in query_lower for k in ["abrir orçamento", "abrir orcamento", "ver orçamento", "ver orcamento", "orçamento", "orcamento"]):
            return nav_response('budget', False)
        if any(k in query_lower for k in ["abrir metas", "abrir meta", "ver metas", "ver meta", "metas"]):
            return nav_response('goals', False)
        if any(k in query_lower for k in ["relatório", "relatorio", "relatórios", "relatorios", "abrir relat"]):
            return nav_response('reports', False)
        if any(k in query_lower for k in ["dashboard", "início", "inicio", "home"]):
            return nav_response('dashboard', False)

        if "saldo" in query_lower or "balanço" in query_lower:
            receitas = df[df['type'] == 'Receita']['value'].sum()
            despesas = df[df['type'] == 'Despesa']['value'].sum()
            saldo = receitas - despesas
            
            response = f"Seu saldo atual é R$ {saldo:,.2f}. "
            if saldo > 0:
                response += "Suas finanças estão em ordem! 🎉"
            else:
                response += "Considere revisar seus gastos para equilibrar as contas."
            
            actions.append({
                "type": "show_balance",
                "data": {"saldo": float(saldo), "receitas": float(receitas), "despesas": float(despesas)}
            })
        
        elif "categoria" in query_lower or "gastos" in query_lower or "despesa" in query_lower:
            if not df[df['type'] == 'Despesa'].empty:
                despesas_categoria = df[df['type'] == 'Despesa'].groupby('category')['value'].sum()
                
                # Verificar se perguntou sobre maior ou menor
                if "maior" in query_lower or "mais" in query_lower:
                    maior_categoria = despesas_categoria.idxmax()
                    maior_valor = despesas_categoria.max()
                    
                    response = f"Sua maior categoria de gastos é {maior_categoria} com R$ {maior_valor:,.2f}. "
                    response += "Considere analisar se esses gastos são realmente necessários."
                    
                    actions.append({
                        "type": "show_category_analysis",
                        "data": {"categoria": maior_categoria, "valor": float(maior_valor)}
                    })
                elif "menor" in query_lower or "menos" in query_lower:
                    menor_categoria = despesas_categoria.idxmin()
                    menor_valor = despesas_categoria.min()
                    
                    response = f"Sua menor categoria de gastos é {menor_categoria} com R$ {menor_valor:,.2f}. "
                    response += "Ótimo! Você está controlando bem esses gastos."
                    
                    actions.append({
                        "type": "show_category_analysis",
                        "data": {"categoria": menor_categoria, "valor": float(menor_valor)}
                    })
                else:
                    # Listar todas as categorias
                    response = "Suas categorias de gastos:\n"
                    for categoria, valor in despesas_categoria.items():
                        response += f"• {categoria}: R$ {valor:,.2f}\n"
                    
                    actions.append({
                        "type": "show_all_categories",
                        "data": dict(despesas_categoria)
                    })
        
        elif "meta" in query_lower or "objetivo" in query_lower:
            # Verificar metas no banco
            goals_query = "SELECT title, target, current FROM goals"
            goals = execute_query(goals_query)
            
            if goals:
                response = "🎯 **Suas Metas Financeiras:**\n\n"
                total_goals = len(goals)
                completed_goals = 0
                
                for goal in goals:
                    title, target, current = goal
                    progress = (current / target) * 100 if target > 0 else 0
                    
                    if progress >= 100:
                        completed_goals += 1
                        response += f"✅ **{title}**: R$ {current:,.2f} / R$ {target:,.2f} (100% - CONCLUÍDA! 🎉)\n\n"
                    elif progress >= 75:
                        response += f"🟢 **{title}**: R$ {current:,.2f} / R$ {target:,.2f} ({progress:.1f}% - Quase lá!)\n\n"
                    elif progress >= 50:
                        response += f"🟡 **{title}**: R$ {current:,.2f} / R$ {target:,.2f} ({progress:.1f}% - Metade do caminho)\n\n"
                    else:
                        response += f"🔴 **{title}**: R$ {current:,.2f} / R$ {target:,.2f} ({progress:.1f}% - Começando)\n\n"
                
                # Resumo geral
                completion_rate = (completed_goals / total_goals) * 100
                response += f"📊 **Resumo:** {completed_goals}/{total_goals} metas concluídas ({completion_rate:.1f}%)\n\n"
                
                if completion_rate == 100:
                    response += "🏆 **Parabéns!** Todas as suas metas foram alcançadas! Que tal definir novas metas para continuar evoluindo?"
                elif completion_rate >= 50:
                    response += "👍 **Ótimo progresso!** Você está no caminho certo. Continue focado!"
                else:
                    response += "💪 **Vamos lá!** É hora de acelerar o ritmo. Foque nas metas mais próximas de serem alcançadas."
                    
                actions.append({"type": "show_goals", "data": {"goals": goals, "completion_rate": completion_rate}})
            else:
                response = "🎯 **Você ainda não definiu metas financeiras!**\n\nTer objetivos claros é fundamental para o sucesso financeiro. Metas te ajudam a:\n\n• 📈 Manter o foco nos seus objetivos\n• 💰 Economizar de forma mais eficiente\n• 🎉 Celebrar conquistas\n• 📊 Medir seu progresso\n\n💡 **Sugestão:** Comece com metas pequenas e alcançáveis, como economizar para uma viagem ou criar uma reserva de emergência."
                actions.append({"type": "suggest_goals", "data": {}})
        
        elif "economia" in query_lower or "poupança" in query_lower or "economizar" in query_lower:
            receitas = df[df['type'] == 'Receita']['value'].sum()
            despesas = df[df['type'] == 'Despesa']['value'].sum()
            economia = receitas - despesas
            
            if economia > 0:
                taxa_economia = (economia / receitas) * 100
                
                if taxa_economia >= 20:
                    response = f"🏆 **Excelente!** Você está economizando R$ {economia:,.2f} por mês ({taxa_economia:.1f}% das receitas).\n\n✅ **Parabéns!** Você está no caminho certo para construir uma base financeira sólida.\n\n💡 **Sugestões:**\n• Considere investir parte dessa economia\n• Mantenha uma reserva de emergência\n• Continue com essa disciplina financeira"
                elif taxa_economia >= 10:
                    response = f"👍 **Muito bom!** Você está economizando R$ {economia:,.2f} por mês ({taxa_economia:.1f}% das receitas).\n\n✅ **Bom progresso!** Você está desenvolvendo bons hábitos financeiros.\n\n💡 **Para melhorar:**\n• Tente aumentar essa taxa para 15-20%\n• Revise gastos desnecessários\n• Considere fontes de renda extras"
                else:
                    response = f"📊 **Economia atual:** R$ {economia:,.2f} por mês ({taxa_economia:.1f}% das receitas).\n\n🔄 **Há espaço para melhorar!** Tente economizar pelo menos 10% das suas receitas.\n\n💡 **Dicas para economizar mais:**\n• Revise assinaturas e serviços\n• Evite compras por impulso\n• Use cupons e promoções\n• Compare preços antes de comprar"
                    
                actions.append({
                    "type": "show_savings_tips",
                    "data": {"economia": float(economia), "taxa": float(taxa_economia)}
                })
            else:
                deficit = abs(economia)
                response = f"⚠️ **Situação crítica:** Você está gastando R$ {deficit:,.2f} a mais do que recebe.\n\n🚨 **Ação imediata necessária!**\n\n💡 **Estratégias para reverter:**\n• **Corte gastos:** Revise todas as despesas e elimine o que não é essencial\n• **Aumente receitas:** Considere trabalhos extras ou venda de itens\n• **Reorganize:** Priorize gastos essenciais (alimentação, moradia, saúde)\n• **Busque ajuda:** Considere consultoria financeira\n\n🎯 **Meta:** Chegar ao equilíbrio (receitas = despesas) e depois começar a economizar."
                
                actions.append({
                    "type": "show_deficit_analysis",
                    "data": {"deficit": float(deficit), "receitas": float(receitas), "despesas": float(despesas)}
                })
        
        else:
            # Resposta padrão sem recursão
            response = "Posso ajudar você com análises sobre saldo, categorias de gastos, metas financeiras e economia. O que gostaria de saber?"
            actions = []
            confidence = 0.6
        
        return AIAgentResponse(
            response=response,
            actions=actions,
            confidence=confidence
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na análise: {str(e)}")

@app.post("/ai/chat", response_model=AIAgentResponse)
async def chat_with_ai(request: AIAgentRequest):
    """Chat interativo com agente IA"""
    try:
        # Obter dados recentes para contexto
        df = get_transactions_data("current_month", request.user_id)

        # Sem dados -> resposta conversacional amigável
        if df.empty:
            return AIAgentResponse(
                response=(
                    "Olá! 👋 Notei que você ainda não cadastrou transações.\n\n"
                    "• Clique em “Nova Transação” para registrar sua primeira receita ou despesa.\n"
                    "• Depois disso, posso analisar seus gastos, gerar relatórios e sugerir metas.\n\n"
                    "Quer que eu abra o formulário de nova transação?"
                ),
                actions=[{"type": "prompt_add_data", "data": {}}],
                confidence=0.95
            )
        
        # Análise mais conversacional baseada na query
        query_lower = request.query.lower()
        response = ""
        actions = []
        confidence = 0.8
        
        # Chat mais natural e conversacional
        if any(word in query_lower for word in ["oi", "olá", "hello", "bom dia", "boa tarde", "boa noite"]):
            response = "Olá! 👋 Sou seu assistente financeiro pessoal. Como posso ajudar você hoje?"
            confidence = 0.9
            
        elif any(word in query_lower for word in ["como", "está", "vai", "situação"]):
            receitas = df[df['type'] == 'Receita']['value'].sum()
            despesas = df[df['type'] == 'Despesa']['value'].sum()
            saldo = receitas - despesas
            
            if saldo > 0:
                response = f"Ótimo! Sua situação financeira está positiva. Você tem um saldo de R$ {saldo:,.2f}. Continue assim! 💪"
            else:
                response = f"Precisamos dar uma atenção especial às suas finanças. Seu saldo está negativo em R$ {abs(saldo):,.2f}. Vamos trabalhar juntos para melhorar isso! 🎯"
            
            actions.append({
                "type": "show_balance",
                "data": {"saldo": float(saldo), "receitas": float(receitas), "despesas": float(despesas)}
            })
            
        # Comandos naturais de navegação no chat
        elif any(k in query_lower for k in ["abrir transa", "nova transa", "lançament", "lancament"]):
            return AIAgentResponse(
                response='Perfeito! Vou abrir Transações e o formulário de nova transação.',
                actions=[{"type": "navigate_to_section", "data": {"section": "transactions", "openModal": True}}],
                confidence=0.95
            )
        elif any(k in query_lower for k in ["abrir orçamento", "abrir orcamento", "ver orçamento", "ver orcamento", "orçamento", "orcamento"]):
            return AIAgentResponse(
                response='Abrindo Orçamento.',
                actions=[{"type": "navigate_to_section", "data": {"section": "budget", "openModal": False}}],
                confidence=0.95
            )
        elif any(k in query_lower for k in ["abrir metas", "abrir meta", "ver metas", "ver meta", "metas"]):
            return AIAgentResponse(
                response='Abrindo Metas.',
                actions=[{"type": "navigate_to_section", "data": {"section": "goals", "openModal": False}}],
                confidence=0.95
            )
        elif any(k in query_lower for k in ["relatório", "relatorio", "report", "análise completa", "analise completa"]):
            # Gerar relatório completo
            try:
                # Obter dados diretamente
                df = get_transactions_data("all")
                
                # Calcular métricas
                receitas = df[df['type'] == 'Receita']['value'].sum()
                despesas = df[df['type'] == 'Despesa']['value'].sum()
                saldo = receitas - despesas
                
                # Top categorias de despesas
                despesas_categoria = df[df['type'] == 'Despesa'].groupby('category')['value'].sum().sort_values(ascending=False)
                top_categorias = despesas_categoria.head(3)
                
                response = f"""📊 **Relatório Financeiro Completo**

💰 **Resumo Geral:**
• Total de Receitas: R$ {receitas:,.2f}
• Total de Despesas: R$ {despesas:,.2f}
• Saldo Atual: R$ {saldo:,.2f}
• Total de Transações: {len(df)}

📈 **Principais Categorias de Despesas:**"""
                
                for cat, valor in top_categorias.items():
                    response += f"\n• {cat}: R$ {valor:,.2f}"
                
                response += "\n\n💡 **Status:** Suas finanças estão em ordem! ✅"
                response += "\n📋 Acesse a seção 'Relatórios' para análise detalhada."
                
                confidence = 0.95
                
            except Exception as e:
                response = "Desculpe, ocorreu um erro ao gerar o relatório. Tente novamente."
                print(f"Erro ao gerar relatório: {e}")
                
        elif any(word in query_lower for word in ["ajuda", "help", "o que", "posso"]):
            response = """🤖 **Olá! Sou seu Assistente Financeiro IA**

Posso ajudar você com:

💰 **Análises Financeiras**
• Saldo atual e histórico
• Receitas vs Despesas
• Tendências mensais

📊 **Categorias e Gastos**
• Maiores e menores categorias
• Análise por período
• Comparações detalhadas

🎯 **Metas e Objetivos**
• Progresso das suas metas
• Sugestões de economia
• Planejamento financeiro

📈 **Relatórios Inteligentes**
• Relatórios completos
• Insights automatizados
• Recomendações personalizadas

💡 **Dicas e Conselhos**
• Estratégias de economia
• Planejamento de investimentos
• Controle de gastos

**Como usar:** Digite sua pergunta de forma natural, como:
• "Qual meu saldo atual?"
• "Quais são meus maiores gastos?"
• "Gere um relatório completo"
• "Como posso economizar mais?"

O que gostaria de saber? 😊"""
            confidence = 0.9
            
        elif any(word in query_lower for word in ["menor", "menos", "pequeno"]):
            if not df[df['type'] == 'Despesa'].empty:
                despesas_categoria = df[df['type'] == 'Despesa'].groupby('category')['value'].sum()
                menor_categoria = despesas_categoria.idxmin()
                menor_valor = despesas_categoria.min()
                
                response = f"🎉 **Excelente controle!** Sua menor categoria de gastos é **{menor_categoria}** com R$ {menor_valor:,.2f}. \n\nIsso mostra que você está controlando muito bem esses gastos! Continue assim! 👏\n\n💡 **Dica:** Mantenha esse controle e considere aplicar a mesma disciplina em outras categorias."
                
                actions.append({
                    "type": "show_category_analysis",
                    "data": {"categoria": menor_categoria, "valor": float(menor_valor)}
                })
            else:
                response = "📝 Não encontrei despesas registradas para analisar. Que tal começar registrando algumas transações? Isso me ajudará a dar insights mais precisos sobre seus gastos!"
                
        elif any(word in query_lower for word in ["maior", "mais", "alto", "grande"]):
            if not df[df['type'] == 'Despesa'].empty:
                despesas_categoria = df[df['type'] == 'Despesa'].groupby('category')['value'].sum()
                maior_categoria = despesas_categoria.idxmax()
                maior_valor = despesas_categoria.max()
                
                # Calcular percentual do total
                total_despesas = despesas_categoria.sum()
                percentual = (maior_valor / total_despesas) * 100
                
                response = f"🔍 **Análise de Gastos:** Sua maior categoria é **{maior_categoria}** com R$ {maior_valor:,.2f} ({percentual:.1f}% do total).\n\n"
                
                if percentual > 50:
                    response += "⚠️ **Atenção:** Esta categoria representa mais da metade dos seus gastos. Considere revisar se todos esses gastos são realmente necessários.\n\n💡 **Sugestão:** Analise cada transação desta categoria e identifique oportunidades de economia."
                elif percentual > 30:
                    response += "📊 **Observação:** Esta categoria tem um peso significativo nos seus gastos. Vale a pena revisar periodicamente.\n\n💡 **Dica:** Considere estabelecer um limite mensal para esta categoria."
                else:
                    response += "✅ **Situação:** Esta categoria está em um nível razoável. Continue monitorando para manter o controle.\n\n💡 **Dica:** Mantenha o foco em não deixar esta categoria crescer descontroladamente."
                
                actions.append({
                    "type": "show_category_analysis",
                    "data": {"categoria": maior_categoria, "valor": float(maior_valor), "percentual": float(percentual)}
                })
            else:
                response = "📝 Não encontrei despesas registradas para analisar. Que tal começar registrando algumas transações? Isso me ajudará a dar insights mais precisos sobre seus gastos!"
                
        else:
            # Resposta padrão sem recursão
            response = "Posso ajudar você com análises sobre saldo, categorias de gastos, metas financeiras e economia. O que gostaria de saber?"
            actions = []
            confidence = 0.6
        
        return AIAgentResponse(
            response=response,
            actions=actions,
            confidence=confidence
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no chat: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
# Cache buster sáb 04 out 2025 16:52:00 -03
