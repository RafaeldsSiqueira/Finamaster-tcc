# 🚀 FinanMaster - Sistema de Gestão Financeira

Sistema completo de gestão financeira desenvolvido em Python com Flask para o TCC, incluindo inteligência artificial integrada.

## 📊 **Base de Dados**

- **Tipo**: **SQLite** - Banco de dados local embarcado
- **Localização**: `instance/finanmaster.db`
- **Vantagens**: 
  - Simples e leve
  - Não requer servidor separado
  - Ideal para desenvolvimento e demonstração
  - Backup automático incluído
- **Modelos**:
  - `Transaction` - Transações financeiras (receitas/despesas)
  - `Goal` - Metas financeiras
  - `Budget` - Orçamentos mensais por categoria

## 💻 **Tecnologias Utilizadas**

### **Backend**
- **Python 3.8+** com Flask e SQLAlchemy
- **FastAPI** para sistema de IA
- **Pandas e NumPy** para análise inteligente

### **Frontend**
- **HTML5, CSS3, JavaScript** moderno
- **Bootstrap 5.3.2** para interface responsiva
- **Chart.js 4.4.0** para gráficos interativos
- **Design System** com variáveis CSS organizadas
- **Glassmorphism** e efeitos de blur
- **Animações CSS** e micro-interações
- **Font Inter** para tipografia moderna

### **Infraestrutura**
- **Nginx** (em produção)
- **Systemd** para gerenciamento de serviços
- **Oracle Cloud Free Tier** (deploy produção)

## 🖥️ **Requisitos de Infraestrutura**

### **Desenvolvimento Local**
- **CPU**: Qualquer processador moderno
- **RAM**: Mínimo 2GB, recomendado 4GB+
- **Disco**: 1GB para o projeto + espaço para dados
- **SO**: Linux, Windows ou macOS
- **Python**: 3.8 ou superior

### **Produção (Oracle Cloud Free Tier)**
- **CPU**: 1 OCPU (ARM64)
- **RAM**: 6GB
- **Disco**: 50GB SSD
- **Rede**: IP público com portas 80, 443, 5001, 8000 abertas
- **Custo**: **ZERO** (sempre gratuito)

### **Potência Recomendada**
- **Desenvolvimento**: Qualquer computador dos últimos 5 anos
- **Usuários simultâneos**: Até 50-100 usuários sem problemas
- **Performance**: Excelente para demonstração e uso real

## 🌐 **Acesso à Internet**

### **Para Desenvolvimento**
- **Não precisa** de internet para funcionar localmente
- **Precisa** apenas para instalar dependências (`pip install`)

### **Para Produção**
- **Sim, precisa** de internet para:
  - Acessar a aplicação via navegador
  - Usar o chat IA (se conectado a APIs externas)
  - Deploy na Oracle Cloud

### **Funcionalidades Offline**
- ✅ Dashboard financeiro completo
- ✅ Gestão de transações
- ✅ Orçamentos e metas
- ✅ Relatórios básicos
- ✅ Interface completa

## 🚀 **Como Executar Localmente**

### **Opção 1: Menu Interativo (Recomendado)**
```bash
cd instance
./finanmaster.sh
```

### **Opção 2: Sistema Completo com IA**
```bash
cd instance
./scripts/start_with_ai.sh
```

### **Opção 3: Sistema Básico**
```bash
cd instance
./scripts/run.sh
```

### **Opção 4: Manual**
```bash
# Ativar ambiente virtual
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Executar aplicação
python app.py
```

## 🌐 **Acesso Local**

Após executar qualquer uma das opções acima:

- **🏠 Aplicação Principal**: http://localhost:5001
- **🤖 Servidor IA**: http://localhost:8000
- **📚 Documentação IA**: http://localhost:8000/docs

## 📋 **Pré-requisitos**

- Python 3.8 ou superior
- pip (gerenciador de pacotes Python)
- Git (para clonar o repositório)

## 🔧 **Instalação**

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

## 📊 **Funcionalidades**

### **💼 Gestão Financeira**
- **Dashboard Financeiro**: Visão geral das finanças com gráficos interativos
- **Gestão de Transações**: Adicionar, editar e excluir receitas e despesas
- **Orçamento Mensal**: Controle de gastos por categoria
- **Metas Financeiras**: Acompanhamento de objetivos financeiros
- **Relatórios**: Análise de tendências e relatórios mensais

### **🤖 Inteligência Artificial**
- **Assistente IA**: Chat inteligente com análises e recomendações
- **Relatórios Inteligentes**: Geração automática de insights
- **Análise de Padrões**: Identificação de tendências financeiras
- **Recomendações Personalizadas**: Sugestões baseadas no comportamento

### **🎨 Interface Moderna**
- **Design System**: Paleta de cores profissional e consistente
- **Responsividade**: Funciona perfeitamente em desktop, tablet e mobile
- **Animações Suaves**: Transições e micro-interações para melhor UX
- **Tema Escuro**: Interface moderna com glassmorphism
- **Loading States**: Feedback visual durante carregamentos
- **Toast Notifications**: Notificações elegantes para feedback
- **Keyboard Shortcuts**: Atalhos para produtividade (Ctrl+K, Escape)

## 🗄️ **Estrutura do Banco de Dados**

### **Tabela Transaction**
- `id` - Chave primária
- `description` - Descrição da transação
- `value` - Valor da transação
- `category` - Categoria (Alimentação, Transporte, etc.)
- `type` - Tipo (Receita ou Despesa)
- `date` - Data da transação
- `created_at` - Data de criação

### **Tabela Goal**
- `id` - Chave primária
- `title` - Título da meta
- `target` - Valor alvo
- `current` - Valor atual
- `deadline` - Prazo limite
- `icon` - Ícone da meta
- `created_at` - Data de criação

### **Tabela Budget**
- `id` - Chave primária
- `category` - Categoria do orçamento
- `budget_amount` - Valor do orçamento
- `spent_amount` - Valor gasto
- `month` - Mês
- `year` - Ano
- `created_at` - Data de criação

## 🔌 **APIs Disponíveis**

### **Sistema Principal (Flask)**
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

### **Sistema MCP (FastAPI)**
- `POST /reports/generate` - Gerar relatórios inteligentes
- `POST /ai/analyze` - Análise inteligente com IA
- `POST /ai/chat` - Chat com agente IA

## ☁️ **Deploy em Produção**

Para fazer o deploy em produção na Oracle Cloud Free Tier (custo ZERO):

```bash
cd instance
./scripts/deploy_oracle.sh
```

**Benefícios do Deploy:**
- ✅ Sistema em produção real
- ✅ URL pública para demonstração
- ✅ Performance profissional
- ✅ Custo ZERO (Oracle Cloud Free Tier)
- ✅ Sempre gratuito (não expira)

**Documentação completa**: `docs/ORACLE_CLOUD_DEPLOY.md`

## 📁 **Estrutura do Projeto**

```
finanmaster-tcc/
├── instance/                 # Aplicação principal
│   ├── app.py               # Flask principal
│   ├── mcp_server.py        # Servidor IA
│   ├── requirements.txt     # Dependências
│   ├── finanmaster.db       # Banco de dados SQLite
│   ├── finanmaster.sh       # Menu interativo
│   └── scripts/             # Scripts de execução
│       ├── run.sh           # Sistema básico
│       ├── start_with_ai.sh # Sistema + IA
│       └── deploy_oracle.sh # Deploy produção
├── templates/               # Templates HTML
│   └── index.html          # Template principal modernizado
├── static/                 # Arquivos estáticos
│   ├── style.css           # Design system CSS moderno
│   └── script.js           # JavaScript com animações e UX
└── docs/                   # Documentações
    ├── README.md           # Principal
    ├── MCP_DOCUMENTATION.md # Sistema IA
    └── ORACLE_CLOUD_DEPLOY.md # Deploy
```

## 🎨 **Design System e Personalização**

### **🎨 Paleta de Cores Moderna**
O sistema utiliza um design system profissional com variáveis CSS organizadas:

#### **Cores Primárias**
- **Primary**: `#3b82f6` (Azul moderno)
- **Success**: `#22c55e` (Verde para saldo/economia)
- **Warning**: `#f59e0b` (Amarelo para alertas)
- **Danger**: `#ef4444` (Vermelho para despesas)

#### **Tema Escuro**
- **Background**: `#0f172a` com gradiente
- **Cards**: `#1e293b` com backdrop blur
- **Borders**: `#334155`
- **Text Primary**: `#f8fafc`
- **Text Secondary**: `#cbd5e1`

### **✨ Componentes Modernos**
- **Glassmorphism**: Efeitos de vidro com backdrop-filter
- **Sombras**: Sistema de elevação em camadas
- **Border Radius**: Cantos arredondados consistentes
- **Animações**: Transições suaves com cubic-bezier
- **Typography**: Fonte Inter para melhor legibilidade

### **📱 Responsividade**
- **Mobile-First**: Design otimizado para dispositivos móveis
- **Breakpoints**: 576px, 768px, 992px, 1200px
- **Menu Móvel**: Sidebar com overlay e animações
- **Cards Adaptativos**: Reorganização automática

### **🎯 Micro-interações**
- **Hover Effects**: Transformações e sombras nos elementos
- **Loading States**: Spinners animados durante carregamentos
- **Toast Notifications**: Notificações elegantes com animações
- **Number Counting**: Animação de contagem nos valores
- **Scroll Animations**: Elementos aparecem conforme scroll

### **🔧 Customização**
Para personalizar o sistema:

1. **Cores**: Edite as variáveis CSS em `static/style.css` (seção `:root`)
2. **Categorias**: Adicione novas categorias em `templates/index.html`
3. **Animações**: Ajuste durações e easing em `static/style.css`
4. **Layout**: Modifique breakpoints e espaçamentos nas variáveis CSS

### **⌨️ Atalhos de Teclado**
- **Ctrl/Cmd + K**: Focar no campo de busca
- **Escape**: Fechar modais e menu móvel
- **Enter**: Enviar mensagens no chat IA

## 🔒 **Segurança**

- Validação de dados no backend
- Sanitização de inputs para prevenir injeção SQL
- Configuração de chave secreta para sessões
- Headers de segurança configurados

## 🚀 **Melhorias do Frontend Implementadas**

### **✨ Modernização Completa (2024)**
O frontend do FinanMaster foi completamente modernizado seguindo as melhores práticas atuais:

#### **🎨 Design System Profissional**
- ✅ **Variáveis CSS** organizadas para cores, espaçamentos e tipografia
- ✅ **Paleta de cores** moderna com tons profissionais
- ✅ **Gradientes** sutis para profundidade visual
- ✅ **Typography** com fonte Inter para melhor legibilidade

#### **🚀 Componentes Modernizados**
- ✅ **Cards de resumo** com ícones coloridos e animações
- ✅ **Sidebar** com glassmorphism e navegação intuitiva
- ✅ **Botões** com gradientes e efeitos hover
- ✅ **Formulários** com estados visuais melhorados
- ✅ **Tabelas** com hover effects e design limpo

#### **📱 Design Responsivo Avançado**
- ✅ **Mobile-first** approach com breakpoints otimizados
- ✅ **Menu móvel** com overlay e animações
- ✅ **Sidebar** adaptativa para diferentes tamanhos de tela
- ✅ **Cards** que se reorganizam automaticamente

#### **✨ Animações e Micro-interações**
- ✅ **Animação de contagem** para números nos cards
- ✅ **Transições suaves** em todos os elementos
- ✅ **Hover effects** com transformações e sombras
- ✅ **Loading states** com spinners animados
- ✅ **Scroll animations** usando Intersection Observer

#### **🎯 Melhorias de UX**
- ✅ **Toast notifications** para feedback do usuário
- ✅ **Estados de loading** visuais
- ✅ **Tooltips** informativos
- ✅ **Keyboard shortcuts** (Ctrl+K, Escape)
- ✅ **Perfil do usuário** na sidebar

#### **🔧 Funcionalidades Técnicas**
- ✅ **Performance monitoring** integrado
- ✅ **Service Worker** preparado para PWA
- ✅ **Theme detection** automático
- ✅ **Accessibility** melhorada
- ✅ **Print styles** otimizados

### **📊 Tecnologias Frontend Atualizadas**
- **Bootstrap 5.3.2** (atualizado da versão 5.1.3)
- **Chart.js 4.4.0** (atualizado da versão anterior)
- **Font Awesome 6.5.0** (atualizado da versão 6.0.0)
- **Google Fonts Inter** para tipografia moderna
- **CSS Custom Properties** para design system
- **CSS Grid e Flexbox** para layouts modernos

## 📈 **Funcionalidades Futuras**

- [ ] Autenticação de usuários
- [ ] Múltiplas contas bancárias
- [ ] Importação de extratos bancários
- [ ] Notificações de vencimentos
- [ ] Exportação de relatórios em PDF
- [ ] Integração com APIs bancárias
- [ ] Modo claro/escuro alternável
- [ ] Temas personalizáveis
- [ ] PWA (Progressive Web App)

## 🤝 **Contribuição**

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 **Licença**

Este projeto foi desenvolvido para fins acadêmicos como Trabalho de Conclusão de Curso do curso de Analise e desenvolvimento de Sistemas da Escola Técnica de Estadual (ETEC)

## 👨‍💻 **Autor**

**Grupo 4** - TCC FinanMaster

## 📞 **Suporte**

Para dúvidas ou suporte, entre em contato através dos emails: rafaeldasilvasiqueira@yahoo.com.br
izaias.cf@outlook.com

---

## 🎉 **Status do Projeto**

**✅ 100% Funcional** - Sistema completo e operacional  
**🎨 Frontend Modernizado** - Interface profissional com design system  
**📱 Totalmente Responsivo** - Funciona em todos os dispositivos  
**🤖 IA Integrada** - Assistente inteligente para análise financeira  
**☁️ Deploy em Produção** - Pronto para demonstração pública  

**🚀 Execute `./finanmaster.sh` e experimente a nova interface moderna!**

### **🌟 Destaques da Modernização**
- **Design System** profissional com variáveis CSS organizadas
- **Glassmorphism** e efeitos visuais modernos
- **Animações suaves** e micro-interações
- **Responsividade** otimizada para mobile-first
- **UX melhorada** com loading states e notificações
- **Performance** otimizada com lazy loading
