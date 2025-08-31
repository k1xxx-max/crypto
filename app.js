// Главные переменные
let currentPage = 'main';
let userData = null;
const cryptos = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT', 'TONUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOTUSDT'];

// Инициализация приложения
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    // 1. Расширяем приложение на весь экран
    Telegram.WebApp.expand();

    // 2. Пытаемся получить данные пользователя
    userData = Telegram.WebApp.initDataUnsafe?.user;

    // 3. Обновляем интерфейс в зависимости от авторизации
    updateAuthUI();

    // 4. Инициализируем навигацию
    setupNavigation();

    // 5. Заполняем список криптовалют
    renderCryptoList();

    // 6. Вешаем обработчик на кнопку авторизации
    document.getElementById('auth-button').addEventListener('click', requestAuth);
}

// Функция для обновления UI в зависимости от статуса авторизации
function updateAuthUI() {
    const mainPage = document.getElementById('main-page');
    const authBtn = document.getElementById('auth-button');

    if (userData) {
        // Пользователь авторизован
        document.getElementById('user-id').textContent = userData.id;
        document.getElementById('user-name').textContent = `${userData.first_name} ${userData.last_name || ''}`;
        authBtn.style.display = 'none'; // Скрываем кнопку авторизации
    } else {
        // Пользователь не авторизован
        authBtn.style.display = 'block'; // Показываем кнопку
    }
}

// Функция запроса данных у пользователя (номера телефона)
function requestAuth() {
    Telegram.WebApp.openTelegramLink('https://t.me/your_bot?start=auth');
    // Ваш бот должен обработать команду /start auth и вернуть пользователя обратно в приложение с данными
}

// Настройка навигации
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const pageId = button.getAttribute('data-page');

            // Убираем активный класс у всех кнопок и страниц
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

            // Добавляем активный класс выбранной кнопке и странице
            button.classList.add('active');
            document.getElementById(`${pageId}-page`).classList.add('active');

            currentPage = pageId;
        });
    });
}

// Генерация списка криптовалют для торговли
function renderCryptoList() {
    const container = document.querySelector('.crypto-list');
    container.innerHTML = ''; // Очищаем контейнер

    cryptos.forEach(crypto => {
        const cryptoElement = document.createElement('div');
        cryptoElement.className = 'crypto-item';
        cryptoElement.innerHTML = `
            <div class="crypto-info">
                <strong>${crypto}</strong>
                <div>Цена: $<span class="price">${(Math.random() * 100000).toFixed(2)}</span></div>
            </div>
            <div class="trade-buttons">
                <button class="btn-long" onclick="openTradeModal('${crypto}', 'long')">LONG</button>
                <button class="btn-short" onclick="openTradeModal('${crypto}', 'short')">SHORT</button>
            </div>
        `;
        container.appendChild(cryptoElement);
    });
}

// Функция для открытия модального окна торговли (заглушка)
function openTradeModal(symbol, type) {
    alert(`Открываем ордер: ${symbol} ${type.toUpperCase()}`);
    // Здесь будет сложная логика: ввод объема, кредитного плеча, проверка баланса и т.д.
}

// (Опционально) Функция для обновления цен в реальном времени
function startPriceUpdates() {
    setInterval(() => {
        document.querySelectorAll('.crypto-item .price').forEach(element => {
            // Имитация изменения цены
            const currentPrice = parseFloat(element.textContent);
            const change = (Math.random() - 0.5) * 100;
            element.textContent = (currentPrice + change).toFixed(2);
        });
    }, 3000); // Обновляем каждые 3 секунды
}

// Запускаем обновление цен после загрузки
startPriceUpdates();