// Конфигурация игры
const GRID_SIZE = 25; // 5x5
const MULTIPLIERS = {
    1: 14.0, 2: 7.0, 3: 4.5, 4: 3.0, 5: 2.5,
    6: 2.0, 7: 1.8, 8: 1.6, 9: 1.4, 10: 1.3
};

// Состояние игры
let gameState = {
    balance: 1000.00,
    betAmount: 10.00,
    minesCount: 3,
    isPlaying: false,
    selectedCells: [],
    minePositions: [],
    currentMultiplier: 1.00,
    gameHistory: []
};

// Инициализация игры
function initGame() {
    updateBalance();
    updateBetDisplay();
    updateMinesCount();
    updateMultiplier();
    generateGrid();
    loadGameHistory();
}

// Обновление баланса
function updateBalance() {
    document.getElementById('balance').textContent = gameState.balance.toFixed(2);
}

// Обновление ставки
function updateBetDisplay() {
    document.getElementById('betAmount').value = gameState.betAmount.toFixed(2);
}

// Изменение ставки
function changeBet(amount) {
    const newBet = gameState.betAmount + amount;
    if (newBet >= 1 && newBet <= gameState.balance) {
        gameState.betAmount = newBet;
        updateBetDisplay();
        updateMultiplier();
    }
}

// Обновление количества мин
function updateMinesCount() {
    const minesCount = document.getElementById('minesCount');
    const currentMines = document.getElementById('currentMines');
    const slider = document.getElementById('minesSlider');
    
    gameState.minesCount = parseInt(slider.value);
    minesCount.textContent = gameState.minesCount;
    currentMines.textContent = gameState.minesCount;
    updateMultiplier();
}

// Обновление множителя
function updateMultiplier() {
    const multiplierValue = document.getElementById('multiplierValue');
    multiplierValue.textContent = MULTIPLIERS[gameState.minesCount].toFixed(1);
}

// Генерация игровой сетки
function generateGrid() {
    const grid = document.getElementById('minesGrid');
    grid.innerHTML = '';
    
    for (let i = 0; i < GRID_SIZE; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.textContent = '❓';
        cell.dataset.index = i;
        cell.onclick = () => selectCell(i);
        grid.appendChild(cell);
    }
}

// Выбор ячейки
function selectCell(index) {
    if (!gameState.isPlaying || gameState.selectedCells.includes(index)) return;
    
    const cell = document.querySelector(`.cell[data-index="${index}"]`);
    
    if (gameState.minePositions.includes(index)) {
        // Наступили на мину
        cell.textContent = '💣';
        cell.classList.add('mine');
        endGame(false);
    } else {
        // Безопасная ячейка
        cell.textContent = '💰';
        cell.classList.add('selected');
        gameState.selectedCells.push(index);
        
        // Обновляем множитель и выигрыш
        gameState.currentMultiplier = MULTIPLIERS[gameState.minesCount] * gameState.selectedCells.length;
        updateGameStatus();
        
        // Активируем кнопку "Забрать"
        document.getElementById('cashoutBtn').disabled = false;
    }
}

// Обновление статуса игры
function updateGameStatus() {
    document.getElementById('selectedCells').textContent = gameState.selectedCells.length;
    document.getElementById('currentMultiplier').textContent = 'x' + gameState.currentMultiplier.toFixed(2);
    
    const currentWin = (gameState.betAmount * gameState.currentMultiplier).toFixed(2);
    document.getElementById('currentWin').textContent = currentWin + ' USDT';
    document.getElementById('cashoutAmount').textContent = currentWin;
}

// Начать игру
function startGame() {
    if (gameState.isPlaying) return;
    
    if (gameState.betAmount > gameState.balance) {
        showNotification('Недостаточно средств!');
        return;
    }
    
    // Сброс состояния игры
    gameState.isPlaying = true;
    gameState.selectedCells = [];
    gameState.currentMultiplier = 1.00;
    gameState.minePositions = generateMines();
    
    // Обновление UI
    generateGrid();
    updateGameStatus();
    document.getElementById('startBtn').textContent = '🔄 Новая игра';
    document.getElementById('cashoutBtn').disabled = true;
    
    // Спишем ставку
    gameState.balance -= gameState.betAmount;
    updateBalance();
    
    showNotification('Игра началась! Выбирайте ячейки');
}

// Генерация мин
function generateMines() {
    const mines = [];
    const availablePositions = Array.from({length: GRID_SIZE}, (_, i) => i);
    
    for (let i = 0; i < gameState.minesCount; i++) {
        const randomIndex = Math.floor(Math.random() * availablePositions.length);
        mines.push(availablePositions.splice(randomIndex, 1)[0]);
    }
    
    return mines;
}

// Забрать выигрыш
function cashOut() {
    if (!gameState.isPlaying || gameState.selectedCells.length === 0) return;
    
    const winAmount = gameState.betAmount * gameState.currentMultiplier;
    gameState.balance += winAmount;
    
    endGame(true, winAmount);
}

// Завершение игры
function endGame(isWin, winAmount = 0) {
    gameState.isPlaying = false;
    
    // Показываем все мины
    gameState.minePositions.forEach(index => {
        const cell = document.querySelector(`.cell[data-index="${index}"]`);
        if (cell && !cell.classList.contains('mine')) {
            cell.textContent = '💣';
            cell.classList.add('mine');
        }
    });
    
    // Блокируем все ячейки
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.add('disabled');
        cell.onclick = null;
    });
    
    // Обновляем кнопки
    document.getElementById('startBtn').textContent = '🎮 Новая игра';
    document.getElementById('cashoutBtn').disabled = true;
    
    // Добавляем в историю
    addToHistory(isWin, winAmount);
    
    // Показываем результат
    showResultModal(isWin, winAmount);
}

// Показать модальное окно результата
function showResultModal(isWin, winAmount) {
    const modal = document.getElementById('resultModal');
    const resultIcon = document.getElementById('resultIcon');
    const resultMessage = document.getElementById('resultMessage');
    const resultAmount = document.getElementById('resultAmount');
    const resultCells = document.getElementById('resultCells');
    const resultMultiplier = document.getElementById('resultMultiplier');
    
    if (isWin) {
        resultIcon.textContent = '🎉';
        resultMessage.textContent = 'Победа!';
        resultAmount.textContent = '+' + winAmount.toFixed(2) + ' USDT';
        resultAmount.className = 'result-amount win';
    } else {
        resultIcon.textContent = '💥';
        resultMessage.textContent = 'Проигрыш!';
        resultAmount.textContent = '-' + gameState.betAmount.toFixed(2) + ' USDT';
        resultAmount.className = 'result-amount lose';
    }
    
    resultCells.textContent = gameState.selectedCells.length;
    resultMultiplier.textContent = gameState.currentMultiplier.toFixed(2);
    
    modal.style.display = 'flex';
}

// Закрыть модальное окно
function closeResultModal() {
    document.getElementById('resultModal').style.display = 'none';
}

// Добавить в историю
function addToHistory(isWin, amount) {
    const historyItem = {
        timestamp: new Date(),
        isWin: isWin,
        amount: amount,
        bet: gameState.betAmount,
        cells: gameState.selectedCells.length,
        multiplier: gameState.currentMultiplier
    };
    
    gameState.gameHistory.unshift(historyItem);
    saveGameHistory();
    updateHistoryDisplay();
}

// Обновить отображение истории
function updateHistoryDisplay() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    if (gameState.gameHistory.length === 0) {
        historyList.innerHTML = '<div class="history-placeholder">Начните играть!</div>';
        return;
    }
    
    gameState.gameHistory.slice(0, 5).forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${item.isWin ? 'win' : 'lose'}`;
        
        const time = item.timestamp.toLocaleTimeString();
        const amount = item.isWin ? `+${item.amount.toFixed(2)}` : `-${item.bet.toFixed(2)}`;
        
        historyItem.innerHTML = `
            <span>${time}</span>
            <span>${amount} USDT</span>
        `;
        
        historyList.appendChild(historyItem);
    });
}

// Сохранить историю в localStorage
function saveGameHistory() {
    localStorage.setItem('minesGameHistory', JSON.stringify(gameState.gameHistory));
    localStorage.setItem('minesGameBalance', gameState.balance.toString());
}

// Загрузить историю из localStorage
function loadGameHistory() {
    const savedHistory = localStorage.getItem('minesGameHistory');
    const savedBalance = localStorage.getItem('minesGameBalance');
    
    if (savedHistory) {
        gameState.gameHistory = JSON.parse(savedHistory);
    }
    
    if (savedBalance) {
        gameState.balance = parseFloat(savedBalance);
        updateBalance();
    }
    
    updateHistoryDisplay();
}

// Показать уведомление
function showNotification(message) {
    // Можно добавить красивый toast-уведомление
    console.log(message);
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    initGame();
    
    // Обработчики для слайдера
    document.getElementById('minesSlider').addEventListener('input', updateMinesCount);
    
    // Обработчик для ручного ввода ставки
    document.getElementById('betAmount').addEventListener('change', function() {
        let value = parseFloat(this.value);
        if (isNaN(value) || value < 1) value = 1;
        if (value > gameState.balance) value = gameState.balance;
        gameState.betAmount = value;
        updateBetDisplay();
        updateMultiplier();
    });
});

// Горячие клавиши
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !gameState.isPlaying) {
        startGame();
    } else if (e.key === ' ' && gameState.isPlaying) {
        cashOut();
    }
});

