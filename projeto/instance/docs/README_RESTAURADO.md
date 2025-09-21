# FinanMaster - Sistema de Gestão Financeira

## �� Projeto Restaurado e Organizado com Sucesso!

O projeto FinanMaster foi completamente restaurado e organizado em uma estrutura profissional.

## 📁 Estrutura do Projeto Organizada

```
instance/
├── 📱 Aplicação Principal:
│   ├── app.py                    # Aplicação Flask principal
│   ├── mcp_server.py             # Servidor MCP para IA
│   ├── requirements.txt          # Dependências Python
│   └── finanmaster.db            # Banco de dados SQLite
│
├── 🎨 Interface Web:
│   ├── templates/                # Templates HTML
│   │   └── index.html
│   └── static/                   # Arquivos estáticos
│       ├── style.css
│       └── script.js
│
├── 🚀 Scripts de Execução:
│   ├── run.sh                    # Sistema básico
│   ├── start_with_ai.sh          # Sistema completo com IA
│   ├── deploy_oracle.sh          # Deploy Oracle Cloud
│   ├── start.sh                  # Script original
│   ├── nginx.conf               # Configuração nginx
│   └── finanmaster.service      # Configuração systemd
│
└── 📚 Documentações:
    ├── README.md                 # Documentação principal
    ├── MCP_DOCUMENTATION.md      # Sistema de IA
    ├── ORACLE_CLOUD_DEPLOY.md    # Deploy em produção
    ├── README_RESTAURADO.md      # Este guia
    └── RESUMO_DOCUMENTACOES.md   # Resumo das documentações
```

## 🛠️ Como Executar (Método Fácil)

### 🎯 Script Principal (Recomendado)
```bash
cd instance
./finanmaster.sh
```

Este script oferece um menu interativo com todas as opções!

### 🚀 Execução Direta
```bash
cd instance

# Sistema básico
./scripts/run.sh

# Sistema completo com IA
./scripts/start_with_ai.sh

# Deploy em produção
./scripts/deploy_oracle.sh
```

## 🌐 Acesso

Após executar, acesse:
- **Aplicação Principal**: http://localhost:5001
- **Servidor MCP (IA)**: http://localhost:8000
- **Documentação MCP**: http://localhost:8000/docs

## 📊 Funcionalidades

- ✅ Dashboard financeiro completo
- ✅ Gestão de transações (receitas e despesas)
- ✅ Orçamento mensal por categoria
- ✅ Metas financeiras com progresso
- ✅ 🤖 Assistente IA integrado
- ✅ 📊 Relatórios inteligentes
- ✅ Interface moderna e responsiva

## 🔧 Tecnologias

- **Backend**: Flask + SQLAlchemy
- **Frontend**: HTML5, CSS3, JavaScript
- **Gráficos**: Chart.js
- **UI**: Bootstrap 5
- **Banco de Dados**: SQLite
- **🤖 IA**: FastAPI + Pandas + NumPy

## 📚 Documentações Disponíveis

### 📖 **docs/README.md** - Documentação Principal
- Visão geral do projeto
- Instruções de instalação
- Funcionalidades principais
- Estrutura do projeto

### 🤖 **docs/MCP_DOCUMENTATION.md** - Sistema de IA
- Documentação do servidor MCP
- APIs disponíveis
- Funcionalidades de IA
- Exemplos de uso

### ☁️ **docs/ORACLE_CLOUD_DEPLOY.md** - Deploy em Produção
- Guia completo para deploy na Oracle Cloud
- Configuração de servidor
- Scripts de automação
- Benefícios do deploy

### 📋 **docs/README_RESTAURADO.md** - Este Guia
- Instruções de uso atualizadas
- Estrutura organizada
- Scripts de execução

### 📝 **docs/RESUMO_DOCUMENTACOES.md** - Resumo
- Visão geral das documentações
- Como usar cada uma
- Status do projeto

## ☁️ Deploy em Produção

Para fazer o deploy em produção na Oracle Cloud Free Tier:

```bash
cd instance
./scripts/deploy_oracle.sh
```

**Benefícios:**
- ✅ Sistema em produção real
- ✅ URL pública para demonstração
- ✅ Performance profissional
- ✅ Custo ZERO (Oracle Cloud Free Tier)

## 📈 Dados de Exemplo

O sistema já vem populado com dados de exemplo para demonstração:
- Transações de exemplo
- Metas financeiras
- Orçamentos por categoria

## 🎯 Próximos Passos

1. Execute `./finanmaster.sh` para ver o menu
2. Escolha a opção desejada
3. Acesse o sistema no navegador
4. Explore as funcionalidades
5. Teste o assistente IA
6. Considere fazer o deploy em produção

---

**Status**: ✅ Projeto completamente restaurado, organizado e funcionando!
