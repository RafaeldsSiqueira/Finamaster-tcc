// Variáveis globais para armazenar dados
let dashboardData = {};
let transactions = [];
let goals = [];
let budgetData = [];
let charts = {};
let aiResponses = [];
let currentUserId = null;
let prefillTransaction = null; // sugestão de preenchimento do formulário de transação

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
    
    // Atalho de teclado Ctrl+F ou Cmd+F para busca
    document.addEventListener('keydown', function(e) {
        // Ctrl+F (Windows/Linux) ou Cmd+F (Mac)
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault(); // Prevenir o padrão do navegador
            openPageSearch();
        }
    });
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
                
                // Recarregar dados ao entrar em seções específicas
                if (targetSection === 'transactions') {
                    loadTransactions();
                } else if (targetSection === 'goals') {
                    loadGoals();
                } else if (targetSection === 'budget') {
                    loadBudget();
                } else if (targetSection === 'dashboard') {
                    loadDashboardData();
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
            openPageSearch();
        });
    }
    
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function() {
            showToastNotification('Nenhuma notificação nova', 'info');
        });
    }
}

// Função para abrir busca na página (similar ao Ctrl+F)
let pageSearchInstance = null;

function openPageSearch() {
    // Se já existe uma instância, apenas focar nela
    if (pageSearchInstance) {
        const searchInput = document.getElementById('page-search-input');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
            return;
        }
    }
    
    // Criar barra de busca
    const searchBar = document.createElement('div');
    searchBar.id = 'page-search-bar';
    searchBar.innerHTML = `
        <div class="page-search-container">
            <div class="page-search-input-wrapper">
                <i class="fas fa-search"></i>
                <input 
                    type="text" 
                    id="page-search-input" 
                    class="page-search-input" 
                    placeholder="Buscar na página..."
                    autocomplete="off"
                />
                <div class="page-search-info" id="page-search-info">
                    <span id="page-search-count">0</span> resultados
                </div>
                <button class="page-search-btn" id="page-search-prev" title="Anterior (Shift+Enter)">
                    <i class="fas fa-chevron-up"></i>
                </button>
                <button class="page-search-btn" id="page-search-next" title="Próximo (Enter)">
                    <i class="fas fa-chevron-down"></i>
                </button>
                <button class="page-search-btn" id="page-search-close" title="Fechar (ESC)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(searchBar);
    pageSearchInstance = searchBar;
    
    const searchInput = document.getElementById('page-search-input');
    const searchInfo = document.getElementById('page-search-info');
    const searchCount = document.getElementById('page-search-count');
    const prevBtn = document.getElementById('page-search-prev');
    const nextBtn = document.getElementById('page-search-next');
    const closeBtn = document.getElementById('page-search-close');
    
    let currentMatchIndex = -1;
    let matches = [];
    
    // Função para destacar resultados
    function highlightMatches(searchText) {
        // Limpar array de matches antes de recriar
        matches = [];
        
        // Remover destaques anteriores - restaurar texto original
        document.querySelectorAll('.page-search-highlight, .page-search-highlight-active').forEach(el => {
            const parent = el.parentNode;
            if (parent) {
                // Criar nó de texto com o conteúdo do highlight
                const textNode = document.createTextNode(el.textContent);
                parent.replaceChild(textNode, el);
                parent.normalize();
            }
        });
        
        if (!searchText || searchText.trim().length === 0) {
            searchInfo.style.display = 'none';
            matches = [];
            currentMatchIndex = -1;
            return;
        }
        
        searchInfo.style.display = 'flex';
        
        // Buscar em todo o conteúdo visível (exceto inputs, scripts, etc)
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // Ignorar nós dentro de scripts, styles, inputs, textareas
                    const parent = node.parentElement;
                    if (!parent) return NodeFilter.FILTER_REJECT;
                    
                    const tagName = parent.tagName.toLowerCase();
                    if (['script', 'style', 'input', 'textarea', 'select', 'noscript'].includes(tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    // Ignorar se já está dentro de um highlight
                    if (parent.closest('.page-search-highlight')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );
        
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        
        matches = [];
        
        textNodes.forEach(textNode => {
            const text = textNode.textContent;
            
            // Verificar se o texto contém a busca (case-insensitive)
            if (!text.toLowerCase().includes(searchText.toLowerCase())) return;
            
            const parent = textNode.parentElement;
            const originalText = textNode.textContent;
            
            // Criar regex novo para não interferir com o anterior
            const matchRegex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            const allMatches = [...originalText.matchAll(matchRegex)];
            
            if (allMatches.length === 0) return;
            
            const fragment = document.createDocumentFragment();
            let lastIndex = 0;
            
            allMatches.forEach((match) => {
                // Adicionar texto antes do match
                if (match.index > lastIndex) {
                    fragment.appendChild(document.createTextNode(originalText.substring(lastIndex, match.index)));
                }
                
                // Adicionar highlight do match
                const highlight = document.createElement('mark');
                highlight.className = 'page-search-highlight';
                highlight.textContent = match[0];
                matches.push(highlight);
                fragment.appendChild(highlight);
                
                lastIndex = match.index + match[0].length;
            });
            
            // Adicionar texto restante após o último match
            if (lastIndex < originalText.length) {
                fragment.appendChild(document.createTextNode(originalText.substring(lastIndex)));
            }
            
            parent.replaceChild(fragment, textNode);
        });
        
        if (matches.length > 0) {
            searchCount.textContent = matches.length;
            currentMatchIndex = 0;
            // Pequeno delay para garantir que os elementos foram renderizados
            setTimeout(() => {
                scrollToMatch(0);
            }, 100);
        } else {
            searchCount.textContent = '0';
            currentMatchIndex = -1;
        }
    }
    
    // Função para rolar até o match
    function scrollToMatch(index) {
        if (index < 0 || index >= matches.length || matches.length === 0) {
            return;
        }
        
        // Obter todos os highlights atuais do DOM (caso o array esteja desatualizado)
        const allHighlights = Array.from(document.querySelectorAll('.page-search-highlight, .page-search-highlight-active'));
        
        // Se não encontramos highlights no DOM, algo deu errado
        if (allHighlights.length === 0) {
            console.warn('Nenhum highlight encontrado no DOM. Recarregando busca...');
            return;
        }
        
        // Remover highlight ativo de todos os elementos
        allHighlights.forEach((highlight) => {
            if (highlight && highlight.classList) {
                highlight.classList.remove('page-search-highlight-active');
                highlight.classList.add('page-search-highlight');
            }
        });
        
        // Selecionar o match atual (usar índice relativo se o array não corresponder ao DOM)
        let activeMatch;
        if (index < allHighlights.length) {
            activeMatch = allHighlights[index];
        } else if (index < matches.length && matches[index]) {
            activeMatch = matches[index];
        } else {
            console.warn('Índice de match inválido:', index);
            return;
        }
        
        // Verificar se o elemento ainda existe no DOM
        if (!activeMatch || !activeMatch.isConnected) {
            console.warn('Match não está mais no DOM. Recarregando busca...');
            // Recarregar highlights
            const currentSearchText = searchInput.value;
            if (currentSearchText) {
                highlightMatches(currentSearchText);
                if (matches.length > 0) {
                    scrollToMatch(Math.min(index, matches.length - 1));
                }
            }
            return;
        }
        
        // Aplicar classe ativa
        activeMatch.classList.remove('page-search-highlight');
        activeMatch.classList.add('page-search-highlight-active');
        
        // Forçar reflow para garantir que as classes foram aplicadas
        void activeMatch.offsetHeight;
        
        // Função auxiliar para fazer scroll até o elemento
        const scrollToElement = (element) => {
            if (!element) return;
            
            // Obter posição do elemento
            const rect = element.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
            
            // Calcular posição central considerando a altura da barra de busca
            const searchBarHeight = pageSearchInstance ? pageSearchInstance.offsetHeight : 80;
            const elementTop = rect.top + scrollTop;
            const elementLeft = rect.left + scrollLeft;
            
            // Calcular posição central na viewport
            const centerY = window.innerHeight / 2;
            const targetY = elementTop - centerY + (rect.height / 2) + searchBarHeight;
            
            // Fazer scroll usando window.scrollTo para mais controle
            window.scrollTo({
                top: Math.max(0, targetY),
                left: elementLeft,
                behavior: 'smooth'
            });
            
            // Garantir visibilidade após scroll (fallback)
            setTimeout(() => {
                if (element && element.isConnected) {
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });
                }
            }, 150);
        };
        
        // Executar scroll
        scrollToElement(activeMatch);
        
        currentMatchIndex = index;
        
        // Atualizar contador mostrando qual resultado está sendo exibido
        if (allHighlights.length > 0) {
            searchCount.textContent = `${index + 1} de ${allHighlights.length}`;
        }
    }
    
    // Event listeners
    searchInput.addEventListener('input', function() {
        highlightMatches(this.value);
    });
    
    prevBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (matches.length === 0) {
            showToastNotification('Nenhum resultado encontrado', 'info');
            return;
        }
        const newIndex = currentMatchIndex <= 0 ? matches.length - 1 : currentMatchIndex - 1;
        scrollToMatch(newIndex);
    });
    
    nextBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (matches.length === 0) {
            showToastNotification('Nenhum resultado encontrado', 'info');
            return;
        }
        const newIndex = currentMatchIndex >= matches.length - 1 ? 0 : currentMatchIndex + 1;
        scrollToMatch(newIndex);
    });
    
    closeBtn.addEventListener('click', closePageSearch);
    
    // Atalhos de teclado
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) {
                prevBtn.click();
            } else {
                nextBtn.click();
            }
        } else if (e.key === 'Escape') {
            closePageSearch();
        }
    });
    
    // Focar no input
    setTimeout(() => {
        searchInput.focus();
        searchInput.select();
    }, 100);
    
    // Fechar ao clicar fora (mas manter se clicar dentro)
    searchBar.addEventListener('click', function(e) {
        if (e.target === searchBar) {
            closePageSearch();
        }
    });
}

function closePageSearch() {
    // Remover destaques
    document.querySelectorAll('.page-search-highlight, .page-search-highlight-active').forEach(el => {
        const parent = el.parentNode;
        if (parent) {
            parent.replaceChild(document.createTextNode(el.textContent), el);
            parent.normalize();
        }
    });
    
    // Remover barra de busca
    if (pageSearchInstance) {
        pageSearchInstance.remove();
        pageSearchInstance = null;
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
    const tbody = document.getElementById('transactions-table');
    
    // Mostrar indicador de carregamento
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                    <p class="mt-3 mb-0 text-muted">Carregando transações...</p>
                </td>
            </tr>
        `;
    }
    
    try {
        // Garantir que o usuário está autenticado
        await ensureCurrentUser();
        
        if (!currentUserId) {
            console.warn('⚠️  Usuário não autenticado. Redirecionando para login...');
            window.location.href = '/login';
            return;
        }
        
        console.log(`🔄 Carregando transações da API para usuário ${currentUserId}...`);
        const startTime = performance.now();
        
        const response = await fetch('/api/transactions', {
            credentials: 'include' // Incluir cookies de sessão
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                console.warn('⚠️  Sessão expirada. Redirecionando para login...');
                window.location.href = '/login';
                return;
            }
            throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const loadTime = ((performance.now() - startTime) / 1000).toFixed(2);
        
        // Verificar se é um array ou objeto com erro
        if (Array.isArray(data)) {
            transactions = data;
        } else if (data.transactions) {
            transactions = data.transactions;
        } else if (data.error) {
            throw new Error(data.error);
        } else {
            transactions = [];
        }
        
        console.log(`✅ ${transactions.length} transações carregadas em ${loadTime}s`);
        
        // Carregar transações recentes (sem esperar)
        loadRecentTransactions();
        
        // Carregar tabela de transações de forma otimizada
        loadTransactionsTable();
        
    } catch (error) {
        console.error('❌ Erro ao carregar transações:', error);
        // Mostrar mensagem de erro na tabela
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger py-4">
                        <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                        <p class="mb-0">Erro ao carregar transações</p>
                        <small>${error.message}</small>
                        <br><small class="text-muted">Verifique o console do navegador para mais detalhes</small>
                    </td>
                </tr>
            `;
        }
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
        // Atualizar gráfico de orçamento se já foi inicializado
        if (charts.budget && budgetData.length > 0) {
            updateCharts();
        }
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

// Carregar tabela de transações (renderização otimizada)
function loadTransactionsTable() {
    const tbody = document.getElementById('transactions-table');
    if (!tbody) {
        console.error('Elemento transactions-table não encontrado no DOM');
        return;
    }

    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="fas fa-inbox fa-2x mb-2"></i>
                    <p class="mb-0">Nenhuma transação cadastrada</p>
                    <small>Clique em "Nova Transação" para adicionar</small>
                </td>
            </tr>
        `;
        return;
    }

    console.log(`🔄 Renderizando ${transactions.length} transações na tabela...`);
    const renderStartTime = performance.now();
    
    // Renderizar em chunks para não travar o navegador
    const CHUNK_SIZE = 50; // Renderizar 50 de cada vez
    const chunks = [];
    
    for (let i = 0; i < transactions.length; i += CHUNK_SIZE) {
        chunks.push(transactions.slice(i, i + CHUNK_SIZE));
    }
    
    // Limpar tbody primeiro
    tbody.innerHTML = '';
    
    // Renderizar primeiro chunk imediatamente
    let currentChunkIndex = 0;
    
    function renderChunk(chunkIndex) {
        if (chunkIndex >= chunks.length) {
            const renderTime = ((performance.now() - renderStartTime) / 1000).toFixed(2);
            console.log(`✅ Tabela renderizada em ${renderTime}s`);
            return;
        }
        
        const chunk = chunks[chunkIndex];
        const fragment = document.createDocumentFragment();
        
            chunk.forEach(transaction => {
                const row = document.createElement('tr');
                row.innerHTML = `
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
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditTransaction(${transaction.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteTransaction(${transaction.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                fragment.appendChild(row);
            });
            
            // Adicionar fragment ao tbody
            tbody.appendChild(fragment);
            
            // Renderizar próximo chunk de forma assíncrona
            if (chunkIndex + 1 < chunks.length) {
                // Usar requestAnimationFrame para não travar o navegador
                requestAnimationFrame(() => {
                    setTimeout(() => renderChunk(chunkIndex + 1), 10);
                });
            }
        }
        
        // Iniciar renderização do primeiro chunk
        renderChunk(0);
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

    if (!budgetData || budgetData.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">Nenhum orçamento cadastrado. Clique em "+ DEFINIR ORÇAMENTO" para criar.</p>';
        return;
    }

    container.innerHTML = budgetData.map(item => {
        const statusClass = item.progress > 90 ? 'text-danger' : item.progress > 70 ? 'text-warning' : 'text-success';
        
        return `
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-1">
                    <span>${item.category}</span>
                    <span class="${statusClass}">R$ ${item.spent.toFixed(2)} / R$ ${item.budget.toFixed(2)}</span>
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

    // Prefill do formulário de Nova Transação quando o modal abrir
    const addTxModal = document.getElementById('addTransactionModal');
    if (addTxModal) {
        addTxModal.addEventListener('show.bs.modal', function() {
            try {
                if (!prefillTransaction) return;
                const form = document.getElementById('transactionForm');
                if (!form) return;
                const d = prefillTransaction;
                const today = new Date();
                const pad = n => String(n).padStart(2, '0');
                const isoDate = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
                form.querySelector('input[name="description"]').value = d.description || 'Supermercado';
                form.querySelector('input[name="value"]').value = d.value != null ? d.value : 120.00;
                form.querySelector('select[name="category"]').value = d.category || 'Alimentação';
                form.querySelector('select[name="type"]').value = d.type || 'Despesa';
                form.querySelector('input[name="date"]').value = d.date || isoDate;
            } catch (_) {}
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
        const editId = form.getAttribute('data-edit-id');
        const isEdit = !!editId;
        const url = isEdit ? `/api/transactions/${editId}` : '/api/transactions';
        const method = isEdit ? 'PUT' : 'POST';
        const response = await fetch(url, {
            method,
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
            form.removeAttribute('data-edit-id');
            
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
                <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditTransaction(${transaction.id})">
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

function openEditTransaction(id) {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return alert('Transação não encontrada');
    try {
        const form = document.getElementById('transactionForm');
        const modalEl = document.getElementById('addTransactionModal');
        if (!form || !modalEl) return;
        form.setAttribute('data-edit-id', String(id));
        form.querySelector('input[name="description"]').value = tx.description;
        form.querySelector('input[name="value"]').value = tx.value;
        form.querySelector('select[name="category"]').value = tx.category;
        form.querySelector('select[name="type"]').value = tx.type;
        form.querySelector('input[name="date"]').value = tx.date;
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    } catch (e) {
        alert('Falha ao abrir edição');
    }
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
    await ensureCurrentUser();
    
    // Normalizar mensagem para lowercase para comparações de comandos
    const messageLower = message.toLowerCase().trim();
    console.log('📤 Enviando mensagem:', message, '(normalizada:', messageLower + ')');
    
    // Adicionar mensagem do usuário (usar mensagem original para exibição)
    addMessageToChat('user', message);
    input.value = '';
    
    // Mostrar indicador de digitação
    showTypingIndicator();
    
    try {
        // Para comandos de ajuda/comandos, usar Flask diretamente (tem lógica completa)
        const helpCommands = ['ajuda', 'help', 'comandos', 'comando', 'menu', 'opções'];
        const isHelpCommand = helpCommands.some(cmd => messageLower.includes(cmd));
        
        let response;
        let result;
        
        // Se for comando de ajuda, usar Flask diretamente
        if (isHelpCommand) {
            console.log('📋 Detectado comando de ajuda, usando Flask diretamente');
            response = await fetch(`${FLASK_API_BASE}/api/ai/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: messageLower, user_id: currentUserId || undefined })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Erro ao processar mensagem');
            }
            
            result = await response.json();
            console.log('✅ Resposta recebida via Flask (comando ajuda):', result);
        } else {
            // Para outras mensagens, tentar MCP primeiro, depois Flask
            try {
                // Tentar MCP com timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                response = await fetch(`${MCP_API_BASE}/ai/analyze`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query: messageLower, user_id: currentUserId || undefined }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    result = await response.json();
                    console.log('✅ Resposta recebida via MCP:', result);
                    
                    // Verificar se a resposta do MCP é genérica - se for, tentar Flask
                    if (result.response && result.response.includes('Posso ajudar você com análises sobre')) {
                        console.log('⚠️ Resposta genérica do MCP detectada, tentando Flask...');
                        throw new Error('Generic response from MCP');
                    }
                } else {
                    throw new Error('MCP server error');
                }
            } catch (error) {
                console.warn('MCP server não disponível ou resposta genérica, usando Flask:', error);
                // Fallback para Flask - enviar messageLower para garantir detecção
                response = await fetch(`${FLASK_API_BASE}/api/ai/analyze`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query: messageLower, user_id: currentUserId || undefined })
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Erro ao processar mensagem');
                }
                
                result = await response.json();
                console.log('✅ Resposta recebida via Flask:', result);
            }
        }
        
        // Esconder indicador de digitação
        hideTypingIndicator();
        
        // Adicionar resposta da IA
        if (result.response) {
            console.log('✅ Resposta recebida:', result.response.substring(0, 100) + '...');
            addMessageToChat('ai', result.response);
        } else {
            console.warn('⚠️ Resposta vazia recebida do servidor');
            addMessageToChat('ai', 'Desculpe, não consegui processar sua pergunta. Tente novamente.');
        }
        
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
    
    // Definir cor do ícone baseado no sender
    const iconColor = sender === 'user' ? 'style="color: #ffffff !important;"' : 'style="color: #3b82f6 !important;"';
    const textColor = sender === 'user' ? 'style="color: #ffffff !important;"' : 'style="color: #1a202c !important;"';
    const timeColor = sender === 'user' ? 'style="color: rgba(255, 255, 255, 0.8) !important;"' : 'style="color: #6b7280 !important;"';
    
    // Para mensagens do usuário, garantir texto branco e ícone branco
    // Para mensagens da IA, garantir texto escuro e ícone azul
    if (sender === 'user') {
        // USUÁRIO: Texto branco, ícone branco, fundo azul
        const iconStyle = 'color: #ffffff !important; font-size: 1.2rem !important; display: inline-block !important;';
        const bubbleStyle = 'color: #ffffff !important; background: linear-gradient(135deg, #3b82f6, #2563eb) !important; border: none !important;';
        
        // Para mensagens do usuário, usar texto simples (sem HTML complexo) ou processar completamente
        let processedMessage = message; // Usar mensagem original, não formatada
        
        // Se houver HTML, processar para adicionar cor branca em TODOS os elementos
        if (formattedMessage.includes('<')) {
            // Criar um elemento temporário para processar HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = formattedMessage;
            
            // Aplicar cor branca em TODOS os elementos de texto
            const allElements = tempDiv.querySelectorAll('*');
            allElements.forEach(el => {
                el.style.setProperty('color', '#ffffff', 'important');
            });
            
            // Aplicar também no próprio elemento raiz
            if (tempDiv.firstChild && tempDiv.firstChild.nodeType === Node.TEXT_NODE) {
                const wrapper = document.createElement('span');
                wrapper.style.setProperty('color', '#ffffff', 'important');
                wrapper.textContent = tempDiv.textContent;
                tempDiv.innerHTML = '';
                tempDiv.appendChild(wrapper);
            }
            
            processedMessage = tempDiv.innerHTML;
        }
        
        messageDiv.innerHTML = `
            <div class="d-flex align-items-start" style="margin-bottom: 12px; justify-content: flex-end;">
                <div class="${bgClass} p-3 rounded" style="${bubbleStyle}">
                    <div class="mb-0" style="color: #ffffff !important; font-size: 0.95rem !important; line-height: 1.5 !important;">${processedMessage}</div>
                    <small class="d-block mt-1" style="color: rgba(255, 255, 255, 0.9) !important;">${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</small>
                </div>
                <i class="${icon} ms-2 mt-1" style="${iconStyle}"></i>
            </div>
        `;
    } else {
        // IA: Texto escuro, ícone azul, fundo branco
        const iconStyle = 'color: #3b82f6 !important; font-size: 1.2rem !important; display: inline-block !important;';
        const bubbleStyle = 'color: #1a202c !important; background: transparent !important; border: none !important; box-shadow: none !important;';
        
        // Para mensagens da IA, processar HTML mantendo formatação
        let processedMessage = formattedMessage;
        
        // Se houver HTML, garantir cor escura em todos os elementos
        if (formattedMessage.includes('<')) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = formattedMessage;
            
            // Aplicar cor clara em TODOS os elementos de texto
            const allElements = tempDiv.querySelectorAll('*');
            allElements.forEach(el => {
                el.style.setProperty('color', '#1a202c', 'important');
            });
            
            processedMessage = tempDiv.innerHTML;
        }
        
        messageDiv.innerHTML = `
            <div class="d-flex align-items-start" style="margin-bottom: 12px;">
                <i class="${icon} me-2 mt-1" style="${iconStyle}"></i>
                <div class="${bgClass} p-3 rounded" style="${bubbleStyle}">
                    <div class="mb-0" style="color: #1a202c !important; font-size: 0.95rem !important; line-height: 1.5 !important;">${processedMessage}</div>
                    <small class="d-block mt-1" style="color: #6b7280 !important;">${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</small>
                </div>
            </div>
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    
    // FORÇAR cores usando DOM direto (após inserir no DOM)
    setTimeout(() => {
        if (sender === 'user') {
            // Forçar texto branco em TODOS os elementos da mensagem do usuário
            const allUserElements = messageDiv.querySelectorAll('*');
            allUserElements.forEach(el => {
                el.style.setProperty('color', '#ffffff', 'important');
            });
            // Forçar ícone branco
            const userIcon = messageDiv.querySelector('i');
            if (userIcon) userIcon.style.setProperty('color', '#ffffff', 'important');
        } else {
            // Forçar texto claro em TODOS os elementos da mensagem da IA
            const allAiElements = messageDiv.querySelectorAll('.chat-bubble-ai *');
            allAiElements.forEach(el => {
                el.style.setProperty('color', '#1a202c', 'important');
            });
            // Forçar ícone azul
            const aiIcon = messageDiv.querySelector('i');
            if (aiIcon) aiIcon.style.setProperty('color', '#3b82f6', 'important');
        }
    }, 10);
    
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
        return '<p style="color: #1a202c !important;">Resposta não disponível</p>';
    }
    
    // Converter markdown básico para HTML
    let formatted = text
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #1a202c !important;">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em style="color: #1a202c !important;">$1</em>')
        .replace(/• (.*?)(?=\n|$)/g, '<li style="color: #1a202c !important;">$1</li>')
        .replace(/\n\n/g, '</p><p style="color: #1a202c !important;">')
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
    
    return '<p style="color: #1a202c !important;">' + formatted + '</p>';
}

// Mostrar indicador de digitação
function showTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'ai-message typing-indicator';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="d-flex align-items-start">
            <i class="fas fa-robot me-2 mt-1" style="color: #3b82f6 !important;"></i>
            <div class="chat-bubble-ai p-3" style="color:rgb(243, 246, 250) !important; background: transparent !important; border: none !important; box-shadow: none !important;">
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
                // Configurar sugestão de preenchimento para a versão demo
                prefillTransaction = {
                    description: 'Supermercado',
                    value: 120.00,
                    category: 'Alimentação',
                    type: 'Despesa',
                    // data será definida para hoje ao abrir o modal, se não vier aqui
                };
                showToastNotification('Sugestão pronta: ao abrir "Nova Transação" os campos virão preenchidos.', 'info');
                break;
            case 'navigate_to_section': {
                const section = action.data?.section;
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
                    if (section === 'reports') {
                        // gerar automaticamente após navegar
                        setTimeout(() => { try { generateReport(); } catch(_) {} }, 300);
                    }
                }
                break;
            }
            case 'open_modal': {
                const modalId = action.data?.modal;
                if (modalId) {
                    // Aguardar navegação antes de abrir modal
                    setTimeout(() => {
                        const modalElement = document.getElementById(modalId);
                        if (modalElement) {
                            const modal = new bootstrap.Modal(modalElement);
                            modal.show();
                        } else if (modalId === 'add-transaction-modal') {
                            // Tentar abrir via botão
                            const addBtn = document.querySelector('[onclick*="addTransaction" i], [data-bs-target="#add-transaction-modal"]');
                            if (addBtn) addBtn.click();
                        }
                    }, 500);
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
async function ensureCurrentUser() {
    if (currentUserId) return currentUserId;
    
    try {
        const response = await fetch('/api/me', {
            credentials: 'include' // Incluir cookies de sessão
        });
        const me = await response.json();
        
        if (me && me.authenticated && me.user_id) {
            currentUserId = me.user_id;
            console.log(`✅ Usuário autenticado: ID ${currentUserId}, Username: ${me.username || 'N/A'}`);
        } else {
            console.warn('⚠️  Usuário não autenticado');
            currentUserId = null;
        }
    } catch (error) {
        console.error('❌ Erro ao verificar autenticação:', error);
        currentUserId = null;
    }
    
    return currentUserId;
}

async function updateQuickInsights() {
    await ensureCurrentUser();
    try {
        // Tentar Flask primeiro (tem dados mais completos), depois MCP
        let response;
        let result;
        
        try {
            response = await fetch(`${FLASK_API_BASE}/api/reports/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    report_type: 'quick_insights',
                    period: 'current_month',
                    insights: true,
                    user_id: currentUserId || undefined
                }),
                credentials: 'include'
            });
            
            if (response.ok) {
                result = await response.json();
            } else {
                throw new Error('Flask error');
            }
        } catch (error) {
            // Fallback para MCP
            response = await fetch(`${MCP_API_BASE}/reports/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    report_type: 'quick_insights',
                    period: 'current_month',
                    insights: true,
                    user_id: currentUserId || undefined
                })
            });
            
            result = await response.json();
        }
        
        const quickInsights = document.getElementById('quick-insights');
        quickInsights.innerHTML = '';
        
        // Adicionar resumo financeiro (Receitas, Despesas, Saldo)
        if (result.data && result.data.summary) {
            const summary = result.data.summary;
            const summaryCard = document.createElement('div');
            summaryCard.style.cssText = 'margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #22c55e;';
            
            // Determinar cor do saldo
            const saldoColor = summary.saldo >= 0 ? '#22c55e' : '#ef4444';
            const saldoIcon = summary.saldo >= 0 ? 'fa-check-circle' : 'fa-exclamation-triangle';
            
            summaryCard.innerHTML = `
                <div style="color: #1a202c !important; margin-bottom: 10px; display: flex; align-items: center;">
                    <i class="fas fa-arrow-up" style="color: #22c55e !important; margin-right: 10px !important; font-size: 1.1rem !important; display: inline-block !important; min-width: 20px;"></i>
                    <strong style="color: #1a202c !important; font-size: 0.95rem !important;">Receitas totais: R$ ${summary.total_receitas.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
                </div>
                <div style="color: #1a202c !important; margin-bottom: 10px; display: flex; align-items: center;">
                    <i class="fas fa-arrow-down" style="color: #ef4444 !important; margin-right: 10px !important; font-size: 1.1rem !important; display: inline-block !important; min-width: 20px;"></i>
                    <strong style="color: #1a202c !important; font-size: 0.95rem !important;">Despesas totais: R$ ${summary.total_despesas.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
                </div>
                <div style="color: #1a202c !important; display: flex; align-items: center;">
                    <i class="fas ${saldoIcon}" style="color: ${saldoColor} !important; margin-right: 10px !important; font-size: 1.1rem !important; display: inline-block !important; min-width: 20px;"></i>
                    <strong style="color: ${saldoColor} !important; font-size: 0.95rem !important;">Saldo: R$ ${summary.saldo.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
                </div>
            `;
            quickInsights.appendChild(summaryCard);
        }
        
        // Adicionar insights principais
        if (Array.isArray(result.insights) && result.insights.length > 0) {
            result.insights.slice(0, 3).forEach(insight => {
                const insightCard = document.createElement('div');
                insightCard.className = 'insight-card positive';
                // Determinar cor do ícone baseado no conteúdo
                let iconClass = 'fas fa-lightbulb';
                let iconColor = '#f59e0b'; // amarelo/laranja padrão
                
                if (insight.includes('Excelente') || insight.includes('positivo')) {
                    iconClass = 'fas fa-check-circle';
                    iconColor = '#22c55e'; // verde para positivo
                } else if (insight.includes('Atenção') || insight.includes('negativo') || insight.includes('Revise')) {
                    iconClass = 'fas fa-exclamation-triangle';
                    iconColor = '#ef4444'; // vermelho para alerta
                } else if (insight.includes('Maior categoria') || insight.includes('despesa')) {
                    iconClass = 'fas fa-chart-pie';
                    iconColor = '#3b82f6'; // azul para análise
                }
                
                insightCard.innerHTML = `
                    <p class="mb-0" style="color: #1a202c !important; font-size: 0.9rem !important; line-height: 1.5 !important;">
                        <i class="${iconClass}" style="color: ${iconColor} !important; margin-right: 8px !important; font-size: 1rem !important; display: inline-block !important;"></i> 
                        <span style="color: #1a202c !important;">${insight}</span>
                    </p>
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
                    <p class="mb-0" style="color: #1a202c !important; font-size: 0.9rem !important; line-height: 1.5 !important;">
                        <i class="fas fa-star" style="color: #f59e0b !important; margin-right: 8px !important; font-size: 1rem !important; display: inline-block !important;"></i> 
                        <span style="color: #1a202c !important;">${recommendation}</span>
                    </p>
                `;
                quickInsights.appendChild(insightCard);
            });
        }
        
        // Se nada foi exibido, mostrar orientação para cadastrar dados
        if (quickInsights.children.length === 0) {
            quickInsights.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-info-circle" style="color: #6b7280 !important;"></i>
                    <p style="color: #6b7280 !important;">Sem dados no período. Cadastre transações para gerar insights.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao atualizar insights:', error);
        const quickInsights = document.getElementById('quick-insights');
        quickInsights.innerHTML = `
            <div class="text-center">
                <i class="fas fa-exclamation-triangle" style="color: #f59e0b !important;"></i>
                <p style="color: #6b7280 !important;">Erro ao carregar insights</p>
            </div>
        `;
    }
}

// Função para corrigir cores de mensagens existentes
function fixExistingMessageColors() {
    // Corrigir mensagens do usuário
    const userMessages = document.querySelectorAll('.user-message');
    userMessages.forEach(msg => {
        const allElements = msg.querySelectorAll('*');
        allElements.forEach(el => {
            el.style.setProperty('color', '#ffffff', 'important');
        });
        const icon = msg.querySelector('i');
        if (icon) icon.style.setProperty('color', '#ffffff', 'important');
    });
    
    // Corrigir mensagens da IA
    const aiMessages = document.querySelectorAll('.ai-message');
    aiMessages.forEach(msg => {
        const allElements = msg.querySelectorAll('.chat-bubble-ai *');
        allElements.forEach(el => {
            el.style.setProperty('color', '#1a202c', 'important');
        });
        const icon = msg.querySelector('i');
        if (icon) icon.style.setProperty('color', '#3b82f6', 'important');
    });
}

// Event listener para Enter no chat
document.addEventListener('DOMContentLoaded', async function() {
    // Corrigir cores de mensagens existentes ao carregar
    setTimeout(fixExistingMessageColors, 100);
    
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

    // Carregar identidade e só então insights
    await ensureCurrentUser();
    updateQuickInsights();
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
    await ensureCurrentUser();
    const period = document.getElementById('report-period').value;
    const type = document.getElementById('report-type').value;
    const format = document.getElementById('report-format').value;
    
    console.log('Gerando relatório com:', { period, type, format });
    
    try {
        // Mostrar loading
        showLoading('Gerando relatório...');
        
        // Tentar primeiro o servidor MCP, depois Flask como fallback
        let response;
        let result;
        
        try {
            // Tentar MCP com timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            response = await fetch(`${MCP_API_BASE}/reports/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    period: period,
                    report_type: type,
                    insights: true,
                    user_id: currentUserId || undefined
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                result = await response.json();
                console.log('Relatório gerado via MCP:', result);
            } else {
                throw new Error('MCP server error');
            }
        } catch (error) {
            console.warn('MCP server não disponível, usando Flask:', error);
            // Fallback para Flask
            response = await fetch(`${FLASK_API_BASE}/api/reports/generate`, {
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
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Erro ao gerar relatório');
            }
            
            result = await response.json();
            console.log('Relatório gerado via Flask:', result);
        }
        
        if (result.data) {
            console.log('Resultado da API:', result);
            
            // Aplicar formato selecionado
            applyReportFormat(format, result.data);
            
            // Aplicar tipo de relatório específico
            applyReportType(type, result.data);
            
            showSuccess('Relatório gerado com sucesso!');
        } else {
            throw new Error(result.error || 'Erro ao gerar relatório');
        }
        
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        showError('Erro ao gerar relatório. Verifique se há dados cadastrados e tente novamente.');
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
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    fill: false,
                    tension: 0.35,
                    cubicInterpolationMode: 'monotone'
                },
                {
                    label: 'Despesas',
                    data: expenses,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    fill: false,
                    tension: 0.35,
                    cubicInterpolationMode: 'monotone'
                },
                {
                    label: 'Saldo',
                    data: balance,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    fill: false,
                    tension: 0.35,
                    cubicInterpolationMode: 'monotone'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#1a202c'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(ctx) {
                            const v = ctx.parsed.y || 0;
                            return `${ctx.dataset.label}: R$ ${v.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
                        }
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
                    },
                    grid: { color: '#e5e7eb' }
                },
                x: {
                    ticks: { color: '#1a202c' },
                    grid: { color: '#f1f5f9' }
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
