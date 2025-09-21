#!/bin/bash

# Script de inicialização do FinanMaster com MCP
echo "🚀 Iniciando FinanMaster - Sistema de Gestão Financeira com IA"

# Verificar se estamos no diretório correto
if [ ! -f "app.py" ]; then
    echo "❌ Erro: Execute este script no diretório do projeto"
    exit 1
fi

# Ativar ambiente virtual
echo "🔧 Ativando ambiente virtual..."
source ../venv/bin/activate

# Verificar se as dependências estão instaladas
echo "📦 Verificando dependências..."
python -c "import flask" 2>/dev/null || {
    echo "📥 Instalando dependências..."
    pip install -r requirements.txt
}

# Função para parar todos os processos
cleanup() {
    echo "⏹️  Parando servidores..."
    pkill -f "python app.py"
    pkill -f "python mcp_server.py"
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT

# Executar servidor Flask em background
echo "🌐 Iniciando servidor Flask (porta 5001)..."
python app.py &
FLASK_PID=$!

# Aguardar um pouco para o Flask inicializar
sleep 3

# Executar servidor MCP em background
echo "🤖 Iniciando servidor MCP (porta 8000)..."
python mcp_server.py &
MCP_PID=$!

echo ""
echo "✅ Servidores iniciados com sucesso!"
echo "📍 Aplicação principal: http://localhost:5001"
echo "🤖 Servidor MCP: http://localhost:8000"
echo "📊 Documentação MCP: http://localhost:8000/docs"
echo ""
echo "⏹️  Para parar: Ctrl+C"
echo ""

# Manter script rodando
wait
