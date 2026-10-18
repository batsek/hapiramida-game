<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>משחק פירמידה - מרובה משתתפים</title>
    <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
    <style>
        :root {
            --bg-color: #1a472a;
            --card-bg: #ffffff;
            --accent-color: #f39c12;
            --text-color: #ffffff;
        }

        * {
            box-sizing: border-box;
            user-select: none;
            -webkit-user-select: none;
        }

        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        header {
            width: 100%;
            background: rgba(0, 0, 0, 0.4);
            padding: 10px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }

        h1 {
            margin: 0;
            font-size: 1.4rem;
            color: var(--accent-color);
        }

        .status-bar {
            display: flex;
            gap: 15px;
            font-size: 0.9rem;
        }

        .game-container {
            flex: 1;
            width: 100%;
            max-width: 800px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            padding: 15px;
        }

        /* Pyramid Grid */
        .pyramid {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            margin-top: 10px;
            width: 100%;
        }

        .pyramid-row {
            display: flex;
            justify-content: center;
            gap: 8px;
        }

        /* Cards */
        .card {
            width: 55px;
            height: 80px;
            background: var(--card-bg);
            border-radius: 6px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 4px;
            color: #000;
            font-weight: bold;
            font-size: 1rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            position: relative;
        }

        .card.red {
            color: #e74c3c;
        }

        .card.selected {
            transform: translateY(-8px);
            box-shadow: 0 0 12px #f1c40f;
            border: 2px solid #f1c40f;
        }

        .card.covered {
            filter: brightness(0.6);
            cursor: not-allowed;
        }

        .card-val-top {
            align-self: flex-start;
            font-size: 0.8rem;
            line-height: 1;
        }

        .card-suit-center {
            align-self: center;
            font-size: 1.4rem;
        }

        .card-val-bottom {
            align-self: flex-end;
            font-size: 0.8rem;
            line-height: 1;
            transform: rotate(180deg);
        }

        /* Deck & Waste Area */
        .controls-area {
            display: flex;
            gap: 20px;
            align-items: center;
            margin: 20px 0;
        }

        .deck-slot, .waste-slot {
            width: 60px;
            height: 85px;
            border: 2px dashed rgba(255, 255, 255, 0.4);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }

        .deck-back {
            background: linear-gradient(135deg, #2980b9, #2c3e50);
            border: 2px solid #fff;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
        }

        /* Leaderboard & Controls */
        .action-btn {
            background: var(--accent-color);
            border: none;
            padding: 10px 20px;
            color: #fff;
            font-weight: bold;
            border-radius: 20px;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
            transition: background 0.2s;
        }

        .action-btn:hover {
            background: #e67e22;
        }

        .scoreboard {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            padding: 10px 15px;
            width: 100%;
            display: flex;
            justify-content: space-around;
        }

        .player-tag {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .score-val {
            color: var(--accent-color);
            font-weight: bold;
        }

        @media (min-width: 600px) {
            .card {
                width: 70px;
                height: 100px;
                font-size: 1.2rem;
            }
            .card-val-top, .card-val-bottom {
                font-size: 1rem;
            }
            .card-suit-center {
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>

    <header>
        <h1>משחק פירמידה ♠️</h1>
        <div class="status-bar">
            <span>סטאטוס: <strong id="conn-status" style="color:#2ecc71;">מחובר</strong></span>
        </div>
    </header>

    <div class="game-container">

        <!-- Scoreboard -->
        <div class="scoreboard">
            <div class="player-tag">
                <span>אתה:</span>
                <span id="my-score" class="score-val">0</span>
            </div>
            <div class="player-tag">
                <span>יריבים מחוברים:</span>
                <span id="players-count" class="score-val">1</span>
            </div>
        </div>

        <!-- Pyramid Cards -->
        <div class="pyramid" id="pyramid"></div>

        <!-- Deck & Waste Pile -->
        <div class="controls-area">
            <div class="deck-slot" id="deck-slot" onclick="drawCard()">
                <div class="card deck-back">🎴</div>
            </div>
            <div class="waste-slot" id="waste-slot">
                <!-- Top waste card renders here -->
            </div>
            <button class="action-btn" onclick="resetGame()">משחק חדש 🔄</button>
        </div>

    </div>

    <script>
        // Suits & Values
        const SUITS = [
            { symbol: '♠', color: 'black' },
            { symbol: '♥', color: 'red' },
            { symbol: '♦', color: 'red' },
            { symbol: '♣', color: 'black' }
        ];

        const VALUES = [
            { code: 'A', val: 1 },
            { code: '2', val: 2 },
            { code: '3', val: 3 },
            { code: '4', val: 4 },
            { code: '5', val: 5 },
            { code: '6', val: 6 },
            { code: '7', val: 7 },
            { code: '8', val: 8 },
            { code: '9', val: 9 },
            { code: '10', val: 10 },
            { code: 'J', val: 11 },
            { code: 'Q', val: 12 },
            { code: 'K', val: 13 }
        ];

        let deck = [];
        let pyramidData = [];
        let wastePile = [];
        let selectedCards = [];
        let score = 0;

        // Mock Socket Connection for inline demo / real socket when deployed
        let socket;
        try {
            socket = io();
            socket.on('updatePlayers', (players) => {
                document.getElementById('players-count').innerText = players.length;
            });
        } catch (e) {
            console.log("Local standalone mode running.");
        }

        function createDeck() {
            let fullDeck = [];
            let id = 0;
            for (let suit of SUITS) {
                for (let val of VALUES) {
                    fullDeck.push({
                        id: id++,
                        suit: suit.symbol,
                        color: suit.color,
                        code: val.code,
                        val: val.val
                    });
                }
            }
            // Shuffle
            return fullDeck.sort(() => Math.random() - 0.5);
        }

        function initGame() {
            deck = createDeck();
            pyramidData = [];
            wastePile = [];
            selectedCards = [];
            score = 0;
            document.getElementById('my-score').innerText = score;

            // Build 7 rows pyramid (28 cards)
            let cardIdx = 0;
            for (let row = 0; row < 7; row++) {
                pyramidData[row] = [];
                for (let col = 0; col <= row; col++) {
                    let card = deck[cardIdx++];
                    card.row = row;
                    card.col = col;
                    card.removed = false;
                    pyramidData[row].push(card);
                }
            }

            // Remaining cards go to deck
            deck = deck.slice(cardIdx);

            renderBoard();
        }

        function isCardUncovered(row, col) {
            if (row === 6) return true; // Bottom row
            const leftChild = pyramidData[row + 1]?.[col];
            const rightChild = pyramidData[row + 1]?.[col + 1];
            return (leftChild?.removed ?? true) && (rightChild?.removed ?? true);
        }

        function renderBoard() {
            const pyramidEl = document.getElementById('pyramid');
            pyramidEl.innerHTML = '';

            // Render Pyramid Rows
            pyramidData.forEach((rowCards, r) => {
                const rowEl = document.createElement('div');
                rowEl.className = 'pyramid-row';

                rowCards.forEach((card, c) => {
                    if (card.removed) {
                        const emptySlot = document.createElement('div');
                        emptySlot.className = 'card';
                        emptySlot.style.visibility = 'hidden';
                        rowEl.appendChild(emptySlot);
                        return;
                    }

                    const isUncovered = isCardUncovered(r, c);
                    const cardEl = createCardUI(card, isUncovered);

                    if (isUncovered) {
                        cardEl.onclick = () => handleCardClick(card, 'pyramid');
                    } else {
                        cardEl.classList.add('covered');
                    }

                    rowEl.appendChild(cardEl);
                });

                pyramidEl.appendChild(rowEl);
            });

            // Render Waste Pile
            const wasteSlot = document.getElementById('waste-slot');
            wasteSlot.innerHTML = '';
            if (wastePile.length > 0) {
                const topWaste = wastePile[wastePile.length - 1];
                const wasteEl = createCardUI(topWaste, true);
                wasteEl.onclick = () => handleCardClick(topWaste, 'waste');
                wasteSlot.appendChild(wasteEl);
            }

            // Update Deck UI
            const deckSlot = document.getElementById('deck-slot');
            deckSlot.style.opacity = deck.length > 0 ? '1' : '0.3';
        }

        function createCardUI(card, active) {
            const el = document.createElement('div');
            el.className = `card ${card.color === 'red' ? 'red' : ''}`;
            
            if (selectedCards.some(c => c.card.id === card.id)) {
                el.classList.add('selected');
            }

            el.innerHTML = `
                <div class="card-val-top">${card.code}</div>
                <div class="card-suit-center">${card.suit}</div>
                <div class="card-val-bottom">${card.code}</div>
            `;
            return el;
        }

        function drawCard() {
            if (deck.length > 0) {
                wastePile.push(deck.pop());
                selectedCards = [];
                renderBoard();
            }
        }

        function handleCardClick(card, source) {
            // King removes immediately
            if (card.val === 13) {
                removeCard(card, source);
                score += 13;
                document.getElementById('my-score').innerText = score;
                selectedCards = [];
                renderBoard();
                return;
            }

            // Select / Deselect
            const existingIdx = selectedCards.findIndex(c => c.card.id === card.id);
            if (existingIdx > -1) {
                selectedCards.splice(existingIdx, 1);
            } else {
                selectedCards.push({ card, source });
            }

            // Check Pair Sum = 13
            if (selectedCards.length === 2) {
                const sum = selectedCards[0].card.val + selectedCards[1].card.val;
                if (sum === 13) {
                    selectedCards.forEach(item => removeCard(item.card, item.source));
                    score += 13;
                    document.getElementById('my-score').innerText = score;
                }
                selectedCards = [];
            }

            renderBoard();
        }

        function removeCard(card, source) {
            if (source === 'pyramid') {
                card.removed = true;
            } else if (source === 'waste') {
                wastePile.pop();
            }
        }

        function resetGame() {
            initGame();
        }

        // Start
        initGame();
    </script>
</body>
</html>
