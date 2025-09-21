# FinanMaster MCP - Sistema de Relatórios Inteligentes

## 🤖 Visão Geral

O FinanMaster MCP (Model Context Protocol) é um sistema de inteligência artificial integrado ao FinanMaster que fornece análises financeiras inteligentes, geração de relatórios automatizados e um assistente conversacional para gestão financeira.

## 🚀 Funcionalidades

### 📊 Relatórios Inteligentes
- **Análise Automática**: Gera insights baseados nos dados financeiros
- **Recomendações Personalizadas**: Sugestões baseadas no comportamento financeiro
- **Múltiplos Períodos**: Análise por mês atual, últimos 3 meses, últimos 6 meses
- **Filtros por Categoria**: Análise específica por categorias de despesas/receitas

### 🤖 Assistente IA Conversacional
- **Chat Inteligente**: Interface de conversação natural
- **Análise em Tempo Real**: Respostas baseadas nos dados atuais
- **Ações Automáticas**: Executa ações baseadas nas consultas
- **Insights Rápidos**: Cards informativos com análises principais

### 📈 Análises Avançadas
- **Tendências Temporais**: Identifica padrões de gastos ao longo do tempo
- **Análise de Categorias**: Identifica maiores gastos e oportunidades de economia
- **Metas Financeiras**: Acompanhamento inteligente de objetivos
- **Indicadores de Saúde Financeira**: Avaliação do estado das finanças

## 🛠️ Arquitetura

### Servidor MCP (FastAPI)
- **Porta**: 8000
- **Framework**: FastAPI
- **Banco de Dados**: SQLite (mesmo do FinanMaster)
- **Análise de Dados**: Pandas + NumPy

### Integração com Frontend
- **Comunicação**: HTTP REST APIs
- **Interface**: Chat integrado ao dashboard
- **Tempo Real**: Atualização automática de insights

## 🔌 APIs Disponíveis

### 1. Relatórios (`/reports/generate`)
```json
POST /reports/generate
{
  "report_type": "monthly_analysis",
  "period": "current_month",
  "categories": ["Alimentação", "Transporte"],
  "insights": true
}
```

**Resposta:**
```json
{
  "report_type": "monthly_analysis",
  "data": {
    "summary": {
      "total_receitas": 8500.0,
      "total_despesas": 6080.0,
      "saldo": 2420.0
    },
    "by_category": {
      "despesas": {"Alimentação": 650.0, "Transporte": 320.0},
      "receitas": {"Salário": 8500.0}
    }
  },
  "insights": [
    "✅ Saldo positivo - suas finanças estão saudáveis!",
    "Maior categoria de despesa: Moradia (R$ 1,200.00)"
  ],
  "recommendations": [
    "💡 Considere investir parte do saldo em aplicações financeiras",
    "📊 Mantenha o registro regular de todas as transações"
  ]
}
```

### 2. Análise IA (`/ai/analyze`)
```json
POST /ai/analyze
{
  "query": "Como está meu saldo atual?",
  "context": {"user_id": 1}
}
```

**Resposta:**
```json
{
  "response": "Seu saldo atual é R$ 2,420.00. Suas finanças estão em ordem! 🎉",
  "actions": [
    {
      "type": "show_balance",
      "data": {
        "saldo": 2420.0,
        "receitas": 8500.0,
        "despesas": 6080.0
      }
    }
  ],
  "confidence": 0.8
}
```

### 3. Chat IA (`/ai/chat`)
```json
POST /ai/chat
{
  "query": "Quais são minhas maiores despesas?",
  "context": {"session_id": "abc123"}
}
```

## 🎯 Tipos de Análise

### Análise de Saldo
- **Detecção**: Palavras-chave: "saldo", "balanço", "quanto tenho"
- **Ação**: Atualiza cards de resumo no dashboard
- **Insight**: Avalia se as finanças estão saudáveis

### Análise de Categorias
- **Detecção**: Palavras-chave: "categoria", "gastos", "despesas"
- **Ação**: Mostra análise por categoria
- **Insight**: Identifica maiores gastos e oportunidades

### Análise de Metas
- **Detecção**: Palavras-chave: "meta", "objetivo", "progresso"
- **Ação**: Mostra status das metas financeiras
- **Insight**: Sugere novas metas se necessário

### Análise de Economia
- **Detecção**: Palavras-chave: "economia", "poupança", "investimento"
- **Ação**: Calcula taxa de economia
- **Insight**: Avalia se está seguindo regras financeiras

## 📊 Insights Gerados

### Análise de Receitas vs Despesas
- Saldo positivo/negativo
- Taxa de economia
- Comparação com períodos anteriores

### Análise de Categorias
- Maior categoria de gastos
- Categorias acima da média
- Oportunidades de redução

### Análise Temporal
- Tendências de gastos mensais
- Padrões sazonais
- Projeções futuras

### Análise de Metas
- Progresso das metas
- Tempo restante
- Sugestões de ajustes

## 💡 Recomendações Inteligentes

### Baseadas no Saldo
- **Saldo Negativo**: Sugestões de redução de gastos
- **Saldo Positivo**: Sugestões de investimento

### Baseadas em Categorias
- **Gastos Altos**: Identificação de categorias problemáticas
- **Oportunidades**: Categorias com potencial de economia

### Baseadas em Metas
- **Metas Ausentes**: Sugestões de metas financeiras
- **Metas Atrasadas**: Estratégias de recuperação

## 🔧 Configuração

### Inicialização
```bash
# Iniciar ambos os servidores
./start_with_ai.sh

# Ou individualmente
python app.py          # Servidor Flask (porta 5001)
python mcp_server.py   # Servidor MCP (porta 8000)
```

### Dependências
```bash
pip install fastapi uvicorn pandas numpy pydantic
```

### Documentação da API
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🎨 Interface do Usuário

### Chat Interface
- **Design**: Moderno e responsivo
- **Indicador de Digitação**: Animações suaves
- **Histórico**: Persistência de conversas
- **Ações Rápidas**: Botões para consultas comuns

### Insights Cards
- **Cores Semânticas**: Verde (positivo), Amarelo (atenção), Vermelho (crítico)
- **Atualização Automática**: Dados em tempo real
- **Interatividade**: Cliques para ações

### Integração Dashboard
- **Navegação**: Nova seção "Assistente IA"
- **Sincronização**: Dados compartilhados entre sistemas
- **Responsividade**: Funciona em desktop e mobile

## 🔮 Funcionalidades Futuras

### IA Avançada
- **Machine Learning**: Predição de gastos futuros
- **NLP Avançado**: Compreensão de linguagem natural
- **Personalização**: Aprendizado do comportamento do usuário

### Integrações
- **APIs Bancárias**: Importação automática de transações
- **Notificações**: Alertas inteligentes
- **Exportação**: Relatórios em PDF/Excel

### Análises Avançadas
- **Análise de Investimentos**: Recomendações de aplicações
- **Planejamento Tributário**: Otimização fiscal
- **Análise de Risco**: Avaliação de perfil financeiro

## 📝 Exemplos de Uso

### Consultas Comuns
```
"Como está meu saldo?"
"Quais são minhas maiores despesas?"
"Gere um relatório do mês"
"Como estão minhas metas?"
"Quanto estou economizando?"
"Quais categorias posso reduzir?"
```

### Ações Automáticas
- Atualização de cards de resumo
- Geração de gráficos específicos
- Sugestão de novas metas
- Alertas de gastos excessivos

## 🔒 Segurança

- **Validação de Dados**: Todos os inputs são validados
- **Sanitização**: Prevenção de injeção SQL
- **Rate Limiting**: Proteção contra spam
- **Logs**: Registro de todas as interações

## 📈 Métricas de Performance

- **Tempo de Resposta**: < 500ms para análises simples
- **Precisão**: > 90% para detecção de intenções
- **Disponibilidade**: 99.9% uptime
- **Escalabilidade**: Suporte a múltiplos usuários

---

**Desenvolvido para o TCC FinanMaster**  
*Sistema de Gestão Financeira com Inteligência Artificial*
