#!/bin/bash

echo "🚀 Iniciando FinanMaster - Sistema de Gestão Financeira"
echo ""

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

# Executar aplicação
echo "🌐 Iniciando servidor..."
echo "📍 Acesse: http://localhost:5001"
echo "⏹️  Para parar: Ctrl+C"
echo ""

python app.py
