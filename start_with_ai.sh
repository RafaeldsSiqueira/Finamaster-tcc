#!/bin/bash

# Script de inicialização do FinanMaster com MCP
echo "🚀 Iniciando FinanMaster - Sistema de Gestão Financeira com IA"

# Verificar versão do Python
python_version=$(python3 --version 2>&1 | grep -oE '[0-9]+\.[0-9]+')
echo "🐍 Python version: $python_version"

# Verificar se o ambiente virtual existe
if [ ! -d ".venv" ]; then
    echo "📦 Criando ambiente virtual..."
    python3 -m venv .venv
fi

# Ativar ambiente virtual
echo "🔧 Ativando ambiente virtual..."
source .venv/bin/activate

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

# Função para verificar se MySQL está configurado
check_mysql_config() {
    if [ ! -f ".env" ]; then
        return 1
    fi
    
    # Verificar se as variáveis essenciais estão configuradas
    # DB_HOST e DB_NAME são necessários, DB_PASSWORD pode estar vazio mas deve existir
    local has_host=false
    local has_password=false
    local has_db_name=false
    
    if grep -q "^DB_HOST=" .env 2>/dev/null; then
        has_host=true
    fi
    
    if grep -q "^DB_PASSWORD=" .env 2>/dev/null; then
        has_password=true
    fi
    
    if grep -q "^DB_NAME=" .env 2>/dev/null; then
        has_db_name=true
    fi
    
    # Se todas as variáveis essenciais estiverem presentes, está configurado
    if [ "$has_host" = true ] && [ "$has_password" = true ] && [ "$has_db_name" = true ]; then
        return 0
    fi
    
    return 1
}

# Verificar e configurar MySQL se necessário
echo ""
echo "🔍 Verificando configuração MySQL..."
if ! check_mysql_config; then
    echo "🔧 Executando setup MySQL (necessário apenas uma vez)..."
    python3 setup_mysql.py
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ Erro ao configurar MySQL."
        echo "💡 Dica: Execute 'python3 setup_mysql.py' manualmente se necessário."
        echo "📋 Verifique se o MySQL está instalado e rodando."
        exit 1
    fi
    echo "✅ MySQL configurado com sucesso!"
else
    echo "✅ Configuração MySQL já existe (pulando setup)"
fi

echo ""

# Função para checar se a porta está em uso
is_port_in_use() {
    local port=$1
    if command -v lsof >/dev/null 2>&1; then
        lsof -i :"$port" -sTCP:LISTEN -P -n >/dev/null 2>&1
        return $?
    else
        ss -ltn 2>/dev/null | grep -q ":$port "
        return $?
    fi
}

# Função para parar todos os processos
cleanup() {
    echo "⏹️  Parando servidores..."
    if [ -n "$FLASK_PID" ] && kill -0 "$FLASK_PID" 2>/dev/null; then
        kill "$FLASK_PID"
    fi
    if [ -n "$MCP_PID" ] && kill -0 "$MCP_PID" 2>/dev/null; then
        kill "$MCP_PID"
    fi
    wait
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT

# Executar servidor Flask em background
if is_port_in_use 5001; then
    echo "ℹ️  Porta 5001 já está em uso. Presumindo que o Flask já está rodando. Pulando start do Flask."
else
    echo "🌐 Iniciando servidor Flask (porta 5001)..."
    python app.py &
    FLASK_PID=$!
fi

# Aguardar um pouco para o Flask inicializar
sleep 3

# Executar servidor MCP em background
if is_port_in_use 8000; then
    echo "ℹ️  Porta 8000 já está em uso. Presumindo que o MCP já está rodando. Pulando start do MCP."
else
    echo "🤖 Iniciando servidor MCP (porta 8000)..."
    cd instance
    python mcp_server.py &
    MCP_PID=$!
    cd ..
fi

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
