// Конфигурация
const CRYPTOS = [
    { symbol: 'BTCUSDT', name: 'Bitcoin', price: 42150.30, change: 2.45 },
    { symbol: 'ETHUSDT', name: 'Ethereum', price: 2250.80, change: 1.23 },
    { symbol: 'SOLUSDT', name: 'Solana', price: 95.60, change: 5.67 },
    { symbol: 'XRPUSDT', name: 'XRP', price: 0.58, change: -0.45 },
    { symbol: 'ADAUSDT', name: 'Cardano', price: 0.48, change: 0.89 },
    { symbol: 'DOGEUSDT', name: 'Dogecoin', price: 0.082, change: -1.23 },
    { symbol: 'AVAXUSDT', name: 'Avalanche', price: 34.20, change: 3.45 }
];

let currentUser = null;
let currentSymbol = 'BTCUSDT';
let chartWidget = null;
let currentOrder = null;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    Telegram.WebApp.expand();
    Telegram.WebApp.enableClosingConfirmation();
    
    checkAuth();
    initAuthTabs();
    initTradingView();
    initEventListeners();
    startPriceUpdates();
});

// Проверка авторизации
function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showAuthedUI();
        updateMarketTickers();
    }
}

// Инициализация табов авторизации
function initAuthTabs() {
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`${tabName}-form`).classList.add('active');
        });
    });
}

// Инициализация TradingView
function initTradingView() {
    if (typeof TradingView === 'undefined') {
        setTimeout(initTradingView, 100);
        return;
    }
    
    // График будет инициализирован при открытии торговой страницы
}

// Инициализация слушателей событий
function initEventListeners() {
    // Слушатели для торговых кнопок
    document.querySelectorAll('.timeframe-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            updateChartResolution(this.textContent);
        });
    });
    
    // Слушатели для индикаторов
    document.querySelectorAll('.indicator-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('active');
            toggleIndicator(this.textContent);
        });
    });
    
    // Слушатели для слайдеров плеча
    document.querySelectorAll('.leverage-slider').forEach(slider => {
        slider.addEventListener('input', function() {
            const value = this.value;
            this.parentElement.querySelector('span').textContent = `${value}x`;
            updateOrderSummary();
        });
    });
    
    // Слушатели для Input полей
    document.querySelectorAll('.order-input').forEach(input => {
        input.addEventListener('input', updateOrderSummary);
    });
}

// Регистрация
function register() {
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    if (!username || !password) {
        showError('Заполните все поля');
        return;
    }

    if (password !== confirmPassword) {
        showError('Пароли не совпадают');
        return;
    }

    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    if (existingUsers.find(user => user.username === username)) {
        showError('Пользователь с таким логином уже существует');
        return;
    }

    const newUser = {
        username,
        password,
        balance: 10000,
        positions: [],
        orders: [],
        createdAt: new Date().toISOString()
    };

    existingUsers.push(newUser);
    localStorage.setItem('users', JSON.stringify(existingUsers));
    
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    showAuthedUI();
    showSuccess('Регистрация успешна!');
}

// Вход
function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showAuthedUI();
        showSuccess('Вход выполнен успешно!');
    } else {
        showError('Неверный логин или пароль');
    }
}

// Выход
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showAuthUI();
    showSuccess('Выход выполнен');
}

// Показать UI для авторизованного пользователя
function showAuthedUI() {
    document.getElementById('auth-page').classList.remove('active');
    document.getElementById('main-page').classList.add('active');
    document.getElementById('bottomNav').style.display = 'flex';
    document.getElementById('userInfo').style.display = 'flex';
    document.getElementById('usernameDisplay').textContent = currentUser.username;
    
    updateUserBalance();
}

// Показать UI для неавторизованного пользователя
function showAuthUI() {
    document.getElementById('auth-page').classList.add('active');
    document.getElementById('main-page').classList.remove('active');
    document.getElementById('bottomNav').style.display = 'none';
    document.getElementById('userInfo').style.display = 'none';
}

// Переключение страниц
function switchPage(pageName) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`${pageName}-page`).classList.add('active');
    document.querySelector(`.nav-btn[data-page="${pageName}"]`).classList.add('active');
    
    if (pageName === 'trade') {
        initTradingViewChart();
    }
}

// Обновление баланса пользователя
function updateUserBalance() {
    const balanceElement = document.querySelector('.balance-preview');
    if (balanceElement && currentUser) {
        balanceElement.textContent = `${currentUser.balance.toFixed(2)} USDT`;
    }
}

// Обновление рыночных тикеров
function updateMarketTickers() {
    const container = document.querySelector('.market-tickers');
    if (!container) return;
    
    container.innerHTML = '';
    
    CRYPTOS.forEach(crypto => {
        const isPositive = crypto.change >= 0;
        const tickerElement = document.createElement('div');
        tickerElement.className = 'ticker-item';
        tickerElement.innerHTML = `
            <div>
                <strong>${crypto.symbol}</strong>
                <div>$${crypto.price.toFixed(2)}</div>
            </div>
            <div class="${isPositive ? 'positive' : 'negative'}">
                ${isPositive ? '+' : ''}${crypto.change.toFixed(2)}%
            </div>
        `;
        container.appendChild(tickerElement);
    });
}

// Инициализация графика TradingView
function initTradingViewChart() {
    if (chartWidget) {
        chartWidget.remove();
    }
    
    chartWidget = new TradingView.widget({
        symbol: `BINANCE:${currentSymbol}`,
        interval: '15',
        container_id: 'tradingview-chart',
        theme: 'dark',
        style: '1',
        locale: 'ru',
        toolbar_bg: '#1e293b',
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: true,
        save_image: false,
        studies: ['RSI@tv-basicstudies', 'MACD@tv-basicstudies', 'Volume@tv-basicstudies'],
        drawings_access: { 
            type: 'black', 
            tools: [ 
                { name: "Regression Trend" },
                { name: "Fibonacci Retracement" },
                { name: "Horizontal Line" }
            ] 
        },
        disabled_features: [
            'header_widget',
            'left_toolbar',
            'timeframes_toolbar',
            'edit_buttons_in_legend',
            'context_menus'
        ],
        enabled_features: ['study_templates'],
        overrides: {
            "mainSeriesProperties.style": 1,
            "mainSeriesProperties.candleStyle.upColor": "#16a34a",
            "mainSeriesProperties.candleStyle.downColor": "#dc2626",
            "mainSeriesProperties.candleStyle.wickUpColor": "#16a34a",
            "mainSeriesProperties.candleStyle.wickDownColor": "#dc2626",
            "paneProperties.background": "#0f172a",
            "paneProperties.vertGridProperties.color": "#334155",
            "paneProperties.horzGridProperties.color": "#334155"
        }
    });
}

// Обновление разрешения графика
function updateChartResolution(resolution) {
    if (!chartWidget) return;
    
    const resolutionMap = {
        '1m': '1',
        '5m': '5',
        '15m': '15',
        '30m': '30',
        '1h': '60',
        '4h': '240',
        '1D': '1D',
        '1W': '1W'
    };
    
    const interval = resolutionMap[resolution] || '15';
    chartWidget.chart().setResolution(interval);
}

// Переключение индикатора
function toggleIndicator(indicator) {
    if (!chartWidget) return;
    
    const indicatorMap = {
        'RSI': 'RSI@tv-basicstudies',
        'MACD': 'MACD@tv-basicstudies',
        'VOL': 'Volume@tv-basicstudies'
    };
    
    const studyId = indicatorMap[indicator];
    if (studyId) {
        const chart = chartWidget.chart();
        const studies = chart.getAllStudies();
        const existingStudy = studies.find(s => s.name === studyId);
        
        if (existingStudy) {
            chart.removeStudy(existingStudy.id);
        } else {
            chart.createStudy(studyId, false, false);
        }
    }
}

// Смена символа
function changeSymbol() {
    const select = document.getElementById('symbolSelect');
    currentSymbol = select.value;
    
    // Обновляем цену и изменение
    const crypto = CRYPTOS.find(c => c.symbol === currentSymbol);
    if (crypto) {
        document.querySelector('.price').textContent = `$${crypto.price.toFixed(2)}`;
        const changeElement = document.querySelector('.change');
        changeElement.textContent = `${crypto.change >= 0 ? '+' : ''}${crypto.change.toFixed(2)}%`;
        changeElement.className = crypto.change >= 0 ? 'change positive' : 'change negative';
    }
    
    // Обновляем график
    if (chartWidget) {
        chartWidget.setSymbol(`BINANCE:${currentSymbol}`);
    }
}

// Размещение ордера
function placeOrder(side) {
    const priceInput = document.querySelector(`.order-side.${side} .order-input[type="number"]`);
    const amountInput = document.querySelectorAll(`.order-side.${side} .order-input[type="number"]`)[1];
    const leverageInput = document.querySelector(`.order-side.${side} .leverage-slider`);
    
    const price = parseFloat(priceInput.value);
    const amount = parseFloat(amountInput.value);
    const leverage = parseInt(leverageInput.value);
    
    if (!price || !amount) {
        showError('Заполните все поля');
        return;
    }
    
    currentOrder = {
        symbol: currentSymbol,
        side: side,
        price: price,
        amount: amount,
        leverage: leverage,
        total: price * amount,
        margin: (price * amount) / leverage
    };
    
    showOrderModal();
}

// Показать модальное окно ордера
function showOrderModal() {
    document.getElementById('modalTitle').textContent = 'Подтверждение ордера';
    document.getElementById('confirmSymbol').textContent = currentOrder.symbol;
    document.getElementById('confirmSide').textContent = currentOrder.side.toUpperCase();
    document.getElementById('confirmPrice').textContent = `${currentOrder.price.toFixed(2)} USDT`;
    document.getElementById('confirmAmount').textContent = `${currentOrder.amount} ${currentOrder.symbol.replace('USDT', '')}`;
    document.getElementById('confirmLeverage').textContent = `${currentOrder.leverage}x`;
    document.getElementById('confirmTotal').textContent = `${currentOrder.total.toFixed(2)} USDT`;
    
    document.getElementById('orderModal').style.display = 'block';
}

// Закрыть модальное окно
function closeModal() {
    document.getElementById('orderModal').style.display = 'none';
    currentOrder = null;
}

// Подтверждение ордера
function confirmOrder() {
    if (!currentOrder || !currentUser) return;
    
    // Сохраняем ордер
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push({
        ...currentOrder,
        id: Date.now(),
        userId: currentUser.username,
        status: 'open',
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('orders', JSON.stringify(orders));
    
    showSuccess(`Ордер ${currentOrder.side.toUpperCase()} размещен успешно!`);
    closeModal();
    
    // Обновляем UI
    updatePositions();
    updateOrders();
}

// Обновление позиций
function updatePositions() {
    // Заглушка для обновления списка позиций
}

// Обновление ордеров
function updateOrders() {
    // Заглушка для обновления списка ордеров
}

// Обновление сводки ордера
function updateOrderSummary() {
    // Заглушка для расчета маржи и стоимости
}

// Обновление цен в реальном времени
function startPriceUpdates() {
    setInterval(() => {
        CRYPTOS.forEach(crypto => {
            // Имитация изменения цены
            const change = (Math.random() - 0.5) * 2;
            crypto.change += change;
            crypto.price *= (1 + change / 100);
            
            // Обновляем UI если нужно
            if (crypto.symbol === currentSymbol) {
                document.querySelector('.price').textContent = `$${crypto.price.toFixed(2)}`;
                const changeElement = document.querySelector('.change');
                changeElement.textContent = `${crypto.change >= 0 ? '+' : ''}${crypto.change.toFixed(2)}%`;
                changeElement.className = crypto.change >= 0 ? 'change positive' : 'change negative';
            }
        });
        
        updateMarketTickers();
    }, 5000);
}

// Включение полноэкранного режима
function toggleFullscreen() {
    const terminal = document.querySelector('.trading-terminal');
    if (!document.fullscreenElement) {
        terminal.requestFullscreen().catch(err => {
            showError('Ошибка полноэкранного режима');
        });
    } else {
        document.exitFullscreen();
    }
}

// Показать уведомление об ошибке
function showError(message) {
    alert(`❌ ${message}`);
}

// Показать уведомление об успехе
function showSuccess(message) {
    alert(`✅ ${message}`);
}

// Глобальные обработчики
window.onclick = function(event) {
    const modal = document.getElementById('orderModal');
    if (event.target === modal) {
        closeModal();
    }
}

window.onkeydown = function(event) {
    if (event.key === 'Escape') {
        closeModal();
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
    }
}
