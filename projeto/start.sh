#!/bin/bash

# Script de inicialização do FinanMaster
echo "🚀 Iniciando FinanMaster - Sistema de Gestão Financeira"

# Verificar se o ambiente virtual existe
if [ ! -d "venv" ]; then
    echo "📦 Criando ambiente virtual..."
    python3 -m venv venv
fi

# Ativar ambiente virtual
echo "🔧 Ativando ambiente virtual..."
source venv/bin/activate

# Instalar dependências
echo "📥 Instalando dependências..."
pip install -r requirements.txt

# Executar aplicação
echo "🌐 Iniciando servidor..."
echo "📍 Acesse: http://localhost:5001"
echo "⏹️  Para parar: Ctrl+C"
echo ""

python app.py
