
// Variáveis globais para armazenar dados
let dashboardData = {};
let transactions = [];
let goals = [];
let budgetData = [];
let charts = {};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeQuickActions();
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
            
            // Remove active class from all links and sections
            navLinks.forEach(l => l.classList.remove('active'));
            contentSections.forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Show corresponding section with animation
            const targetSection = this.getAttribute('data-section');
            const section = document.getElementById(targetSection + '-section');
            section.classList.add('active');
            
            // Animate section entrance
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                section.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';
            }, 50);
            
            // Scroll to top of content
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
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
                            color: '#f1f1f1'
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            color: '#f1f1f1'
                        },
                        grid: {
                            color: '#324968'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#f1f1f1'
                        },
                        grid: {
                            color: '#324968'
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
                            color: '#f1f1f1'
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
                            color: '#f1f1f1'
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            color: '#f1f1f1'
                        },
                        grid: {
                            color: '#324968'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#f1f1f1'
                        },
                        grid: {
                            color: '#324968'
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
                            color: '#f1f1f1'
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            color: '#f1f1f1'
                        },
                        grid: {
                            color: '#324968'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#f1f1f1'
                        },
                        grid: {
                            color: '#324968'
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
                            color: '#f1f1f1'
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            color: '#f1f1f1'
                        },
                        grid: {
                            color: '#324968'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#f1f1f1'
                        },
                        grid: {
                            color: '#324968'
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
function filterTransactions() {
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
        const response = await fetch('http://localhost:8000/ai/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: message })
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
    const bgClass = sender === 'user' ? 'bg-secondary' : 'bg-primary bg-opacity-25';
    
    messageDiv.innerHTML = `
        <div class="d-flex align-items-start">
            <i class="${icon} text-primary me-2 mt-1"></i>
            <div class="${bgClass} p-3 rounded">
                <p class="mb-0">${message}</p>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    
    // Scroll para baixo
    const chatContainer = document.getElementById('chat-container');
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Adicionar ao histórico
    chatHistory.push({ sender, message, timestamp: new Date() });
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
            <div class="bg-primary bg-opacity-25 p-3 rounded">
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
async function quickAction(action) {
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
        const response = await fetch('http://localhost:8000/reports/generate', {
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
        if (result.insights && result.insights.length > 0) {
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
        if (result.recommendations && result.recommendations.length > 0) {
            result.recommendations.slice(0, 2).forEach(recommendation => {
                const insightCard = document.createElement('div');
                insightCard.className = 'insight-card warning';
                insightCard.innerHTML = `
                    <p class="mb-0"><i class="fas fa-star"></i> ${recommendation}</p>
                `;
                quickInsights.appendChild(insightCard);
            });
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
    
    // Carregar insights iniciais
    updateQuickInsights();
});
