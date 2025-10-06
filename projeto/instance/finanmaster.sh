#!/bin/bash

echo "🎯 FinanMaster - Menu de Execução"
echo "=================================="
echo ""
echo "Escolha uma opção:"
echo ""
echo "1️⃣  Sistema Básico (Flask apenas)"
echo "2️⃣  Sistema Completo (Flask + IA)"
echo "3️⃣  Deploy em Produção (Oracle Cloud)"
echo "4️⃣  Ver Documentações"
echo "5️⃣  Sair"
echo ""

read -p "Digite sua opção (1-5): " choice

case $choice in
    1)
        echo "🚀 Iniciando sistema básico..."
        ./scripts/run.sh
        ;;
    2)
        echo "🤖 Iniciando sistema completo com IA..."
        ./scripts/start_with_ai.sh
        ;;
    3)
        echo "☁️  Iniciando deploy em produção..."
        ./scripts/deploy_oracle.sh
        ;;
    4)
        echo "📚 Abrindo documentações..."
        echo ""
        echo "Documentações disponíveis:"
        echo "📖 docs/README.md - Documentação principal"
        echo "🤖 docs/MCP_DOCUMENTATION.md - Sistema de IA"
        echo "☁️  docs/ORACLE_CLOUD_DEPLOY.md - Deploy em produção"
        echo "📋 docs/README_RESTAURADO.md - Guia de uso"
        echo "📝 docs/RESUMO_DOCUMENTACOES.md - Resumo das documentações"
        echo ""
        echo "Use: cat docs/NOME_DO_ARQUIVO.md"
        ;;
    5)
        echo "👋 Saindo..."
        exit 0
        ;;
    *)
        echo "❌ Opção inválida!"
        exit 1
        ;;
esac

