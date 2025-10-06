# FinanMaster - Sistema de Gestão Financeira

Sistema completo de gestão financeira desenvolvido em Python com Flask para o TCC.

## 🚀 Funcionalidades

- **Dashboard Financeiro**: Visão geral das finanças com gráficos interativos
- **Gestão de Transações**: Adicionar, editar e excluir receitas e despesas
- **Orçamento Mensal**: Controle de gastos por categoria
- **Metas Financeiras**: Acompanhamento de objetivos financeiros
- **Relatórios**: Análise de tendências e relatórios mensais
- **🤖 Assistente IA**: Chat inteligente com análises e recomendações
- **📊 Relatórios Inteligentes**: Geração automática de insights
- **Interface Moderna**: Design responsivo com tema escuro

## 🛠️ Tecnologias Utilizadas

- **Backend**: Python 3.8+, Flask, SQLAlchemy, FastAPI
- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **Gráficos**: Chart.js
- **Banco de Dados**: SQLite
- **Ícones**: Font Awesome
- **🤖 IA**: Pandas, NumPy, Análise de Dados Inteligente

## 📋 Pré-requisitos

- Python 3.8 ou superior
- pip (gerenciador de pacotes Python)

## 🔧 Instalação

1. **Clone o repositório**:
```bash
git clone <url-do-repositorio>
cd finanmaster-tcc
```

2. **Crie um ambiente virtual** (recomendado):
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows
```

3. **Instale as dependências**:
```bash
pip install -r requirements.txt
```

## 🚀 Como Executar

### Opção 1: Sistema Completo (Recomendado)
```bash
./start_with_ai.sh
```

### Opção 2: Sistema Básico
```bash
./start.sh
```

### Opção 3: Manual
```bash
# Ativar ambiente virtual
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Executar aplicação
python app.py
```

### Acesse no navegador:
- **Aplicação Principal**: http://localhost:5001
- **Servidor MCP**: http://localhost:8000
- **Documentação MCP**: http://localhost:8000/docs

## ☁️ Deploy em Produção (Oracle Cloud)

Para fazer o deploy em produção na Oracle Cloud Free Tier, consulte o guia completo:

**📖 [ORACLE_CLOUD_DEPLOY.md](ORACLE_CLOUD_DEPLOY.md)**

### **Benefícios do Deploy:**
- ✅ **Sistema em produção real**
- ✅ **URL pública para demonstração**
- ✅ **Performance profissional**
- ✅ **Custo ZERO** (Oracle Cloud Free Tier)
- ✅ **Sempre gratuito** (não expira)

### **Arquivos de Deploy Incluídos:**
- `ORACLE_CLOUD_DEPLOY.md` - Guia completo passo a passo
- `nginx.conf` - Configuração do servidor web
- `finanmaster.service` - Configuração do serviço systemd
- `deploy_oracle.sh` - Script de deploy automatizado

## 📁 Estrutura do Projeto

```
finanmaster-tcc/
├── app.py                 # Aplicação principal Flask
├── mcp_server.py          # Servidor MCP FastAPI
├── requirements.txt       # Dependências Python
├── start.sh              # Script de inicialização básico
├── start_with_ai.sh      # Script de inicialização completo
├── README.md             # Este arquivo
├── MCP_DOCUMENTATION.md  # Documentação do MCP
├── ORACLE_CLOUD_DEPLOY.md # Guia de deploy na Oracle Cloud
├── nginx.conf            # Configuração Nginx
├── finanmaster.service   # Configuração Systemd
├── deploy_oracle.sh      # Script de deploy automatizado
├── templates/
│   └── index.html        # Template principal
├── static/
│   ├── style.css         # Estilos CSS
│   └── script.js         # JavaScript do frontend
└── finanmaster.db        # Banco de dados SQLite (criado automaticamente)
```

## 🗄️ Banco de Dados

O sistema utiliza SQLite com os seguintes modelos:

- **Transaction**: Transações financeiras (receitas/despesas)
- **Goal**: Metas financeiras
- **Budget**: Orçamentos mensais por categoria

## 🔌 APIs Disponíveis

### Sistema Principal (Flask)
- `GET /api/dashboard-data` - Dados do dashboard
- `GET /api/transactions` - Listar transações
- `POST /api/transactions` - Adicionar transação
- `DELETE /api/transactions/<id>` - Excluir transação
- `GET /api/goals` - Listar metas
- `POST /api/goals` - Adicionar meta
- `PUT /api/goals/<id>` - Atualizar meta
- `GET /api/budget` - Dados do orçamento
- `POST /api/budget` - Adicionar orçamento
- `GET /api/reports/monthly` - Relatório mensal

### Sistema MCP (FastAPI)
- `POST /reports/generate` - Gerar relatórios inteligentes
- `POST /ai/analyze` - Análise inteligente com IA
- `POST /ai/chat` - Chat com agente IA

## 🎨 Personalização

### Cores e Tema
O sistema utiliza um tema escuro moderno. As cores principais estão definidas em `static/style.css`:

- **Fundo**: `#0d1b2a`
- **Cards**: `#1e2a3d`
- **Saldo**: `#90be6d` (verde)
- **Receitas**: `#00b4d8` (azul)
- **Despesas**: `#f94144` (vermelho)

### Adicionando Novas Categorias
Para adicionar novas categorias de transações, edite o arquivo `templates/index.html` nos campos de seleção.

## 🔒 Segurança

- O sistema inclui validação de dados no backend
- Sanitização de inputs para prevenir injeção SQL
- Configuração de chave secreta para sessões

## 📈 Funcionalidades Futuras

- [ ] Autenticação de usuários
- [ ] Múltiplas contas bancárias
- [ ] Importação de extratos bancários
- [ ] Notificações de vencimentos
- [ ] Exportação de relatórios em PDF
- [ ] Integração com APIs bancárias

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto foi desenvolvido para fins acadêmicos como Trabalho de Conclusão de Curso.

## 👨‍💻 Autor

**Seu Nome** - TCC FinanMaster

## 📞 Suporte

Para dúvidas ou suporte, entre em contato através do email: seu-email@exemplo.com
