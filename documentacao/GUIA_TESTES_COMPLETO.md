# 🧪 Guia Completo de Testes - FinanMaster

## 📋 **Pré-requisitos**
- Python 3.x instalado
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexão com internet (para Chart.js)

---

## 🚀 **1. INICIANDO O SISTEMA**

### **Passo 1.1: Verificar se o servidor está rodando**
```bash
# No terminal, navegue até o diretório do projeto
cd /home/rafael/Documentos/finanmaster-tcc

# Inicie o servidor
python3 working_server.py
```

### **Passo 1.2: Confirmar que está funcionando**
- Você deve ver a mensagem: `🚀 FinanMaster - Servidor Funcional`
- Servidor rodando em: `http://localhost:5002`

### **Passo 1.3: Abrir no navegador**
- Acesse: `http://localhost:5002`
- ✅ **Resultado esperado**: Página carrega com menu horizontal moderno

---

## 🎨 **2. TESTANDO O FRONTEND MODERNIZADO**

### **Teste 2.1: Menu Horizontal**
1. **Verificar Layout**:
   - ✅ Menu fixo no topo da página
   - ✅ Logo "FinanMaster" à esquerda
   - ✅ Ícones + texto lado a lado (horizontal)
   - ✅ Paleta de cores amigável (tons suaves)

2. **Testar Navegação**:
   - Clique em cada item do menu: Dashboard, Transações, Orçamento, Metas, Relatórios
   - ✅ **Resultado**: Seção correspondente aparece com animação suave

### **Teste 2.2: Responsividade**
1. **Desktop** (tela grande):
   - ✅ Menu completo com ícones + texto
   - ✅ Layout em grid responsivo

2. **Tablet** (redimensione a janela):
   - ✅ Menu se adapta com elementos menores
   - ✅ Cards reorganizam automaticamente

3. **Mobile** (janela muito pequena):
   - ✅ Apenas ícones aparecem no menu
   - ✅ Layout em coluna única

### **Teste 2.3: Animações e Micro-interações**
1. **Hover Effects**:
   - Passe o mouse sobre botões e cards
   - ✅ **Resultado**: Efeitos de hover suaves

2. **Transições**:
   - Navegue entre seções
   - ✅ **Resultado**: Transições suaves entre páginas

---

## 📊 **3. TESTANDO OS GRÁFICOS INTERATIVOS**

### **Teste 3.1: Gráfico de Fluxo de Caixa (Dashboard)**
1. **Acesse**: Dashboard (seção padrão)
2. **Localize**: Gráfico de linha "Fluxo de Caixa"
3. **Verificar**:
   - ✅ Gráfico carrega automaticamente
   - ✅ Linha azul (Receitas) e linha vermelha (Despesas)
   - ✅ Dados de 5 meses: Jan, Fev, Mar, Abr, Mai
   - ✅ Valores realistas: Receitas ~8500-9500, Despesas ~1600-2000

### **Teste 3.2: Gráfico de Despesas (Pizza)**
1. **Localize**: Gráfico circular "Distribuição de Despesas"
2. **Verificar**:
   - ✅ Gráfico de pizza/doughnut carrega
   - ✅ Cores diferentes para cada categoria
   - ✅ Categorias: Alimentação, Transporte, Moradia, Lazer, Saúde
   - ✅ Moradia tem a maior fatia (~1000), seguida de Alimentação (~500)

### **Teste 3.3: Gráfico de Orçamento**
1. **Navegue**: Orçamento → seção "Progresso do Orçamento"
2. **Verificar**:
   - ✅ Gráfico de barras carrega
   - ✅ Barras azuis (Orçado) vs barras laranja (Gasto)
   - ✅ Comparação visual entre orçamento e gastos reais

### **Teste 3.4: Gráficos de Relatórios**
1. **Navegue**: Relatórios
2. **Verificar**:
   - ✅ Gráfico "Relatório Mensal" (barras)
   - ✅ Gráfico "Análise de Tendências" (linhas)

---

## 💰 **4. TESTANDO GERENCIAMENTO DE ORÇAMENTO**

### **Teste 4.1: Visualizar Orçamentos Existentes**
1. **Navegue**: Orçamento
2. **Verificar lista**:
   - ✅ Alimentação: R$ 1.500 (gasto: R$ 1.200 - 80%)
   - ✅ Transporte: R$ 1.000 (gasto: R$ 800 - 80%)
   - ✅ Moradia: R$ 1.200 (gasto: R$ 1.000 - 83%)
   - ✅ Lazer: R$ 800 (gasto: R$ 600 - 75%)
   - ✅ Saúde: R$ 500 (gasto: R$ 400 - 80%)

### **Teste 4.2: Criar Novo Orçamento**
1. **Clique**: Botão "Definir Orçamento" (canto superior direito)
2. **Modal abre**:
   - ✅ Formulário aparece com animação
   - ✅ Campo "Categoria" com dropdown
   - ✅ Campo "Valor do Orçamento" numérico

3. **Preencher**:
   - Categoria: "Educação"
   - Valor: "800.00"
   - **Clique**: "Salvar"

4. **Verificar**:
   - ✅ Modal fecha
   - ✅ Novo orçamento aparece na lista
   - ✅ Gráfico atualiza automaticamente

### **Teste 4.3: Testar APIs de Orçamento (Terminal)**
```bash
# Listar orçamentos
curl -s http://localhost:5002/api/budget | jq

# Criar novo orçamento
curl -X POST -H "Content-Type: application/json" \
  -d '{"category":"Educação","budget_amount":"800.00"}' \
  http://localhost:5002/api/budget

# Verificar se foi criado
curl -s http://localhost:5002/api/budget | jq '.[-1]'
```

---

## 📈 **5. TESTANDO DASHBOARD E MÉTRICAS**

### **Teste 5.1: Cards de Resumo**
1. **Verificar cards superiores**:
   - ✅ **Saldo**: ~R$ 8.784 (calculado automaticamente)
   - ✅ **Receitas**: ~R$ 10.500 (total das receitas)
   - ✅ **Despesas**: ~R$ 1.715 (total das despesas)
   - ✅ **Economia**: ~R$ 8.784 (receitas - despesas)

2. **Verificar animações**:
   - ✅ Números contam animadamente ao carregar
   - ✅ Ícones com gradientes coloridos

### **Teste 5.2: Atualização em Tempo Real**
1. **Observe**: Dashboard atualiza automaticamente a cada 30 segundos
2. **Verificar**: Console do navegador (F12) mostra requisições API

---

## 🎯 **6. TESTANDO METAS FINANCEIRAS**

### **Teste 6.1: Visualizar Metas**
1. **Navegue**: Metas
2. **Verificar cards de metas**:
   - ✅ **Reserva de Emergência**: R$ 10.000 (65% - R$ 6.500)
   - ✅ **Viagem Europa**: R$ 15.000 (56.7% - R$ 8.500)
   - ✅ **Novo Notebook**: R$ 3.500 (60% - R$ 2.100)

3. **Verificar elementos visuais**:
   - ✅ Barras de progresso animadas
   - ✅ Ícones representativos (porquinho, avião, laptop)
   - ✅ Cores diferentes para cada meta

---

## 📋 **7. TESTANDO TRANSAÇÕES**

### **Teste 7.1: Lista de Transações**
1. **Navegue**: Transações
2. **Verificar tabela**:
   - ✅ Lista com 40 transações (5 meses de dados)
   - ✅ Colunas: Descrição, Valor, Categoria, Tipo, Data
   - ✅ Cores: Verde para receitas, vermelho para despesas
   - ✅ Valores formatados em R$

### **Teste 7.2: Dados Realistas**
- ✅ **Receitas**: Salários (~8500-9500), Freelances (~1500-2500)
- ✅ **Despesas**: Aluguel (1000), Alimentação (320-500), Transporte (150-250)

---

## 🔧 **8. TESTANDO APIS (Terminal)**

### **Teste 8.1: APIs Básicas**
```bash
# Dashboard completo
curl -s http://localhost:5003/api/dashboard-data | jq

# Lista de transações
curl -s http://localhost:5002/api/transactions | jq '.[0:3]'

# Lista de metas
curl -s http://localhost:5002/api/goals | jq

# Lista de orçamentos
curl -s http://localhost:5002/api/budget | jq
```

### **Teste 8.2: APIs de Orçamento (CRUD)**
```bash
# CREATE - Criar orçamento
curl -X POST -H "Content-Type: application/json" \
  -d '{"category":"Saúde","budget_amount":"600.00"}' \
  http://localhost:5003/api/budget

# READ - Listar orçamentos
curl -s http://localhost:5002/api/budget | jq

# UPDATE - Atualizar orçamento (simulado via POST)
curl -X POST -H "Content-Type: application/json" \
  -d '{"budget":"1200.00","spent":"900.00"}' \
  http://localhost:5002/api/budget/1

# DELETE - Remover orçamento
curl -X DELETE http://localhost:5002/api/budget/1
```

---

## 🎨 **9. TESTANDO DESIGN SYSTEM**

### **Teste 9.1: Paleta de Cores**
- ✅ **Primária**: Tons de azul suaves
- ✅ **Secundária**: Tons de roxo harmoniosos
- ✅ **Sucesso**: Verde suave para receitas
- ✅ **Aviso**: Laranja suave para alertas
- ✅ **Erro**: Vermelho suave para despesas

### **Teste 9.2: Tipografia**
- ✅ **Títulos**: Fonte moderna e legível
- ✅ **Corpo**: Tamanho adequado para leitura
- ✅ **Hierarquia**: Diferentes tamanhos bem definidos

### **Teste 9.3: Espaçamento e Layout**
- ✅ **Padding**: Espaçamento consistente entre elementos
- ✅ **Margins**: Separação adequada entre seções
- ✅ **Grid**: Layout responsivo em todas as telas

---

## 🚨 **10. TESTANDO TRATAMENTO DE ERROS**

### **Teste 10.1: Erros de Rede**
1. **Pare o servidor**: Ctrl+C no terminal
2. **Recarregue a página**: F5
3. ✅ **Resultado**: Mensagem de erro amigável

### **Teste 10.2: Dados Inválidos**
```bash
# Teste com dados inválidos
curl -X POST -H "Content-Type: application/json" \
  -d '{"category":"","budget_amount":""}' \
  http://localhost:5002/api/budget
```
✅ **Resultado**: Retorna erro 400 com mensagem clara

---

## ✅ **11. CHECKLIST FINAL**

### **Frontend Modernizado**
- [ ] Menu horizontal funcionando
- [ ] Ícones + texto lado a lado
- [ ] Paleta de cores amigável
- [ ] Design responsivo
- [ ] Animações suaves

### **Gráficos Interativos**
- [ ] Gráfico de linha (Fluxo de Caixa)
- [ ] Gráfico de pizza (Despesas)
- [ ] Gráfico de barras (Orçamento)
- [ ] Gráficos de relatórios

### **Funcionalidades**
- [ ] Dashboard com métricas
- [ ] Criação de orçamento
- [ ] Lista de transações
- [ ] Metas financeiras
- [ ] APIs funcionando

### **Qualidade**
- [ ] Dados realistas
- [ ] Cálculos corretos
- [ ] Interface intuitiva
- [ ] Performance adequada

---

## 🎉 **RESULTADO ESPERADO**

Após completar todos os testes, você deve ter:
- ✅ **Interface moderna e profissional**
- ✅ **Gráficos interativos funcionando**
- ✅ **Sistema de orçamento completo**
- ✅ **Dados realistas e consistentes**
- ✅ **Experiência de usuário excelente**

**🚀 O FinanMaster está funcionando como um sistema financeiro completo e moderno!**
