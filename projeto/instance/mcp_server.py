from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import sqlite3
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from pathlib import Path

app = FastAPI(title="FinanMaster MCP", version="1.0.0")

# Modelos Pydantic
class ReportRequest(BaseModel):
    report_type: str
    period: Optional[str] = "current_month"
    categories: Optional[List[str]] = None
    insights: bool = True

class ReportResponse(BaseModel):
    report_type: str
    data: Dict[str, Any]
    insights: List[str]
    recommendations: List[str]
    generated_at: str

class AIAgentRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = None

class AIAgentResponse(BaseModel):
    response: str
    actions: List[Dict[str, Any]]
    confidence: float

# Configuração do banco de dados
DB_PATH = "finanmaster.db"

def get_db_connection():
    """Cria conexão com o banco de dados"""
    return sqlite3.connect(DB_PATH)

def execute_query(query: str, params: tuple = ()) -> List[tuple]:
    """Executa query no banco de dados"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    results = cursor.fetchall()
    conn.close()
    return results

def get_transactions_data(period: str = "current_month") -> pd.DataFrame:
    """Obtém dados de transações como DataFrame"""
    if period == "current_month":
        query = """
        SELECT description, value, category, type, date, created_at
        FROM transaction
        WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
        ORDER BY date DESC
        """
    elif period == "last_3_months":
        query = """
        SELECT description, value, category, type, date, created_at
        FROM transaction
        WHERE date >= date('now', '-3 months')
        ORDER BY date DESC
        """
    elif period == "last_6_months":
        query = """
        SELECT description, value, category, type, date, created_at
        FROM transaction
        WHERE date >= date('now', '-6 months')
        ORDER BY date DESC
        """
    else:
        query = """
        SELECT description, value, category, type, date, created_at
        FROM transaction
        ORDER BY date DESC
        """
    
    try:
        results = execute_query(query)
        if results:
            df = pd.DataFrame(results, columns=['description', 'value', 'category', 'type', 'date', 'created_at'])
            df['date'] = pd.to_datetime(df['date'])
            df['value'] = pd.to_numeric(df['value'])
            return df
        else:
            return pd.DataFrame(columns=['description', 'value', 'category', 'type', 'date', 'created_at'])
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
    if len(df) > 1:
        df['month'] = df['date'].dt.to_period('M')
        gastos_mensais = df[df['type'] == 'Despesa'].groupby('month')['value'].sum()
        
        if len(gastos_mensais) > 1:
            tendencia = gastos_mensais.iloc[-1] - gastos_mensais.iloc[-2]
            if tendencia > 0:
                insights.append("📈 Tendência de aumento nos gastos mensais")
            else:
                insights.append("📉 Tendência de redução nos gastos mensais")
    
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
        df = get_transactions_data(request.period)
        
        # Filtrar por categorias se especificado
        if request.categories:
            df = df[df['category'].isin(request.categories)]
        
        # Calcular métricas básicas
        receitas = df[df['type'] == 'Receita']['value'].sum()
        despesas = df[df['type'] == 'Despesa']['value'].sum()
        saldo = receitas - despesas
        
        # Dados por categoria
        despesas_categoria = df[df['type'] == 'Despesa'].groupby('category')['value'].sum().to_dict()
        receitas_categoria = df[df['type'] == 'Receita'].groupby('category')['value'].sum().to_dict()
        
        # Dados temporais
        df['month'] = df['date'].dt.to_period('M')
        gastos_mensais = df[df['type'] == 'Despesa'].groupby('month')['value'].sum().to_dict()
        
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
            }
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
        df = get_transactions_data("current_month")
        
        # Análise básica baseada na query
        query_lower = request.query.lower()
        response = ""
        actions = []
        confidence = 0.8
        
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
        
        elif "categoria" in query_lower or "gastos" in query_lower:
            if not df[df['type'] == 'Despesa'].empty:
                despesas_categoria = df[df['type'] == 'Despesa'].groupby('category')['value'].sum()
                maior_categoria = despesas_categoria.idxmax()
                maior_valor = despesas_categoria.max()
                
                response = f"Sua maior categoria de gastos é {maior_categoria} com R$ {maior_valor:,.2f}. "
                response += "Considere analisar se esses gastos são realmente necessários."
                
                actions.append({
                    "type": "show_category_analysis",
                    "data": {"categoria": maior_categoria, "valor": float(maior_valor)}
                })
        
        elif "meta" in query_lower or "objetivo" in query_lower:
            # Verificar metas no banco
            goals_query = "SELECT title, target, current FROM goal"
            goals = execute_query(goals_query)
            
            if goals:
                response = "Suas metas financeiras:\n"
                for goal in goals:
                    title, target, current = goal
                    progress = (current / target) * 100 if target > 0 else 0
                    response += f"• {title}: R$ {current:,.2f} / R$ {target:,.2f} ({progress:.1f}%)\n"
            else:
                response = "Você ainda não definiu metas financeiras. Considere criar algumas para ter objetivos claros!"
                actions.append({"type": "suggest_goals", "data": {}})
        
        elif "economia" in query_lower or "poupança" in query_lower:
            receitas = df[df['type'] == 'Receita']['value'].sum()
            despesas = df[df['type'] == 'Despesa']['value'].sum()
            economia = receitas - despesas
            
            if economia > 0:
                taxa_economia = (economia / receitas) * 100
                response = f"Você está economizando R$ {economia:,.2f} ({taxa_economia:.1f}% da receita). "
                if taxa_economia >= 20:
                    response += "Excelente! Você está seguindo a regra dos 20% para economia."
                else:
                    response += "Considere aumentar sua taxa de economia para pelo menos 20%."
            else:
                response = "Você não está economizando no momento. Considere reduzir despesas para começar a poupar."
        
        else:
            response = "Posso ajudar você com análises sobre saldo, categorias de gastos, metas financeiras e economia. O que gostaria de saber?"
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
        # Implementar chat mais avançado aqui
        # Por enquanto, redireciona para análise
        return await analyze_with_ai(request)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no chat: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
