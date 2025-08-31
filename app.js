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
    console.log('App initialized');
    
    // Инициализируем Telegram WebApp
    if (typeof Telegram !== 'undefined') {
        Telegram.WebApp.expand();
        Telegram.WebApp.enableClosingConfirmation();
    }
    
    checkAuth();
    initAuthTabs();
    initEventListeners();
    startPriceUpdates();
    
    // Отложенная инициализация TradingView
    if (typeof TradingView === 'undefined') {
        setTimeout(initTradingView, 1000);
    } else {
        initTradingView();
    }
});

// Проверка авторизации
function checkAuth() {
    console.log('Checking authentication...');
    try {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            console.log('User found:', currentUser.username);
            showAuthedUI();
            updateMarketTickers();
            updateUserBalance();
            return true;
        }
        console.log('No user found in localStorage');
        return false;
    } catch (error) {
        console.error('Error checking auth:', error);
        return false;
    }
}

// Инициализация табов авторизации
function initAuthTabs() {
    console.log('Initializing auth tabs...');
    const tabs = document.querySelectorAll('.auth-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = tab.getAttribute('data-tab');
            console.log('Tab clicked:', tabName);
            
            // Деактивируем все табы
            document.querySelectorAll('.auth-tab').forEach(t => {
                t.classList.remove('active');
            });
            document.querySelectorAll('.auth-form').forEach(f => {
                f.classList.remove('active');
            });
            
            // Активируем выбранный таб
            tab.classList.add('active');
            const formId = `${tabName}-form`;
            const form = document.getElementById(formId);
            if (form) {
                form.classList.add('active');
                console.log('Form activated:', formId);
            }
            
            // Очищаем ошибки
            hideErrors();
        });
    });
    
    console.log('Auth tabs initialized');
}

// Инициализация слушателей событий
function initEventListeners() {
    console.log('Initializing event listeners...');
    
    // Слушатели для форм авторизации
    const authInputs = document.querySelectorAll('.auth-input');
    authInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const form = input.closest('.auth-form');
                if (form.id === 'login-form') {
                    login();
                } else if (form.id === 'register-form') {
                    register();
                }
            }
        });
    });
    
    // Слушатели для торговых кнопок
    const timeframeBtns = document.querySelectorAll('.timeframe-btn');
    timeframeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            updateChartResolution(this.getAttribute('data-interval'));
        });
    });
    
    // Слушатели для индикаторов
    const indicatorBtns = document.querySelectorAll('.indicator-btn');
    indicatorBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('active');
            toggleIndicator(this.getAttribute('data-indicator'));
        });
    });
    
    // Слушатели для вкладок ордеров
    const orderTabs = document.querySelectorAll('.order-tab');
    orderTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.order-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            // Здесь можно добавить логику переключения между Limit/Market
        });
    });
    
    // Слушатели для вкладок ордеров в футере
    const ordersTabs = document.querySelectorAll('.orders-tab');
    ordersTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.orders-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            // Здесь можно добавить логику переключения между вкладками
        });
    });
    
    console.log('Event listeners initialized');
}

// Инициализация TradingView
function initTradingView() {
    console.log('Initializing TradingView...');
    if (typeof TradingView === 'undefined') {
        console.warn('TradingView library not loaded yet');
        return;
    }
    
    console.log('TradingView ready');
}

// Регистрация пользователя
function register() {
    console.log('Registration started...');
    
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    console.log('Registration data:', { username, password, confirmPassword });
    
    // Валидация
    if (!username || !password || !confirmPassword) {
        showError('register', 'Заполните все поля');
        return;
    }
    
    if (username.length < 3) {
        showError('register', 'Логин должен быть не менее 3 символов');
        return;
    }
    
    if (password.length < 4) {
        showError('register', 'Пароль должен быть не менее 4 символов');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('register', 'Пароли не совпадают');
        return;
    }
    
    try {
        // Получаем существующих пользователей
        const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
        console.log('Existing users:', existingUsers);
        
        // Проверяем, нет ли уже такого пользователя
        if (existingUsers.find(user => user.username === username)) {
            showError('register', 'Пользователь с таким логином уже существует');
            return;
        }
        
        // Создаем нового пользователя
        const newUser = {
            username: username,
            password: password,
            balance: 10000.00,
            available: 8500.00,
            locked: 1500.00,
            pnl: 250.00,
            positions: [],
            orders: [],
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };
        
        // Сохраняем пользователя
        existingUsers.push(newUser);
        localStorage.setItem('users', JSON.stringify(existingUsers));
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        
        currentUser = newUser;
        console.log('User registered successfully:', username);
        
        showSuccess('Регистрация успешна!');
        showAuthedUI();
        
    } catch (error) {
        console.error('Registration error:', error);
        showError('register', 'Ошибка при регистрации');
    }
}

// Вход пользователя
function login() {
    console.log('Login started...');
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    console.log('Login data:', { username, password });
    
    // Валидация
    if (!username || !password) {
        showError('login', 'Заполните все поля');
        return;
    }
    
    try {
        // Получаем пользователей из localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        console.log('Users in storage:', users);
        
        // Ищем пользователя
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            // Обновляем время последнего входа
            user.lastLogin = new Date().toISOString();
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            currentUser = user;
            console.log('Login successful:', username);
            
            showSuccess('Вход выполнен успешно!');
            showAuthedUI();
            
        } else {
            console.log('Login failed: invalid credentials');
            showError('login', 'Неверный логин или пароль');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showError('login', 'Ошибка при входе');
    }
}

// Выход пользователя
function logout() {
    console.log('Logging out...');
    
    try {
        localStorage.removeItem('currentUser');
        currentUser = null;
        
        showSuccess('Выход выполнен успешно');
        showAuthUI();
        
    } catch (error) {
        console.error('Logout error:', error);
        showError('logout', 'Ошибка при выходе');
    }
}

// Показать UI для авторизованного пользователя
function showAuthedUI() {
    console.log('Showing authenticated UI');
    
    try {
        // Скрываем страницу авторизации
        document.getElementById('auth-page').classList.remove('active');
        
        // Показываем главную страницу
        document.getElementById('main-page').classList.add('active');
        
        // Показываем нижнюю навигацию
        document.getElementById('bottomNav').style.display = 'flex';
        
        // Показываем информацию пользователя
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.style.display = 'flex';
        }
        
        // Обновляем данные пользователя
        if (currentUser) {
            const usernameDisplay = document.getElementById('usernameDisplay');
            if (usernameDisplay) {
                usernameDisplay.textContent = currentUser.username;
            }
            
            updateUserBalance();
            updateMarketTickers();
        }
        
        console.log('Authenticated UI shown');
        
    } catch (error) {
        console.error('Error showing authenticated UI:', error);
    }
}

// Показать UI для неавторизованного пользователя
function showAuthUI() {
    console.log('Showing auth UI');
    
    try {
        // Показываем страницу авторизации
        document.getElementById('auth-page').classList.add('active');
        
        // Скрываем другие страницы
        document.querySelectorAll('.page').forEach(page => {
            if (page.id !== 'auth-page') {
                page.classList.remove('active');
            }
        });
        
        // Скрываем нижнюю навигацию
        document.getElementById('bottomNav').style.display = 'none';
        
        // Скрываем информацию пользователя
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.style.display = 'none';
        }
        
        // Очищаем поля форм
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('regUsername').value = '';
        document.getElementById('regPassword').value = '';
        document.getElementById('regConfirmPassword').value = '';
        
        // Очищаем ошибки
        hideErrors();
        
        console.log('Auth UI shown');
        
    } catch (error) {
        console.error('Error showing auth UI:', error);
    }
}

// Обновление баланса пользователя
function updateUserBalance() {
    if (!currentUser) return;
    
    try {
        const elements = {
            balancePreview: document.getElementById('balancePreview'),
            mainBalance: document.getElementById('mainBalance'),
            availableBalance: document.getElementById('availableBalance'),
            lockedBalance: document.getElementById('lockedBalance'),
            totalPnl: document.getElementById('totalPnl'),
            walletBalance: document.getElementById('walletBalance'),
            walletProfit: document.getElementById('walletProfit')
        };
        
        // Обновляем все элементы баланса
        if (elements.balancePreview) {
            elements.balancePreview.textContent = `${currentUser.balance.toFixed(2)} USDT`;
        }
        if (elements.mainBalance) {
            elements.mainBalance.textContent = `${currentUser.balance.toFixed(2)} USDT`;
        }
        if (elements.availableBalance) {
            elements.availableBalance.textContent = `${currentUser.available.toFixed(2)} USDT`;
        }
        if (elements.lockedBalance) {
            elements.lockedBalance.textContent = `${currentUser.locked.toFixed(2)} USDT`;
        }
        if (elements.totalPnl) {
            elements.totalPnl.textContent = `${currentUser.pnl >= 0 ? '+' : ''}${currentUser.pnl.toFixed(2)} USDT`;
            elements.totalPnl.className = currentUser.pnl >= 0 ? 'positive' : 'negative';
        }
        if (elements.walletBalance) {
            elements.walletBalance.textContent = `${currentUser.balance.toFixed(2)} USDT`;
        }
        if (elements.walletProfit) {
            const profitPercent = ((currentUser.pnl / (currentUser.balance - currentUser.pnl)) * 100).toFixed(2);
            elements.walletProfit.textContent = `${profitPercent >= 0 ? '+' : ''}${profitPercent}%`;
            elements.walletProfit.className = profitPercent >= 0 ? 'profit positive' : 'profit negative';
        }
        
    } catch (error) {
        console.error('Error updating user balance:', error);
    }
}

// Обновление рыночных тикеров
function updateMarketTickers() {
    const container = document.getElementById('marketTickers');
    if (!container) return;
    
    try {
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
        
    } catch (error) {
        console.error('Error updating market tickers:', error);
    }
}

// Переключение страниц
function switchPage(pageName) {
    console.log('Switching to page:', pageName);
    
    try {
        // Скрываем все страницы
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Скрываем все кнопки навигации
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Показываем нужную страницу
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // Активируем кнопку навигации
        const navButton = document.querySelector(`.nav-btn[data-page="${pageName}"]`);
        if (navButton) {
            navButton.classList.add('active');
        }
        
        // Если переходим на торговую страницу, инициализируем график
        if (pageName === 'trade') {
            setTimeout(initTradingViewChart, 100);
        }
        
        console.log('Page switched successfully');
        
    } catch (error) {
        console.error('Error switching page:', error);
        showError('navigation', 'Ошибка при переключении страницы');
    }
}

// Инициализация графика TradingView
function initTradingViewChart() {
    console.log('Initializing TradingView chart...');
    
    if (chartWidget) {
        chartWidget.remove();
        chartWidget = null;
    }
    
    if (typeof TradingView === 'undefined') {
        console.warn('TradingView not loaded yet');
        return;
    }
    
    try {
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
        
        console.log('TradingView chart initialized');
        
    } catch (error) {
        console.error('Error initializing TradingView chart:', error);
    }
}

// Обновление разрешения графика
function updateChartResolution(interval) {
    if (!chartWidget) return;
    
    try {
        chartWidget.chart().setResolution(interval);
        console.log('Chart resolution updated to:', interval);
    } catch (error) {
        console.error('Error updating chart resolution:', error);
    }
}

// Переключение индикатора
function toggleIndicator(indicator) {
    if (!chartWidget) return;
    
    try {
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
                console.log('Indicator removed:', indicator);
            } else {
                chart.createStudy(studyId, false, false);
                console.log('Indicator added:', indicator);
            }
        }
    } catch (error) {
        console.error('Error toggling indicator:', error);
    }
}

// Смена символа
function changeSymbol() {
    const select = document.getElementById('symbolSelect');
    currentSymbol = select.value;
    
    try {
        // Обновляем цену и изменение
        const crypto = CRYPTOS.find(c => c.symbol === currentSymbol);
        if (crypto) {
            document.getElementById('currentPrice').textContent = `$${crypto.price.toFixed(2)}`;
            const changeElement = document.getElementById('priceChange');
            changeElement.textContent = `${crypto.change >= 0 ? '+' : ''}${crypto.change.toFixed(2)}%`;
            changeElement.className = crypto.change >= 0 ? 'change positive' : 'change negative';
        }
        
        // Обновляем график
        if (chartWidget) {
            chartWidget.setSymbol(`BINANCE:${currentSymbol}`);
            console.log('Symbol changed to:', currentSymbol);
        }
        
    } catch (error) {
        console.error('Error changing symbol:', error);
    }
}

// Обновление плеча
function updateLeverage(side, value) {
    const leverageValue = document.getElementById(`${side}LeverageValue`);
    if (leverageValue) {
        leverageValue.textContent = `${value}x`;
    }
    updateOrderSummary(side);
}

// Обновление сводки ордера
function updateOrderSummary(side) {
    try {
        const price = parseFloat(document.getElementById(`${side}Price`).value) || 0;
        const amount = parseFloat(document.getElementById(`${side}Amount`).value) || 0;
        const leverage = parseInt(document.getElementById(`${side}Leverage`).value) || 1;
        
        const cost = price * amount;
        const margin = cost / leverage;
        
        document.getElementById(`${side}Cost`).textContent = `${cost.toFixed(2)} USDT`;
        document.getElementById(`${side}Margin`).textContent = `${margin.toFixed(2)} USDT`;
        
    } catch (error) {
        console.error('Error updating order summary:', error);
    }
}

// Размещение ордера
function placeOrder(side) {
    if (!currentUser) {
        showError('trade', 'Необходимо авторизоваться');
        return;
    }
    
    try {
        const price = parseFloat(document.getElementById(`${side}Price`).value);
        const amount = parseFloat(document.getElementById(`${side}Amount`).value);
        const leverage = parseInt(document.getElementById(`${side}Leverage`).value);
        
        if (!price || !amount) {
            showError('trade', 'Заполните все поля');
            return;
        }
        
        currentOrder = {
            symbol: currentSymbol,
            side: side,
            price: price,
            amount: amount,
            leverage: leverage,
            total: price * amount,
            margin: (price * amount) / leverage,
            timestamp: new Date().toISOString()
        };
        
        showOrderModal();
        
    } catch (error) {
        console.error('Error placing order:', error);
        showError('trade', 'Ошибка при размещении ордера');
    }
}

// Показать модальное окно ордера
function showOrderModal() {
    if (!currentOrder) return;
    
    try {
        document.getElementById('confirmSymbol').textContent = currentOrder.symbol;
        document.getElementById('confirmSide').textContent = currentOrder.side.toUpperCase();
        document.getElementById('confirmPrice').textContent = `${currentOrder.price.toFixed(2)} USDT`;
        document.getElementById('confirmAmount').textContent = `${currentOrder.amount} ${currentOrder.symbol.replace('USDT', '')}`;
        document.getElementById('confirmLeverage').textContent = `${currentOrder.leverage}x`;
        document.getElementById('confirmTotal').textContent = `${currentOrder.total.toFixed(2)} USDT`;
        
        document.getElementById('orderModal').style.display = 'block';
        
    } catch (error) {
        console.error('Error showing order modal:', error);
    }
}

// Закрыть модальное окно
function closeModal() {
    document.getElementById('orderModal').style.display = 'none';
    currentOrder = null;
}

// Подтверждение ордера
function confirmOrder() {
    if (!currentOrder || !currentUser) return;
    
    try {
        // Сохраняем ордер
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const orderId = Date.now();
        
        orders.push({
            ...currentOrder,
            id: orderId,
            userId: currentUser.username,
            status: 'open',
            timestamp: new Date().toISOString()
        });
        
        localStorage.setItem('orders', JSON.stringify(orders));
        
        showSuccess(`Ордер ${currentOrder.side.toUpperCase()} размещен успешно!`);
        closeModal();
        
        // Обновляем баланс пользователя (в демо-режиме)
        currentUser.available -= currentOrder.margin;
        currentUser.locked += currentOrder.margin;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        updateUserBalance();
        
    } catch (error) {
        console.error('Error confirming order:', error);
        showError('trade', 'Ошибка при подтверждении ордера');
    }
}

// Включение полноэкранного режима
function toggleFullscreen() {
    const terminal = document.querySelector('.trading-terminal');
    if (!document.fullscreenElement) {
        terminal.requestFullscreen().catch(err => {
            showError('trade', 'Ошибка полноэкранного режима');
        });
    } else {
        document.exitFullscreen();
    }
}

// Обновление цен в реальном времени
function startPriceUpdates() {
    setInterval(() => {
        if (!currentUser) return;
        
        CRYPTOS.forEach(crypto => {
            // Имитация изменения цены
            const change = (Math.random() - 0.5) * 2;
            crypto.change += change;
            crypto.price *= (1 + change / 100);
            
            // Обновляем UI если нужно
            if (crypto.symbol === currentSymbol) {
                const priceElement = document.getElementById('currentPrice');
                const changeElement = document.getElementById('priceChange');
                
                if (priceElement && changeElement) {
                    priceElement.textContent = `$${crypto.price.toFixed(2)}`;
                    changeElement.textContent = `${crypto.change >= 0 ? '+' : ''}${crypto.change.toFixed(2)}%`;
                    changeElement.className = crypto.change >= 0 ? 'change positive' : 'change negative';
                }
            }
        });
        
        updateMarketTickers();
        
    }, 5000);
}

// Показать ошибку
function showError(type, message) {
    console.error(`Error (${type}):`, message);
    
    try {
        const errorElement = document.getElementById(`${type}Error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
            // Автоматическое скрытие через 5 секунд
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        }
        
        // Также показываем уведомление
        showNotification(message, 'error');
        
    } catch (error) {
        console.error('Error showing error message:', error);
    }
}

// Скрыть все ошибки
function hideErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.style.display = 'none';
    });
}

// Показать уведомление
function showNotification(message, type = 'success') {
    try {
        // Создаем элемент уведомления
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Добавляем в body
        document.body.appendChild(notification);
        
        // Удаляем через 5 секунд
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
        
    } catch (error) {
        console.error('Error showing notification:', error);
    }
}

// Показать успешное сообщение
function showSuccess(message) {
    showNotification(message, 'success');
}

// Глобальные обработчики
window.onclick = function(event) {
    const modal = document.getElementById('orderModal');
    if (event.target === modal) {
        closeModal();
    }
};

window.onkeydown = function(event) {
    if (event.key === 'Escape') {
        closeModal();
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
    }
};

// Дебаг функция для очистки localStorage
window.clearAppData = function() {
    if (confirm('Очистить все данные приложения?')) {
        localStorage.removeItem('users');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('orders');
        console.log('App data cleared');
        location.reload();
    }
};

// Дебаг функция для просмотра данных
window.showAppData = function() {
    console.log('Users:', JSON.parse(localStorage.getItem('users') || '[]'));
    console.log('Current user:', JSON.parse(localStorage.getItem('currentUser') || 'null'));
    console.log('Orders:', JSON.parse(localStorage.getItem('orders') || '[]'));
};

// Дебаг функция для создания тестового пользователя
window.createTestUser = function() {
    const testUser = {
        username: 'test',
        password: 'test123',
        balance: 10000.00,
        available: 8500.00,
        locked: 1500.00,
        pnl: 250.00,
        positions: [],
        orders: [],
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
    };
    
    localStorage.setItem('currentUser', JSON.stringify(testUser));
    location.reload();
};
