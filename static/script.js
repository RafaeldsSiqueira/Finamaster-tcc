
// Variáveis globais para armazenar dados
let dashboardData = {};
let transactions = [];
let goals = [];
let budgetData = [];
let charts = {};
let aiResponses = [];
let currentUserId = null;

// Configuração da API MCP
const MCP_API_BASE = 'http://localhost:8000';
const FLASK_API_BASE = 'http://localhost:5001';

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeQuickActions();
    initializeBrandClick();
    loadDashboardData();
    loadTransactions();
    loadGoals();
    loadBudget();
    initializeEventListeners();
    initializeCharts();
    initializeAnimations();
    initializeTooltips();
});

// Navegação entre seções
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Adicionar efeito de clique
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            // Mostrar indicador de carregamento
            showNavigationLoading();
            
            // Remove active class from all links and sections
            navLinks.forEach(l => l.classList.remove('active'));
            contentSections.forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Show corresponding section with animation
            const targetSection = this.getAttribute('data-section');
            const sectionId = targetSection + '-section';
            const section = document.getElementById(sectionId);
            
            console.log(`Tentando navegar para: ${targetSection}`);
            console.log(`ID da seção: ${sectionId}`);
            console.log(`Seção encontrada:`, section);
            
            if (section) {
                section.classList.add('active');
                
                // Limpar gráficos ao sair da seção de relatórios
                if (targetSection !== 'reports') {
                    clearAllCharts();
                }
                
                // Animate section entrance
                section.style.opacity = '0';
                section.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    section.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                    section.style.opacity = '1';
                    section.style.transform = 'translateY(0)';
                    
                    // Esconder indicador de carregamento
                    hideNavigationLoading();
                }, 50);
                
                // Scroll to top of content
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Log da navegação para debug
                console.log(`Navegação bem-sucedida para: ${targetSection}`);
            } else {
                console.error(`Seção não encontrada: ${sectionId}`);
                console.log('Seções disponíveis:', document.querySelectorAll('.content-section'));
                hideNavigationLoading();
            }
        });
        
        // Adicionar efeito hover mais responsivo
        link.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.2s ease';
        });
        
        link.addEventListener('mouseleave', function() {
            if (!this.classList.contains('active')) {
                this.style.transition = 'all 0.3s ease';
            }
        });
    });
}

// Inicializar clique no logo/brand para ir ao dashboard
function initializeBrandClick() {
    const headerBrand = document.getElementById('header-brand');
    
    if (headerBrand) {
        headerBrand.addEventListener('click', function() {
            console.log('Clique no logo FinanMaster - redirecionando para Dashboard');
            
            // Encontrar o link do dashboard
            const dashboardLink = document.querySelector('.nav-link[data-section="dashboard"]');
            
            if (dashboardLink) {
                // Simular clique no link do dashboard
                dashboardLink.click();
                
                // Adicionar efeito visual de clique
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
                
                console.log('Redirecionamento para Dashboard realizado');
            } else {
                console.error('Link do Dashboard não encontrado');
            }
        });
        
        // Adicionar efeito hover
        headerBrand.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.2s ease';
            this.style.opacity = '0.8';
        });
        
        headerBrand.addEventListener('mouseleave', function() {
            this.style.opacity = '1';
        });
    } else {
        console.warn('Elemento header-brand não encontrado');
    }
}

// Funções de indicador de carregamento da navegação
function showNavigationLoading() {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'nav-loading';
    loadingIndicator.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px 40px;
        border-radius: 10px;
        z-index: 9999;
        font-size: 16px;
        font-weight: 600;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    loadingIndicator.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 20px; height: 20px; border: 2px solid #ffffff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            Carregando...
        </div>
    `;
    
    // Adicionar animação CSS se não existir
    if (!document.getElementById('nav-loading-styles')) {
        const style = document.createElement('style');
        style.id = 'nav-loading-styles';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(loadingIndicator);
}

function hideNavigationLoading() {
    const loadingIndicator = document.getElementById('nav-loading');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

// Quick Actions
function initializeQuickActions() {
    const searchBtn = document.querySelector('.action-btn[title="Buscar"]');
    const notificationBtn = document.querySelector('.action-btn[title="Notificações"]');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            // Focus on search input if available
            const searchInput = document.querySelector('input[type="search"], #search-transaction');
            if (searchInput) {
                searchInput.focus();
                searchInput.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function() {
            showToastNotification('Nenhuma notificação nova', 'info');
        });
    }
}

// Initialize Animations
function initializeAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe cards for animation
    const cards = document.querySelectorAll('.card, .summary-card');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(card);
    });
    
    // Stagger animation for summary cards
    const summaryCards = document.querySelectorAll('.summary-card');
    summaryCards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.1}s`;
    });
}

// Initialize Tooltips
function initializeTooltips() {
    // Add tooltips to navigation items
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const title = link.querySelector('span').textContent;
        link.setAttribute('title', title);
        
        // Add hover effect
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(8px) scale(1.02)';
        });
        
        link.addEventListener('mouseleave', function() {
            if (!this.classList.contains('active')) {
                this.style.transform = 'translateX(4px) scale(1)';
            }
        });
    });
    
    // Add tooltips to summary cards
    const summaryCards = document.querySelectorAll('.summary-card');
    summaryCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Carregar dados do dashboard
async function loadDashboardData() {
    try {
        // Show loading state
        showLoadingState();
        
        const response = await fetch('/api/dashboard-data');
        dashboardData = await response.json();
        
        // Animate number counting for summary cards
        animateNumberCounting('saldo-total', dashboardData.saldo);
        animateNumberCounting('receitas-total', dashboardData.receitas);
        animateNumberCounting('despesas-total', dashboardData.despesas);
        animateNumberCounting('economia-total', dashboardData.economia);
        
        // Atualizar trends percentuais dinâmicos
        updateTrend('saldo-trend', dashboardData.trends?.saldo);
        updateTrend('receitas-trend', dashboardData.trends?.receitas);
        updateTrend('despesas-trend', dashboardData.trends?.despesas);
        updateTrend('economia-trend', dashboardData.trends?.economia);

        // Atualizar gráficos
        updateCharts();
        
        // Hide loading state
        hideLoadingState();
        
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        hideLoadingState();
        showErrorState('Erro ao carregar dados do dashboard');
    }
}

// Animate number counting
function animateNumberCounting(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startValue = 0;
    const duration = 2000; // 2 seconds
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = startValue + (targetValue - startValue) * easeOutQuart;
        
        element.textContent = `R$ ${currentValue.toFixed(2)}`;
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// Show loading state
function showLoadingState() {
    const summaryCards = document.querySelectorAll('.summary-card');
    summaryCards.forEach(card => {
        const valueElement = card.querySelector('.summary-value');
        if (valueElement) {
            valueElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            valueElement.classList.add('loading');
        }
    });
}

// Hide loading state
function hideLoadingState() {
    const summaryCards = document.querySelectorAll('.summary-card');
    summaryCards.forEach(card => {
        const valueElement = card.querySelector('.summary-value');
        if (valueElement) {
            valueElement.classList.remove('loading');
        }
    });
}
// Atualiza badges de tendência (%). Esconde quando não houver base
function updateTrend(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    const icon = el.querySelector('i');
    const span = el.querySelector('span');
    if (value === null || value === undefined) {
        el.style.visibility = 'hidden';
        return;
    }
    el.style.visibility = 'visible';
    const positive = Number(value) >= 0;
    el.classList.toggle('positive', positive);
    el.classList.toggle('negative', !positive);
    if (icon) icon.className = `fas ${positive ? 'fa-arrow-up' : 'fa-arrow-down'}`;
    if (span) span.textContent = `${positive ? '+' : ''}${Number(value).toFixed(1)}%`;
}


// Show error state
function showErrorState(message) {
    showToastNotification(message, 'error');
}

// Show toast notification
function showToastNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    
    let icon = 'fas fa-info-circle';
    switch(type) {
        case 'error':
            icon = 'fas fa-exclamation-triangle';
            break;
        case 'success':
            icon = 'fas fa-check-circle';
            break;
        case 'warning':
            icon = 'fas fa-exclamation-circle';
            break;
        case 'info':
        default:
            icon = 'fas fa-info-circle';
            break;
    }
    
    toast.innerHTML = `
        <div class="toast-content">
            <i class="${icon}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// Carregar transações
async function loadTransactions() {
    try {
        const response = await fetch('/api/transactions');
        transactions = await response.json();
        
        // Carregar transações recentes
        loadRecentTransactions();
        
        // Carregar tabela de transações
        loadTransactionsTable();
        
    } catch (error) {
        console.error('Erro ao carregar transações:', error);
    }
}

// Carregar metas
async function loadGoals() {
    try {
        const response = await fetch('/api/goals');
        goals = await response.json();
        loadGoalsContainer();
    } catch (error) {
        console.error('Erro ao carregar metas:', error);
    }
}

// Carregar orçamento
async function loadBudget() {
    try {
        const response = await fetch('/api/budget');
        budgetData = await response.json();
        loadBudgetCategories();
    } catch (error) {
        console.error('Erro ao carregar orçamento:', error);
    }
}

// Carregar transações recentes
function loadRecentTransactions() {
    const tbody = document.getElementById('recent-transactions');
    if (!tbody) return;

    const recentTransactions = transactions.slice(0, 5);
    
    tbody.innerHTML = recentTransactions.map(transaction => `
        <tr>
            <td>${transaction.description}</td>
            <td>${transaction.category}</td>
            <td>${formatDate(transaction.date)}</td>
            <td class="${transaction.type === 'Receita' ? 'text-receita' : 'text-despesa'}">
                ${transaction.type === 'Receita' ? '+' : '-'} R$ ${transaction.value.toFixed(2)}
            </td>
            <td>
                <span class="badge ${transaction.type === 'Receita' ? 'bg-success' : 'bg-danger'}">
                    ${transaction.type}
                </span>
            </td>
        </tr>
    `).join('');
}

// Carregar tabela de transações
function loadTransactionsTable() {
    const tbody = document.getElementById('transactions-table');
    if (!tbody) return;

    tbody.innerHTML = transactions.map(transaction => `
        <tr>
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.description}</td>
            <td>${transaction.category}</td>
            <td class="${transaction.type === 'Receita' ? 'text-receita' : 'text-despesa'}">
                ${transaction.type === 'Receita' ? '+' : '-'} R$ ${transaction.value.toFixed(2)}
            </td>
            <td>
                <span class="badge ${transaction.type === 'Receita' ? 'bg-success' : 'bg-danger'}">
                    ${transaction.type}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editTransaction(${transaction.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteTransaction(${transaction.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Carregar metas
function loadGoalsContainer() {
    const container = document.getElementById('goals-container');
    if (!container) return;

    container.innerHTML = goals.map(goal => {
        const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
        
        return `
            <div class="col-md-4 mb-3">
                <div class="card">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <i class="${goal.icon} fa-2x me-3 text-primary"></i>
                            <div>
                                <h6 class="mb-0">${goal.title}</h6>
                                <small class="text-muted">${daysLeft} dias restantes</small>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <small>R$ ${goal.current.toLocaleString()}</small>
                                <small>R$ ${goal.target.toLocaleString()}</small>
                            </div>
                            <div class="progress" style="height: 8px;">
                                <div class="progress-bar" role="progressbar" style="width: ${goal.progress}%" 
                                     aria-valuenow="${goal.progress}" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                        </div>
                        <div class="d-flex justify-content-between">
                            <small class="text-muted">${goal.progress.toFixed(1)}% concluído</small>
                            <button class="btn btn-sm btn-outline-primary" onclick="updateGoalProgress(${goal.id})">
                                Atualizar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Carregar orçamento
function loadBudgetCategories() {
    const container = document.getElementById('budget-categories');
    if (!container) return;

    container.innerHTML = budgetData.map(item => {
        const statusClass = item.progress > 90 ? 'text-danger' : item.progress > 70 ? 'text-warning' : 'text-success';
        
        return `
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-1">
                    <span>${item.category}</span>
                    <span class="${statusClass}">R$ ${item.spent} / R$ ${item.budget}</span>
                </div>
                <div class="progress" style="height: 6px;">
                    <div class="progress-bar ${item.progress > 90 ? 'bg-danger' : item.progress > 70 ? 'bg-warning' : 'bg-success'}" 
                         role="progressbar" style="width: ${Math.min(item.progress, 100)}%" 
                         aria-valuenow="${item.progress}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </div>
        `;
    }).join('');
}

// Inicializar gráficos
function initializeCharts() {
    // Verificar se Chart.js está carregado
    if (typeof Chart === "undefined") {
        console.error("Chart.js não está carregado!");
        setTimeout(initializeCharts, 100); // Tentar novamente
        return;
    }
    // Gráfico de Fluxo de Caixa
    const cashFlowCtx = document.getElementById('cashFlowChart');
    if (cashFlowCtx) {
        charts.cashFlow = new Chart(cashFlowCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Receitas',
                    borderColor: '#00b4d8',
                    backgroundColor: 'rgba(0, 180, 216, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Despesas',
                    borderColor: '#f94144',
                    backgroundColor: 'rgba(249, 65, 68, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#1a202c'
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            color: '#1a202c'
                        },
                        grid: {
                            color: '#2d3748'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#1a202c'
                        },
                        grid: {
                            color: '#2d3748'
                        }
                    }
                }
            }
        });
    }

    // Gráfico de Despesas (Pizza)
    const expensesCtx = document.getElementById('expensesChart');
    if (expensesCtx) {
        charts.expenses = new Chart(expensesCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#ff6b6b',
                        '#4ecdc4',
                        '#45b7d1',
                        '#96ceb4',
                        '#feca57'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#1a202c'
                        }
                    }
                }
            }
        });
    }

    // Gráfico de Orçamento
    const budgetCtx = document.getElementById('budgetChart');
    if (budgetCtx) {
        charts.budget = new Chart(budgetCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Orçado',
                    backgroundColor: '#0077b6'
                }, {
                    label: 'Gasto',
                    backgroundColor: '#f94144'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#1a202c'
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            color: '#1a202c'
                        },
                        grid: {
                            color: '#2d3748'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#1a202c'
                        },
                        grid: {
                            color: '#2d3748'
                        }
                    }
                }
            }
        });
    }

    // Gráfico de Relatório Mensal
    const monthlyReportCtx = document.getElementById('monthlyReportChart');
    if (monthlyReportCtx) {
        charts.monthlyReport = new Chart(monthlyReportCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Saldo',
                    backgroundColor: '#90be6d'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#1a202c'
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            color: '#1a202c'
                        },
                        grid: {
                            color: '#2d3748'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#1a202c'
                        },
                        grid: {
                            color: '#2d3748'
                        }
                    }
                }
            }
        });
    }

    // Gráfico de Tendências
    const trendsCtx = document.getElementById('trendsChart');
    if (trendsCtx) {
        charts.trends = new Chart(trendsCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Economia Mensal',
                    borderColor: '#90be6d',
                    backgroundColor: 'rgba(144, 190, 109, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#1a202c'
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            color: '#1a202c'
                        },
                        grid: {
                            color: '#2d3748'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#1a202c'
                        },
                        grid: {
                            color: '#2d3748'
                        }
                    }
                }
            }
        });
    }
}

// Atualizar gráficos com dados
function updateCharts() {
    if (charts.cashFlow && dashboardData.months_data) {
        const months = dashboardData.months_data.map(d => d.month);
        const receitas = dashboardData.months_data.map(d => d.receitas);
        const despesas = dashboardData.months_data.map(d => d.despesas);
        
        charts.cashFlow.data.labels = months;
        charts.cashFlow.data.datasets[0].data = receitas;
        charts.cashFlow.data.datasets[1].data = despesas;
        charts.cashFlow.update();
    }

    if (charts.expenses && dashboardData.categorias_despesas) {
        const categorias = dashboardData.categorias_despesas.map(d => d.categoria);
        const valores = dashboardData.categorias_despesas.map(d => d.total);
        
        charts.expenses.data.labels = categorias;
        charts.expenses.data.datasets[0].data = valores;
        charts.expenses.update();
    }

    if (charts.budget && budgetData.length > 0) {
        const categorias = budgetData.map(d => d.category);
        const orcado = budgetData.map(d => d.budget);
        const gasto = budgetData.map(d => d.spent);
        
        charts.budget.data.labels = categorias;
        charts.budget.data.datasets[0].data = orcado;
        charts.budget.data.datasets[1].data = gasto;
        charts.budget.update();
    }
}

// Event listeners
function initializeEventListeners() {
    // Form de transação
    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await addTransaction(this);
        });
    }

    // Form de meta
    const goalForm = document.getElementById('goalForm');
    if (goalForm) {
        goalForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await addGoal(this);
        });
    }

    // Form de orçamento
    const budgetForm = document.getElementById('budgetForm');
    if (budgetForm) {
        budgetForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await addBudget(this);
        });
    }

    // Preencher categorias quando abrir o modal de edição
    const editBudgetModal = document.getElementById('editBudgetModal');
    if (editBudgetModal) {
        editBudgetModal.addEventListener('show.bs.modal', function() {
            const sel = document.getElementById('edit-budget-category');
            if (!sel) return;
            sel.innerHTML = (budgetData || []).map(b => `<option>${b.category}</option>`).join('');
        });
    }

    // Form de edição de orçamento
    const editBudgetForm = document.getElementById('editBudgetForm');
    if (editBudgetForm) {
        editBudgetForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            try {
                const formData = new FormData(this);
                const payload = {
                    category: formData.get('category'),
                    budget_amount: parseFloat(formData.get('budget_amount'))
                };
                const resp = await fetch('/api/budget', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await resp.json();
                if (resp.ok && result.success) {
                    alert('Orçamento atualizado.');
                    const modal = bootstrap.Modal.getInstance(document.getElementById('editBudgetModal'));
                    if (modal) modal.hide();
                    await loadBudget();
                    loadBudgetCategories();
                    updateCharts();
                } else {
                    alert(result.message || 'Falha ao atualizar orçamento.');
                }
            } catch (err) {
                console.error('Erro ao editar orçamento:', err);
                alert('Erro ao editar orçamento');
            }
        });
    }
}

// Adicionar transação
async function addTransaction(form) {
    try {
        const formData = new FormData(form);
        const data = {
            description: formData.get('description'),
            value: parseFloat(formData.get('value')),
            category: formData.get('category'),
            type: formData.get('type'),
            date: formData.get('date')
        };

        const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
            const modal = bootstrap.Modal.getInstance(document.getElementById('addTransactionModal'));
            modal.hide();
            form.reset();
            
            // Recarregar dados
            await loadDashboardData();
            await loadTransactions();
        } else {
            alert('Erro: ' + result.message);
        }
    } catch (error) {
        console.error('Erro ao adicionar transação:', error);
        alert('Erro ao adicionar transação');
    }
}

// Adicionar meta
async function addGoal(form) {
    try {
        const formData = new FormData(form);
        const data = {
            title: formData.get('title'),
            target: parseFloat(formData.get('target')),
            current: parseFloat(formData.get('current')),
            deadline: formData.get('deadline')
        };

        const response = await fetch('/api/goals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
            const modal = bootstrap.Modal.getInstance(document.getElementById('addGoalModal'));
            modal.hide();
            form.reset();
            
            // Recarregar dados
            await loadGoals();
        } else {
            alert('Erro: ' + result.message);
        }
    } catch (error) {
        console.error('Erro ao adicionar meta:', error);
        alert('Erro ao adicionar meta');
    }
}

// Adicionar orçamento
async function addBudget(form) {
    try {
        const formData = new FormData(form);
        const data = {
            category: formData.get('category'),
            budget_amount: parseFloat(formData.get('budget_amount'))
        };

        const response = await fetch('/api/budget', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
            const modal = bootstrap.Modal.getInstance(document.getElementById('addBudgetModal'));
            modal.hide();
            form.reset();
            
            // Recarregar dados
            await loadBudget();
            updateCharts();
        } else {
            alert('Erro: ' + result.message);
        }
    } catch (error) {
        console.error('Erro ao adicionar orçamento:', error);
        alert('Erro ao adicionar orçamento');
    }
}

// Deletar transação
async function deleteTransaction(id) {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
        try {
            const response = await fetch(`/api/transactions/${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            
            if (result.success) {
                alert(result.message);
                await loadDashboardData();
                await loadTransactions();
            } else {
                alert('Erro: ' + result.message);
            }
        } catch (error) {
            console.error('Erro ao deletar transação:', error);
            alert('Erro ao deletar transação');
        }
    }
}

// Atualizar progresso da meta
async function updateGoalProgress(goalId) {
    const newValue = prompt('Digite o novo valor atual da meta:');
    if (newValue !== null) {
        try {
            const response = await fetch(`/api/goals/${goalId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ current: parseFloat(newValue) })
            });

            const result = await response.json();
            
            if (result.success) {
                alert(result.message);
                await loadGoals();
            } else {
                alert('Erro: ' + result.message);
            }
        } catch (error) {
            console.error('Erro ao atualizar meta:', error);
            alert('Erro ao atualizar meta');
        }
    }
}

// Filtrar transações
window.filterTransactions = function filterTransactions() {
    const search = document.getElementById('search-transaction').value.toLowerCase();
    const category = document.getElementById('filter-category').value;
    const type = document.getElementById('filter-type').value;

    const filteredTransactions = transactions.filter(transaction => {
        const matchesSearch = transaction.description.toLowerCase().includes(search);
        const matchesCategory = !category || transaction.category === category;
        const matchesType = !type || transaction.type === type;
        
        return matchesSearch && matchesCategory && matchesType;
    });

    const tbody = document.getElementById('transactions-table');
    if (tbody) {
        tbody.innerHTML = filteredTransactions.map(transaction => `
            <tr>
                <td>${formatDate(transaction.date)}</td>
                <td>${transaction.description}</td>
                <td>${transaction.category}</td>
                <td class="${transaction.type === 'Receita' ? 'text-receita' : 'text-despesa'}">
                    ${transaction.type === 'Receita' ? '+' : '-'} R$ ${transaction.value.toFixed(2)}
                </td>
                <td>
                    <span class="badge ${transaction.type === 'Receita' ? 'bg-success' : 'bg-danger'}">
                        ${transaction.type}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editTransaction(${transaction.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteTransaction(${transaction.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
}

// Funções utilitárias
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function editTransaction(id) {
    // Implementar edição de transação
    alert(`Editando transação ${id} - Funcionalidade em desenvolvimento`);
}

// Atualizar dados a cada 30 segundos
setInterval(loadDashboardData, 30000);

// Funções do Assistente IA
let chatHistory = [];

// Enviar mensagem para o chat
async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Adicionar mensagem do usuário
    addMessageToChat('user', message);
    input.value = '';
    
    // Mostrar indicador de digitação
    showTypingIndicator();
    
    try {
        // Enviar para o MCP
        const response = await fetch(`${MCP_API_BASE}/ai/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: message, user_id: currentUserId || undefined })
        });
        
        const result = await response.json();
        
        // Esconder indicador de digitação
        hideTypingIndicator();
        
        // Adicionar resposta da IA
        addMessageToChat('ai', result.response);
        
        // Executar ações se houver
        if (result.actions && result.actions.length > 0) {
            executeActions(result.actions);
        }
        
        // Atualizar insights rápidos
        updateQuickInsights();
        
    } catch (error) {
        hideTypingIndicator();
        addMessageToChat('ai', 'Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.');
        console.error('Erro no chat:', error);
    }
}

// Adicionar mensagem ao chat
function addMessageToChat(sender, message) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = sender === 'user' ? 'user-message' : 'ai-message';
    
    const icon = sender === 'user' ? 'fas fa-user' : 'fas fa-robot';
    const bgClass = sender === 'user' ? 'bg-secondary' : 'chat-bubble-ai';
    
    // Formatar mensagem da IA
    const formattedMessage = sender === 'ai' ? formatAIResponse(message) : message;
    
    messageDiv.innerHTML = `
        <div class="d-flex align-items-start">
            <i class="${icon} text-primary me-2 mt-1"></i>
            <div class="${bgClass} p-3 rounded">
                <div class="mb-0">${formattedMessage}</div>
                <small class="text-muted d-block mt-1">${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</small>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    
    // Scroll para baixo
    const chatContainer = document.getElementById('chat-container');
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Adicionar ao histórico
    chatHistory.push({ sender, message, timestamp: new Date() });
    
    // Adicionar efeito de digitação para mensagens da IA
    if (sender === 'ai') {
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(10px)';
        setTimeout(() => {
            messageDiv.style.transition = 'all 0.3s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        }, 100);
    }
}

// Função para formatar resposta da IA
function formatAIResponse(text) {
    // Verificar se text existe e é uma string
    if (!text || typeof text !== 'string') {
        return '<p>Resposta não disponível</p>';
    }
    
    // Converter markdown básico para HTML
    let formatted = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/• (.*?)(?=\n|$)/g, '<li>$1</li>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
    
    // Adicionar emojis dinâmicos baseados no conteúdo
    if (text.includes('saldo') || text.includes('dinheiro')) {
        formatted = '💰 ' + formatted;
    } else if (text.includes('gasto') || text.includes('despesa')) {
        formatted = '💸 ' + formatted;
    } else if (text.includes('meta') || text.includes('objetivo')) {
        formatted = '🎯 ' + formatted;
    } else if (text.includes('relatório') || text.includes('análise')) {
        formatted = '📊 ' + formatted;
    } else if (text.includes('economia') || text.includes('poupança')) {
        formatted = '💡 ' + formatted;
    }
    
    return '<p>' + formatted + '</p>';
}

// Mostrar indicador de digitação
function showTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'ai-message typing-indicator';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="d-flex align-items-start">
            <i class="fas fa-robot text-primary me-2 mt-1"></i>
            <div class="chat-bubble-ai p-3">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    
    const chatContainer = document.getElementById('chat-container');
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Esconder indicador de digitação
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Executar ações da IA
function executeActions(actions) {
    actions.forEach(action => {
        switch (action.type) {
            case 'show_balance':
                // Atualizar cards de saldo
                if (action.data.saldo) {
                    document.getElementById('saldo-total').textContent = `R$ ${action.data.saldo.toFixed(2)}`;
                }
                break;
            case 'show_category_analysis':
                // Mostrar análise de categoria
                showCategoryAnalysis(action.data);
                break;
            case 'suggest_goals':
                // Sugerir metas
                suggestGoals();
                break;
            case 'prompt_add_data':
                // Levar usuário ao cadastro de nova transação
                try {
                    const link = document.querySelector('.nav-link[data-section="transactions"]');
                    if (link) link.click();
                    const el = document.getElementById('addTransactionModal');
                    if (el && window.bootstrap) { new bootstrap.Modal(el).show(); }
                } catch (_) {}
                break;
            case 'navigate_to_section': {
                const section = action.data?.section;
                const openModal = !!action.data?.openModal;
                const selector = {
                    'dashboard': '.nav-link[data-section="dashboard"]',
                    'transactions': '.nav-link[data-section="transactions"]',
                    'budget': '.nav-link[data-section="budget"]',
                    'goals': '.nav-link[data-section="goals"]',
                    'reports': '.nav-link[data-section="reports"]'
                }[section];
                if (selector) {
                    const link = document.querySelector(selector);
                    if (link) link.click();
                }
                if (openModal) {
                    const el = document.getElementById('addTransactionModal');
                    if (el && window.bootstrap) { try { new bootstrap.Modal(el).show(); } catch(e) {} }
                }
                break;
            }
        }
    });
}

// Mostrar análise de categoria
function showCategoryAnalysis(data) {
    const insightCard = document.createElement('div');
    insightCard.className = 'insight-card warning';
    insightCard.innerHTML = `
        <h6><i class="fas fa-chart-pie"></i> Análise de Categoria</h6>
        <p class="mb-1">Maior gasto: <strong>${data.categoria}</strong></p>
        <p class="mb-0">Valor: <strong>R$ ${data.valor.toFixed(2)}</strong></p>
    `;
    
    const quickInsights = document.getElementById('quick-insights');
    quickInsights.appendChild(insightCard);
}

// Sugerir metas
function suggestGoals() {
    const insightCard = document.createElement('div');
    insightCard.className = 'insight-card positive';
    insightCard.innerHTML = `
        <h6><i class="fas fa-bullseye"></i> Sugestão de Metas</h6>
        <p class="mb-1">Considere criar metas financeiras para:</p>
        <ul class="mb-0">
            <li>Reserva de emergência</li>
            <li>Viagem dos sonhos</li>
            <li>Entrada de imóvel</li>
        </ul>
    `;
    
    const quickInsights = document.getElementById('quick-insights');
    quickInsights.appendChild(insightCard);
}

// Ações rápidas
window.quickAction = async function quickAction(action) {
    let query = '';
    
    switch (action) {
        case 'saldo':
            query = 'Como está meu saldo atual?';
            break;
        case 'categorias':
            query = 'Quais são minhas maiores despesas por categoria?';
            break;
        case 'metas':
            query = 'Como estão minhas metas financeiras?';
            break;
        case 'relatorio':
            query = 'Gere um relatório completo do mês atual';
            break;
    }
    
    if (query) {
        document.getElementById('chat-input').value = query;
        await sendMessage();
    }
}

// Atualizar insights rápidos
async function updateQuickInsights() {
    try {
        const response = await fetch(`${MCP_API_BASE}/reports/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                report_type: 'quick_insights',
                period: 'current_month',
                insights: true
            })
        });
        
        const result = await response.json();
        
        const quickInsights = document.getElementById('quick-insights');
        quickInsights.innerHTML = '';
        
        // Adicionar insights principais
        if (Array.isArray(result.insights) && result.insights.length > 0) {
            result.insights.slice(0, 3).forEach(insight => {
                const insightCard = document.createElement('div');
                insightCard.className = 'insight-card positive';
                insightCard.innerHTML = `
                    <p class="mb-0"><i class="fas fa-lightbulb"></i> ${insight}</p>
                `;
                quickInsights.appendChild(insightCard);
            });
        }
        
        // Adicionar recomendações
        if (Array.isArray(result.recommendations) && result.recommendations.length > 0) {
            result.recommendations.slice(0, 2).forEach(recommendation => {
                const insightCard = document.createElement('div');
                insightCard.className = 'insight-card warning';
                insightCard.innerHTML = `
                    <p class="mb-0"><i class="fas fa-star"></i> ${recommendation}</p>
                `;
                quickInsights.appendChild(insightCard);
            });
        }
        // Se nada foi exibido, mostrar orientação para cadastrar dados
        if (quickInsights.children.length === 0) {
            quickInsights.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-info-circle text-muted"></i>
                    <p class="text-muted">Sem dados no período. Cadastre transações para gerar insights.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao atualizar insights:', error);
        const quickInsights = document.getElementById('quick-insights');
        quickInsights.innerHTML = `
            <div class="text-center">
                <i class="fas fa-exclamation-triangle text-warning"></i>
                <p class="text-muted">Erro ao carregar insights</p>
            </div>
        `;
    }
}

// Event listener para Enter no chat
document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // Busca em tempo real e filtros de transações
    const searchTx = document.getElementById('search-transaction');
    if (searchTx) searchTx.addEventListener('input', () => window.filterTransactions && filterTransactions());
    const filterCat = document.getElementById('filter-category');
    if (filterCat) filterCat.addEventListener('change', () => window.filterTransactions && filterTransactions());
    const filterType = document.getElementById('filter-type');
    if (filterType) filterType.addEventListener('change', () => window.filterTransactions && filterTransactions());

    // Carregar insights iniciais, mas esconder se lista vier vazia
    updateQuickInsights();
    // Buscar identidade do usuário
    fetch('/api/me').then(r => r.json()).then(me => {
        if (me && me.authenticated) {
            currentUserId = me.user_id;
        }
    }).catch(() => {});
});

// ========== FUNCOES DE IA ==========

// Função para lidar com Enter no chat
function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Função para perguntas rápidas no chat
function quickChatQuestion(question) {
    const input = document.getElementById('chat-input');
    input.value = question;
    sendMessage();
}

// Função para gerar relatórios
async function generateReport() {
    const period = document.getElementById('report-period').value;
    const type = document.getElementById('report-type').value;
    const format = document.getElementById('report-format').value;
    
    console.log('Gerando relatório com:', { period, type, format });
    
    try {
        // Mostrar loading
        showLoading('Gerando relatório...');
        
        const response = await fetch(`${MCP_API_BASE}/reports/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                period: period,
                report_type: type,
                insights: true,
                user_id: currentUserId || undefined
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('Resultado da API:', result); // Debug
            
            // Aplicar formato selecionado
            applyReportFormat(format, result.data);
            
            // Aplicar tipo de relatório específico
            applyReportType(type, result.data);
            
            showSuccess('Relatório gerado com sucesso!');
        } else {
            throw new Error(result.detail || 'Erro ao gerar relatório');
        }
        
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        showError('Erro ao gerar relatório. Tente novamente.');
    } finally {
        hideLoading();
    }
}

// Função para aplicar tipo de relatório específico
function applyReportType(type, data) {
    console.log('Aplicando tipo de relatório:', type);
    
    switch(type) {
        case 'category':
            // Focar em análise por categoria
            if (window.categoryChart) {
                // Destacar gráfico de categorias
                document.getElementById('categoryChart').scrollIntoView({ behavior: 'smooth' });
            }
            break;
            
        case 'trends':
            // Focar em análise de tendências
            if (window.trendsChart) {
                // Destacar gráfico de tendências
                document.getElementById('trendsChart').scrollIntoView({ behavior: 'smooth' });
            }
            break;
            
        case 'financial':
        default:
            // Focar em análise financeira geral
            if (window.monthlyChart) {
                // Destacar gráfico mensal
                document.getElementById('monthlyReportChart').scrollIntoView({ behavior: 'smooth' });
            }
            break;
    }
}

// Função para aplicar formato do relatório
function applyReportFormat(format, data) {
    console.log('Aplicando formato:', format);
    console.log('Dados recebidos:', data);
    
    // Sempre mostrar o resumo estatístico
    updateReportSummary(data.summary);
    
    switch(format) {
        case 'chart':
            // Mostrar apenas gráficos
            updateReportCharts(data);
            document.getElementById('report-charts').style.display = 'block';
            document.getElementById('report-table').style.display = 'none';
            break;
            
        case 'table':
            // Mostrar apenas tabela
            updateReportTable(data);
            document.getElementById('report-charts').style.display = 'none';
            document.getElementById('report-table').style.display = 'block';
            break;
            
        case 'summary':
            // Mostrar apenas resumo
            document.getElementById('report-charts').style.display = 'none';
            document.getElementById('report-table').style.display = 'none';
            break;
            
        default:
            // Formato padrão (gráficos + resumo)
            updateReportCharts(data);
            document.getElementById('report-charts').style.display = 'block';
            document.getElementById('report-table').style.display = 'none';
    }
}

// Função para atualizar gráficos do relatório
function updateReportCharts(data) {
    // Gráfico mensal
    updateMonthlyChart(data);
    
    // Gráfico de categorias
    updateCategoryChart(data);
    
    // Gráfico de tendências
    updateTrendsChart(data);
}

// Função para atualizar gráfico mensal
function updateMonthlyChart(data) {
    const canvas = document.getElementById('monthlyReportChart');
    const ctx = canvas.getContext('2d');
    
    // Destruir gráfico existente se houver
    if (window.monthlyChart && typeof window.monthlyChart.destroy === 'function') {
        window.monthlyChart.destroy();
        window.monthlyChart = null;
    }
    
    // Limpar canvas completamente
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Remover canvas do DOM e recriar
    const parent = canvas.parentNode;
    const newCanvas = document.createElement('canvas');
    newCanvas.id = canvas.id;
    newCanvas.height = canvas.height;
    parent.replaceChild(newCanvas, canvas);
    
    const monthlyData = data.temporal?.gastos_mensais || {};
    const months = Object.keys(monthlyData);
    const values = Object.values(monthlyData);
    
    window.monthlyChart = new Chart(newCanvas, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Gastos Mensais',
                data: values,
                borderColor: '#0ea5e9',
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#1a202c'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#1a202c',
                        callback: function(value) {
                            return 'R$ ' + value.toLocaleString('pt-BR');
                        }
                    }
                },
                x: {
                    ticks: {
                        color: '#1a202c'
                    }
                }
            }
        }
    });
}

// Função para atualizar gráfico de categorias
function updateCategoryChart(data) {
    const canvas = document.getElementById('categoryChart');
    const ctx = canvas.getContext('2d');
    
    if (window.categoryChart && typeof window.categoryChart.destroy === 'function') {
        window.categoryChart.destroy();
        window.categoryChart = null;
    }
    
    // Limpar canvas completamente
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Remover canvas do DOM e recriar
    const parent = canvas.parentNode;
    const newCanvas = document.createElement('canvas');
    newCanvas.id = canvas.id;
    newCanvas.height = canvas.height;
    parent.replaceChild(newCanvas, canvas);
    
    const categoryData = data.by_category?.despesas || {};
    const labels = Object.keys(categoryData);
    const values = Object.values(categoryData);
    
    const colors = [
        '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
        '#3b82f6', '#8b5cf6', '#ec4899', '#84cc16', '#f59e0b'
    ];
    
    window.categoryChart = new Chart(newCanvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#1a202c',
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return context.label + ': R$ ' + value.toLocaleString('pt-BR') + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

// Função para atualizar gráfico de tendências
function updateTrendsChart(data) {
    const canvas = document.getElementById('trendsChart');
    const ctx = canvas.getContext('2d');
    
    if (window.trendsChart && typeof window.trendsChart.destroy === 'function') {
        window.trendsChart.destroy();
        window.trendsChart = null;
    }
    
    // Limpar canvas completamente
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Remover canvas do DOM e recriar
    const parent = canvas.parentNode;
    const newCanvas = document.createElement('canvas');
    newCanvas.id = canvas.id;
    newCanvas.height = canvas.height;
    parent.replaceChild(newCanvas, canvas);
    
    const monthlyData = data.temporal?.gastos_mensais || {};
    const months = Object.keys(monthlyData);
    const expenses = Object.values(monthlyData);
    
    // Simular receitas (assumindo 20% a mais que despesas)
    const income = expenses.map(exp => exp * 1.2);
    const balance = income.map((inc, i) => inc - expenses[i]);
    
    window.trendsChart = new Chart(newCanvas, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Receitas',
                    data: income,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Despesas',
                    data: expenses,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Saldo',
                    data: balance,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#1a202c'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#1a202c',
                        callback: function(value) {
                            return 'R$ ' + value.toLocaleString('pt-BR');
                        }
                    }
                },
                x: {
                    ticks: {
                        color: '#1a202c'
                    }
                }
            }
        }
    });
}

// Função para atualizar resumo estatístico
function updateReportSummary(summary) {
    // Verificar se summary existe e tem as propriedades necessárias
    if (!summary) {
        console.error('Summary não disponível');
        return;
    }
    
    const balanceElement = document.getElementById('report-balance');
    const incomeElement = document.getElementById('report-income');
    const expensesElement = document.getElementById('report-expenses');
    
    if (balanceElement) {
        balanceElement.textContent = 'R$ ' + (summary.saldo || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2});
    }
    if (incomeElement) {
        incomeElement.textContent = 'R$ ' + (summary.total_receitas || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2});
    }
    if (expensesElement) {
        expensesElement.textContent = 'R$ ' + (summary.total_despesas || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2});
    }
}

// Função para limpar todos os gráficos
function clearAllCharts() {
    if (window.monthlyChart && typeof window.monthlyChart.destroy === 'function') {
        window.monthlyChart.destroy();
        window.monthlyChart = null;
    }
    if (window.categoryChart && typeof window.categoryChart.destroy === 'function') {
        window.categoryChart.destroy();
        window.categoryChart = null;
    }
    if (window.trendsChart && typeof window.trendsChart.destroy === 'function') {
        window.trendsChart.destroy();
        window.trendsChart = null;
    }
}

// Função para atualizar tabela de relatório
function updateReportTable(data) {
    const tableContainer = document.getElementById('report-table');
    if (!tableContainer) return;
    
    // Criar tabela HTML
    let tableHTML = `
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">
                    <i class="fas fa-table text-primary"></i>
                    Relatório em Tabela
                </h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Descrição</th>
                                <th>Valor</th>
                                <th>Categoria</th>
                                <th>Tipo</th>
                                <th>Data</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    // Adicionar dados das transações
    if (data.transactions && Array.isArray(data.transactions)) {
        data.transactions.forEach(transaction => {
            const value = transaction.value || 0;
            const typeClass = transaction.type === 'Receita' ? 'text-success' : 'text-danger';
            const typeIcon = transaction.type === 'Receita' ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
            
            tableHTML += `
                <tr>
                    <td>${transaction.description || 'N/A'}</td>
                    <td class="${typeClass}">
                        <i class="${typeIcon}"></i>
                        R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </td>
                    <td>
                        <span class="badge bg-secondary">${transaction.category || 'N/A'}</span>
                    </td>
                    <td>
                        <span class="badge ${transaction.type === 'Receita' ? 'bg-success' : 'bg-danger'}">
                            ${transaction.type || 'N/A'}
                        </span>
                    </td>
                    <td>${transaction.date ? new Date(transaction.date).toLocaleDateString('pt-BR') : 'N/A'}</td>
                </tr>
            `;
        });
    }
    
    tableHTML += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    tableContainer.innerHTML = tableHTML;
}

// Funções para alternar tipos de gráfico
function switchChartType(type) {
    console.log('Alternando tipo de gráfico para:', type);
    
    // Alternar gráfico mensal
    if (window.monthlyChart) {
        const canvas = document.getElementById('monthlyReportChart');
        const ctx = canvas.getContext('2d');
        
        // Destruir gráfico atual
        window.monthlyChart.destroy();
        
        // Recriar canvas
        const parent = canvas.parentNode;
        const newCanvas = document.createElement('canvas');
        newCanvas.id = canvas.id;
        newCanvas.height = canvas.height;
        parent.replaceChild(newCanvas, canvas);
        
        // Obter dados do gráfico atual
        const currentData = window.monthlyChart.data;
        
        // Criar novo gráfico com tipo diferente
        window.monthlyChart = new Chart(newCanvas, {
            type: type,
            data: currentData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#1a202c'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#1a202c'
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#1a202c'
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                }
            }
        });
    }
    
    // Alternar gráfico de categorias
    if (window.categoryChart) {
        const canvas = document.getElementById('categoryChart');
        const ctx = canvas.getContext('2d');
        
        // Destruir gráfico atual
        window.categoryChart.destroy();
        
        // Recriar canvas
        const parent = canvas.parentNode;
        const newCanvas = document.createElement('canvas');
        newCanvas.id = canvas.id;
        newCanvas.height = canvas.height;
        parent.replaceChild(newCanvas, canvas);
        
        // Obter dados do gráfico atual
        const currentData = window.categoryChart.data;
        
        // Criar novo gráfico com tipo diferente
        window.categoryChart = new Chart(newCanvas, {
            type: type,
            data: currentData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#1a202c'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return context.label + ': R$ ' + value.toLocaleString('pt-BR') + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
    }
}

function switchTrendChart(type) {
    console.log('Alternando gráfico de tendência para:', type);
    
    if (window.trendsChart) {
        const canvas = document.getElementById('trendsChart');
        const ctx = canvas.getContext('2d');
        
        // Destruir gráfico atual
        window.trendsChart.destroy();
        
        // Recriar canvas
        const parent = canvas.parentNode;
        const newCanvas = document.createElement('canvas');
        newCanvas.id = canvas.id;
        newCanvas.height = canvas.height;
        parent.replaceChild(newCanvas, canvas);
        
        // Obter dados do gráfico atual
        const currentData = window.trendsChart.data;
        
        // Criar novo gráfico com tipo diferente
        window.trendsChart = new Chart(newCanvas, {
            type: 'line',
            data: currentData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#1a202c'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#1a202c'
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#1a202c'
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                }
            }
        });
    }
}

// Funções de notificação
function showLoading(message) {
    // Implementar loading
    console.log('Loading:', message);
}

function hideLoading() {
    // Implementar hide loading
    console.log('Hide loading');
}

function showSuccess(message) {
    // Implementar sucesso
    console.log('Success:', message);
}

function showError(message) {
    // Implementar erro
    console.log('Error:', message);
}


// Cache buster sáb 04 out 2025 16:46:34 -03
// Cache buster sáb 04 out 2025 16:46:48 -03
// Cache buster sáb 04 out 2025 16:46:59 -03
// Cache buster sáb 04 out 2025 17:00:38 -03
// Cache buster sáb 04 out 2025 17:06:30 -03
// Cache buster sáb 04 out 2025 17:19:15 -03
// Cache buster sáb 04 out 2025 17:22:50 -03
// Cache buster sáb 04 out 2025 17:27:54 -03
// Cache buster sáb 04 out 2025 17:33:28 -03
// Cache buster sáb 04 out 2025 17:40:37 -03
// Cache buster sáb 04 out 2025 17:50:47 -03
