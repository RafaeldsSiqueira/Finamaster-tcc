#!/bin/bash

# FinanMaster - Script de Inicialização
# Escolha como executar o projeto

echo "🚀 FinanMaster - Escolha a opção de execução:"
echo ""
echo "1. 📊 Teste Rápido (Servidor com dados realistas)"
echo "2. 🏗️ Desenvolvimento Completo (Flask + Banco)"
echo "3. 📚 Ver Documentação"
echo "4. 🚪 Sair"
echo ""

read -p "Digite sua opção (1-4): " opcao

case $opcao in
    1)
        echo "📊 Iniciando servidor de teste..."
        echo "✅ Dados realistas carregados"
        echo "✅ Gráficos funcionando"
        echo "✅ Interface moderna"
        echo ""
        echo "🌐 Acesse: http://localhost:5003"
        echo "💡 Pressione Ctrl+C para parar"
        echo ""
        cd servidores-teste/
        python3 working_server.py
        ;;
    2)
        echo "🏗️ Iniciando desenvolvimento completo..."
        echo "⚠️ Certifique-se de ter o ambiente virtual configurado"
        echo ""
        read -p "Continuar? (y/n): " confirm
        if [[ $confirm == "y" || $confirm == "Y" ]]; then
            cd projeto/
            if [ ! -d "venv" ]; then
                echo "📦 Criando ambiente virtual..."
                python3 -m venv venv
            fi
            
            echo "🔧 Ativando ambiente virtual..."
            source venv/bin/activate
            
            echo "📦 Instalando dependências..."
            pip install -r requirements.txt
            
            echo "🚀 Iniciando aplicação Flask..."
            echo "🌐 Acesse: http://localhost:5001"
            echo "💡 Pressione Ctrl+C para parar"
            echo ""
            python app.py
        fi
        ;;
    3)
        echo "📚 Documentação disponível:"
        echo ""
        echo "📖 README.md - Visão geral e instalação"
        echo "🏗️ IMPLEMENTACAO_DO_ZERO.md - Como criar do zero"
        echo "🧪 GUIA_TESTES_COMPLETO.md - Como testar tudo"
        echo "🤖 MCP_DOCUMENTATION.md - Documentação da IA"
        echo "☁️ ORACLE_CLOUD_DEPLOY.md - Deploy em produção"
        echo ""
        echo "📁 Abra a pasta 'documentacao/' para acessar os arquivos"
        ;;
    4)
        echo "👋 Até logo!"
        exit 0
        ;;
    *)
        echo "❌ Opção inválida!"
        ;;
esac
