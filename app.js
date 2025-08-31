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
let currentInterval = '15';

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    Telegram.WebApp.expand();
    Telegram.WebApp.enableClosingConfirmation();
    
    checkAuth();
    initAuthTabs();
    renderCryptoList();
    initChartToolbar();
});

// ... (функции checkAuth, initAuthTabs, register, login, logout остаются такими же) ...

// Инициализация тулбара графика
function initChartToolbar() {
    const toolbarButtons = document.querySelectorAll('.toolbar-btn');
    toolbarButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Убираем активный класс у всех кнопок
            toolbarButtons.forEach(b => b.classList.remove('active'));
            // Добавляем активный класс текущей кнопке
            this.classList.add('active');
            
            // Обновляем интервал графика
            currentInterval = this.getAttribute('data-interval');
            if (chartWidget && currentCrypto) {
                updateChartInterval(currentInterval);
            }
        });
    });
}

// Обновление интервала графика
function updateChartInterval(interval) {
    if (chartWidget) {
        chartWidget.chart().setResolution(interval);
    }
}

// Открытие графика
function openChart(crypto) {
    currentCrypto = crypto;
    
    // Обновляем информацию о крипте
    document.getElementById('selectedCryptoName').textContent = crypto.name;
    document.getElementById('selectedCryptoSymbol').textContent = crypto.symbol;
    
    // Генерируем случайные данные для демонстрации
    const randomPrice = (Math.random() * 100000).toFixed(2);
    const randomChange = (Math.random() - 0.5) * 10;
    const isPositive = randomChange >= 0;
    
    document.getElementById('currentPrice').textContent = `$${randomPrice}`;
    document.getElementById('priceChange').textContent = `${isPositive ? '+' : ''}${randomChange.toFixed(2)}%`;
    document.getElementById('priceChange').className = isPositive ? 'price-change positive' : 'price-change negative';
    
    // Обновляем 24h статистику
    document.getElementById('volume24h').textContent = `$${(Math.random() * 2 + 0.5).toFixed(1)}B`;
    document.getElementById('high24h').textContent = `$${(randomPrice * 1.05).toFixed(2)}`;
    document.getElementById('low24h').textContent = `$${(randomPrice * 0.95).toFixed(2)}`;
    
    // Показываем контейнер графика
    document.getElementById('chartContainer').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Инициализируем график TradingView с настройками для свечей
    initTradingViewChart(crypto.symbol);
}

// Инициализация графика TradingView
function initTradingViewChart(symbol) {
    if (chartWidget) {
        chartWidget.remove();
    }
    
    chartWidget = new TradingView.widget({
        symbol: `BINANCE:${symbol}`,
        interval: currentInterval,
        container_id: 'tradingview-chart',
        theme: 'dark',
        style: '1', // Стиль свечей
        locale: 'ru',
        toolbar_bg: '#1e293b',
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: true,
        save_image: false,
        studies: [
            'RSI@tv-basicstudies',
            'MACD@tv-basicstudies',
            'Volume@tv-basicstudies'
        ],
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
            'context_menus',
            'control_bar'
        ],
        enabled_features: [
            'study_templates',
            'move_logo_to_main_pane'
        ],
        overrides: {
            // Настройки для свечного графика
            "mainSeriesProperties.style": 1, // Свечи
            "mainSeriesProperties.candleStyle.upColor": "#16a34a",
            "mainSeriesProperties.candleStyle.downColor": "#dc2626",
            "mainSeriesProperties.candleStyle.wickUpColor": "#16a34a",
            "mainSeriesProperties.candleStyle.wickDownColor": "#dc2626",
            "mainSeriesProperties.candleStyle.borderUpColor": "#16a34a",
            "mainSeriesProperties.candleStyle.borderDownColor": "#dc2626",
            
            "paneProperties.background": "#0f172a",
            "paneProperties.vertGridProperties.color": "#334155",
            "paneProperties.horzGridProperties.color": "#334155",
            "paneProperties.crossHairProperties.color": "#94a3b8",
            
            "scalesProperties.textColor": "#94a3b8",
            "scalesProperties.lineColor": "#334155"
        },
        loading_screen: {
            backgroundColor: '#0f172a'
        },
        time_frames: [
            { text: "1m", resolution: "1" },
            { text: "5m", resolution: "5" },
            { text: "15m", resolution: "15" },
            { text: "30m", resolution: "30" },
            { text: "1h", resolution: "60" },
            { text: "4h", resolution: "240" },
            { text: "1D", resolution: "1D" }
        ]
    });
    
    // Обработчик изменения интервала
    chartWidget.onChartReady(() => {
        chartWidget.chart().onIntervalChanged().subscribe(null, (interval) => {
            currentInterval = interval;
            updateToolbarButtons(interval);
        });
    });
}

// Обновление кнопок тулбара
function updateToolbarButtons(interval) {
    const buttons = document.querySelectorAll('.toolbar-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-interval') === interval) {
            btn.classList.add('active');
        }
    });
}

// Закрытие графика
function closeChart() {
    document.getElementById('chartContainer').style.display = 'none';
    document.body.style.overflow = 'auto';
    if (chartWidget) {
        chartWidget.remove();
        chartWidget = null;
    }
}

// ... (остальные функции остаются такими же) ...
