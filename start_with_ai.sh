#!/bin/bash

# Script de inicialização do FinanMaster com MCP
echo "🚀 Iniciando FinanMaster - Sistema de Gestão Financeira com IA"

# Verificar versão do Python
python_version=$(python3 --version 2>&1 | grep -oE '[0-9]+\.[0-9]+')
echo "🐍 Python version: $python_version"

# Verificar se o ambiente virtual existe
if [ ! -d "venv" ]; then
    echo "📦 Criando ambiente virtual..."
    python3 -m venv venv
fi

# Ativar ambiente virtual
echo "🔧 Ativando ambiente virtual..."
source venv/bin/activate

# Atualizar pip
echo "⬆️ Atualizando pip..."
pip install --upgrade pip

# Instalar dependências
echo "📥 Instalando dependências..."
pip install -r requirements.txt

# Verificar instalação das principais bibliotecas
echo "✅ Verificando instalação das bibliotecas..."
python -c "import flask; print(f'Flask: {flask.__version__}')"
python -c "import fastapi; print(f'FastAPI: {fastapi.__version__}')"
python -c "import pandas; print(f'Pandas: {pandas.__version__}')"
python -c "import numpy; print(f'NumPy: {numpy.__version__}')"

# Função para parar todos os processos
cleanup() {
    echo "⏹️  Parando servidores..."
    pkill -f "python app.py"
    pkill -f "python instance/mcp_server.py" 
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
cd instance
python mcp_server.py &
MCP_PID=$!
cd ..

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
