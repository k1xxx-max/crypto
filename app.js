// Конфигурация
const CRYPTOS = [
    { symbol: 'BTCUSDT', name: 'Bitcoin', icon: '₿' },
    { symbol: 'ETHUSDT', name: 'Ethereum', icon: 'Ξ' },
    { symbol: 'USDTUSDT', name: 'Tether', icon: '₮' },
    { symbol: 'SOLUSDT', name: 'Solana', icon: '◎' },
    { symbol: 'XRPUSDT', name: 'XRP', icon: '✕' },
    { symbol: 'USDCUSDT', name: 'USD Coin', icon: '₡' },
    { symbol: 'ADAUSDT', name: 'Cardano', icon: 'Α' },
    { symbol: 'DOGEUSDT', name: 'Dogecoin', icon: 'Ð' },
    { symbol: 'AVAXUSDT', name: 'Avalanche', icon: '⏣' }
];

let currentUser = null;
let currentCrypto = null;
let chartWidget = null;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    Telegram.WebApp.expand();
    Telegram.WebApp.enableClosingConfirmation();
    
    checkAuth();
    initAuthTabs();
    renderCryptoList();
});

// Проверка авторизации
function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showAuthedUI();
    }
}

// Инициализация табов авторизации
function initAuthTabs() {
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            
            // Деактивируем все табы
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            
            // Активируем выбранный
            tab.classList.add('active');
            document.getElementById(`${tabName}-form`).classList.add('active');
        });
    });
}

// Регистрация
function register() {
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    if (!username || !password) {
        alert('Заполните все поля');
        return;
    }

    if (password !== confirmPassword) {
        alert('Пароли не совпадают');
        return;
    }

    // Проверяем, нет ли уже такого пользователя
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    if (existingUsers.find(user => user.username === username)) {
        alert('Пользователь с таким логином уже существует');
        return;
    }

    // Сохраняем пользователя
    const newUser = {
        username,
        password, // В реальном приложении пароль нужно хэшировать!
        balance: 10000,
        createdAt: new Date().toISOString()
    };

    existingUsers.push(newUser);
    localStorage.setItem('users', JSON.stringify(existingUsers));
    
    // Автоматически логиним
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    showAuthedUI();
    alert('Регистрация успешна!');
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
    } else {
        alert('Неверный логин или пароль');
    }
}

// Выход
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showAuthUI();
}

// Показать UI для авторизованного пользователя
function showAuthedUI() {
    document.getElementById('auth-page').classList.remove('active');
    document.getElementById('main-page').classList.add('active');
    document.getElementById('bottomNav').style.display = 'flex';
    document.getElementById('userInfo').style.display = 'flex';
    document.getElementById('usernameDisplay').textContent = currentUser.username;
    
    // Инициализируем навигацию
    initNavigation();
}

// Показать UI для неавторизованного пользователя
function showAuthUI() {
    document.getElementById('auth-page').classList.add('active');
    document.getElementById('main-page').classList.remove('active');
    document.getElementById('bottomNav').style.display = 'none';
    document.getElementById('userInfo').style.display = 'none';
}

// Инициализация навигации
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const page = button.getAttribute('data-page');
            switchPage(page);
        });
    });
}

// Переключение страниц
function switchPage(pageName) {
    // Скрываем все страницы
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    // Показываем нужную страницу
    document.getElementById(`${pageName}-page`).classList.add('active');
    document.querySelector(`.nav-btn[data-page="${pageName}"]`).classList.add('active');
    
    // Если открыли торговлю и есть открытый график - закрываем его
    if (pageName !== 'trade' && document.getElementById('chartContainer').style.display !== 'none') {
        closeChart();
    }
}

// Рендер списка криптовалют
function renderCryptoList() {
    const container = document.querySelector('.crypto-grid');
    container.innerHTML = '';

    CRYPTOS.forEach(crypto => {
        const randomPrice = (Math.random() * 100000).toFixed(2);
        const randomChange = (Math.random() - 0.5) * 10;
        const isPositive = randomChange >= 0;

        const cryptoElement = document.createElement('div');
        cryptoElement.className = 'crypto-item';
        cryptoElement.innerHTML = `
            <div class="crypto-info">
                <div>
                    <div class="crypto-name">${crypto.icon} ${crypto.name}</div>
                    <div class="crypto-symbol">${crypto.symbol}</div>
                </div>
                <div class="crypto-price ${isPositive ? 'price-up' : 'price-down'}">
                    $${randomPrice}
                    <div>${isPositive ? '+' : ''}${randomChange.toFixed(2)}%</div>
                </div>
            </div>
        `;
        
        cryptoElement.addEventListener('click', () => openChart(crypto));
        container.appendChild(cryptoElement);
    });
}

// Открытие графика
function openChart(crypto) {
    currentCrypto = crypto;
    
    document.getElementById('selectedCryptoName').textContent = crypto.name;
    document.getElementById('chartContainer').style.display = 'block';
    
    // Инициализируем график TradingView
    if (chartWidget) {
        chartWidget.remove();
    }
    
    chartWidget = new TradingView.widget({
        symbol: `BINANCE:${crypto.symbol}`,
        interval: '15',
        container_id: 'tradingview-chart',
        theme: 'dark',
        style: '1',
        locale: 'ru',
        toolbar_bg: '#1e293b',
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        studies: ['RSI@tv-basicstudies', 'MACD@tv-basicstudies'],
        drawings_access: { type: 'black', tools: [ { name: "Regression Trend" } ] },
        disabled_features: ['header_widget', 'left_toolbar'],
        enabled_features: ['study_templates'],
        overrides: {
            "mainSeriesProperties.candleStyle.upColor": "#16a34a",
            "mainSeriesProperties.candleStyle.downColor": "#dc2626",
            "paneProperties.background": "#0f172a",
            "paneProperties.vertGridProperties.color": "#334155",
            "paneProperties.horzGridProperties.color": "#334155"
        }
    });
}

// Закрытие графика
function closeChart() {
    document.getElementById('chartContainer').style.display = 'none';
    if (chartWidget) {
        chartWidget.remove();
        chartWidget = null;
    }
}

// Открытие модалки торговли
function openTradeModal(crypto, type) {
    alert(`Открытие ${type.toUpperCase()} позиции по ${crypto.name}\n\nЭто демо-версия. В реальном приложении здесь будет форма ввода объема, плеча и т.д.`);
}

// Обновление цен в реальном времени
function startPriceUpdates() {
    setInterval(() => {
        document.querySelectorAll('.crypto-item').forEach((item, index) => {
            const crypto = CRYPTOS[index];
            const priceElement = item.querySelector('.crypto-price');
            const randomPrice = (Math.random() * 100000).toFixed(2);
            const randomChange = (Math.random() - 0.5) * 10;
            const isPositive = randomChange >= 0;

            priceElement.innerHTML = `
                $${randomPrice}
                <div class="${isPositive ? 'price-up' : 'price-down'}">
                    ${isPositive ? '+' : ''}${randomChange.toFixed(2)}%
                </div>
            `;
        });
    }, 3000);
}

// Запускаем обновление цен
startPriceUpdates();
