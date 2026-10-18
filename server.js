const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="he" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>משחק פירמידה - Multiplayer & AI</title>
            <style>
                * { box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                body { background: #1e272e; color: #ffffff; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
                
                /* מסך טעינה */
                #loading-screen { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #0f172a; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 9999; }
                .loader-bar { width: 300px; height: 20px; background: #334155; border-radius: 10px; overflow: hidden; margin-top: 15px; border: 2px solid #64748b; }
                .loader-fill { width: 0%; height: 100%; background: linear-gradient(90deg, #f59e0b, #ef4444); transition: width 0.1s; }
                #tip-text { margin-top: 15px; font-size: 15px; color: #cbd5e1; font-style: italic; max-width: 80%; text-align: center; }

                /* כרטיסיות */
                .card { background: #2d3748; padding: 25px; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); width: 100%; max-width: 500px; text-align: center; margin-bottom: 20px; }
                h1 { color: #f6e58d; margin-bottom: 5px; }
                .stats-bar { display: flex; justify-content: space-around; background: #1a202c; padding: 10px; border-radius: 10px; margin: 15px 0; }
                
                button { background: #0984e3; color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; margin: 5px; transition: 0.2s; }
                button:hover { background: #74b9ff; transform: translateY(-2px); }
                button:disabled { background: #636e72; cursor: not-allowed; transform: none; }
                .btn-danger { background: #d63031; }
                .btn-success { background: #2ed573; }

                /* חנות ושדרוגים */
                .shop-box { background: #222f3e; padding: 15px; border-radius: 10px; margin-top: 15px; border: 1px solid #576574; }

                /* אזור המשחק */
                #game-area { display: none; width: 100%; max-width: 500px; background: #2d3748; padding: 20px; border-radius: 15px; margin-bottom: 20px; }
                .ingame-shop { display: flex; justify-content: space-between; background: #1a202c; padding: 10px; border-radius: 10px; margin-top: 15px; gap: 5px; }
                .ingame-shop button { flex: 1; font-size: 13px; padding: 8px 5px; }

                /* צ'אט */
                #chat-box { width: 100%; max-width: 500px; background: #2d3748; border-radius: 10px; padding: 10px; height: 180px; display: flex; flex-direction: column; }
                #messages { flex: 1; overflow-y: auto; text-align: right; padding: 5px; background: #1a202c; border-radius: 5px; margin-bottom: 8px; }
                .chat-input { display: flex; gap: 5px; }
                .chat-input input { flex: 1; padding: 8px; border-radius: 5px; border: none; }

                /* מסך סיום */
                #end-screen { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: none; flex-direction: column; justify-content: center; align-items: center; z-index: 999; }
                .players-list { background: #2d3748; padding: 15px; border-radius: 10px; margin: 15px 0; min-width: 250px; }
            </style>
        </head>
        <body>

            <!-- מסך טעינה -->
            <div id="loading-screen">
                <h2 style="color:#f6e58d;">טוען את משחק הפירמידה...</h2>
                <div class="loader-bar"><div class="loader-fill" id="loader"></div></div>
                <div id="loading-percentage">0%</div>
                <div id="tip-text">טיפ: תכנן את הצעדים שלך מראש כדי לפנות את בסיס הפירמידה!</div>
            </div>

            <!-- מסך משחק ראשי / תפריט -->
            <div class="card" id="main-menu">
                <h1>🏆 משחק פירמידה</h1>
                <div class="stats-bar">
                    <div>💰 כסף: <span id="coins-display" style="color:#2ed573; font-weight:bold;">0</span>₪</div>
                    <div>🎯 ניסיונות: <span id="attempts-display" style="color:#ff7979; font-weight:bold;">1</span>/5</div>
                </div>

                <h3>בחר מצב משחק:</h3>
                <button onclick="startGame('multiplayer')" class="btn-success">🎮 משחק נגד שחקנים אמיתיים</button>
                <button onclick="startGame('ai')">🤖 משחק נגד AI (בוט)</button>

                <!-- חנות תפריט -->
                <div class="shop-box">
                    <h4>🛒 חנות המשחק</h4>
                    <p id="shop-info">קנה ניסיון נוסף לתחילת משחק</p>
                    <button id="buy-btn" onclick="buyAttempt()">קנה ניסיון ב-1,000₪</button>
                </div>
            </div>

            <!-- לוח המשחק הפעיל -->
            <div id="game-area">
                <h2>🎮 משחק בפעולה</h2>
                <div class="stats-bar">
                    <div>⏱️ זמן לשאלה: <span id="timer-display" style="color:#f1c40f; font-weight:bold;">15</span> שניות</div>
                    <div>🎯 ניסיונות בסיבוב: <span id="ingame-attempts" style="color:#ff7979; font-weight:bold;">1</span></div>
                </div>

                <div style="background:#1a202c; padding:20px; border-radius:10px; margin:15px 0;">
                    <p id="question-text">שאלה: כמה קלפים יש בחפיסה תקנית?</p>
                    <button onclick="answerQuestion(true)" class="btn-success">52 קלפים</button>
                    <button onclick="answerQuestion(false)" class="btn-danger">48 קלפים</button>
                </div>

                <!-- חנות בזמן משחק -->
                <div class="ingame-shop">
                    <button onclick="buyTimeInGame()" id="buy-time-btn">⏱️ מילוי זמן (50₪)</button>
                    <button onclick="buyAttemptInGame()" id="buy-attempt-btn">🎯 עוד ניסיון (150₪)</button>
                </div>
                <div style="margin-top: 10px;">
                    <button onclick="endGameSimulation(true)" class="btn-success">סיים בניצחון (הדגמה)</button>
                    <button onclick="endGameSimulation(false)" class="btn-danger">סיים בהפסד (הדגמה)</button>
                </div>
            </div>

            <!-- אזור צ'אט -->
            <div id="chat-box">
                <h4 style="margin: 0 0 5px 0; color: #f6e58d;">💬 צ'אט החדר</h4>
                <div id="messages"></div>
                <div class="chat-input">
                    <input type="text" id="chat-msg" placeholder="כתוב הודעה...">
                    <button onclick="sendMessage()">שלח</button>
                </div>
            </div>

            <!-- מסך סיום משחק -->
            <div id="end-screen">
                <h1 id="end-title" style="font-size: 40px;"></h1>
                <p id="reward-text" style="color: #2ed573; font-size: 20px; font-weight: bold;"></p>
                <div class="players-list">
                    <h3>משתתפים בסיבוב:</h3>
                    <ul id="players-end-list" style="list-style: none; padding: 0;"></ul>
                </div>
                <button onclick="closeEndScreen()" class="btn-success">חזור לתפריט</button>
            </div>

            <script src="/socket.io/socket.io.js"></script>
            <script>
                const socket = io();
                
                // נתוני שחקן מקומיים
                let coins = 0; // מתחילים מ-0 שקלים
                let attempts = 1;
                let maxAttempts = 5;
                let inGameTimer = 15;
                let timerInterval = null;
                let currentGameMode = '';

                const tips = [
                    "טיפ: תוכל לרכוש עוד ניסיונות ותוספת זמן בזמן המשחק!",
                    "טיפ: ניסיונות בחנות הראשית עולים יותר ככל שקונים יותר.",
                    "טיפ: במשחק נגד AI, הבוט מחשב מהלכים במהירות - שים לב לזמן!",
                    "טיפ: השתמש בצ'אט כדי לתקשר עם שחקנים בזמן אמת!"
                ];

                // מסך טעינה
                let progress = 0;
                const tipElem = document.getElementById('tip-text');
                const loaderElem = document.getElementById('loader');
                const percentElem = document.getElementById('loading-percentage');

                const loadingInterval = setInterval(() => {
                    progress += 2;
                    loaderElem.style.width = progress + '%';
                    percentElem.innerText = progress + '%';

                    if (progress % 25 === 0) {
                        const randomTip = tips[Math.floor(Math.random() * tips.length)];
                        tipElem.innerText = randomTip;
                    }

                    if (progress >= 100) {
                        clearInterval(loadingInterval);
                        document.getElementById('loading-screen').style.display = 'none';
                    }
                }, 40);

                // עדכון ממשק משתמש
                function updateUI() {
                    document.getElementById('coins-display').innerText = coins;
                    document.getElementById('attempts-display').innerText = attempts;
                    document.getElementById('ingame-attempts').innerText = attempts;

                    // חנות ראשית
                    const nextCost = attempts * 1000;
                    const buyBtn = document.getElementById('buy-btn');
                    
                    if (attempts >= maxAttempts) {
                        buyBtn.innerText = "הגעת למקסימום ניסיונות (5)";
                        buyBtn.disabled = true;
                    } else {
                        buyBtn.innerText = 'קנה ניסיון (' + attempts + '/' + maxAttempts + ') ב-' + nextCost.toLocaleString() + '₪';
                        buyBtn.disabled = coins < nextCost;
                    }

                    // כפתורי חנות בזמן משחק
                    const buyTimeBtn = document.getElementById('buy-time-btn');
                    const buyAttemptBtn = document.getElementById('buy-attempt-btn');
                    
                    if (buyTimeBtn) buyTimeBtn.disabled = coins < 50;
                    if (buyAttemptBtn) buyAttemptBtn.disabled = coins < 150;
                }

                // קניית ניסיון בחנות הראשית
                function buyAttempt() {
                    const cost = attempts * 1000;
                    if (coins >= cost && attempts < maxAttempts) {
                        coins -= cost;
                        attempts++;
                        updateUI();
                        alert('תתחדש! יש לך עכשיו ' + attempts + ' ניסיונות.');
                    }
                }

                // קניית מילוי זמן בזמן משחק (50₪)
                function buyTimeInGame() {
                    if (coins >= 50) {
                        coins -= 50;
                        inGameTimer = 15;
                        document.getElementById('timer-display').innerText = inGameTimer;
                        updateUI();
                        alert('הזמן לשאלה התמלא מחדש ל-15 שניות!');
                    }
                }

                // קניית ניסיון בזמן משחק (150₪)
                function buyAttemptInGame() {
                    if (coins >= 150) {
                        coins -= 150;
                        attempts++;
                        updateUI();
                        alert('נוסף לך ניסיון נוסף לסיבוב!');
                    }
                }

                // התחלת משחק
                function startGame(mode) {
                    currentGameMode = mode;
                    document.getElementById('main-menu').style.display = 'none';
                    document.getElementById('game-area').style.display = 'block';

                    // טיימר לשאלה
                    inGameTimer = 15;
                    document.getElementById('timer-display').innerText = inGameTimer;
                    clearInterval(timerInterval);
                    
                    timerInterval = setInterval(() => {
                        inGameTimer--;
                        document.getElementById('timer-display').innerText = inGameTimer;
                        if (inGameTimer <= 0) {
                            clearInterval(timerInterval);
                            alert('נגמר הזמן לשאלה!');
                        }
                    }, 1000);

                    if (mode === 'multiplayer') {
                        socket.emit('joinGame');
                    }
                }

                function answerQuestion(isCorrect) {
                    if (isCorrect) {
                        coins += 200; // הפרס על תשובה נכונה
                        alert('תשובה נכונה! הרווחת 200₪');
                    } else {
                        alert('תשובה שגויה!');
                    }
                    updateUI();
                }

                function endGameSimulation(isWin) {
                    clearInterval(timerInterval);
                    document.getElementById('game-area').style.display = 'none';
                    document.getElementById('main-menu').style.display = 'block';

                    let earned = isWin ? 500 : 50;
                    coins += earned;
                    updateUI();

                    const playerList = currentGameMode === 'ai' ? ['אתה (שחקן)', 'AI_Bot_Alpha'] : ['אתה (שחקן)', 'Player_2', 'Player_3'];
                    showEndScreen(isWin, playerList, earned);
                }

                // צ'אט
                function sendMessage() {
                    const input = document.getElementById('chat-msg');
                    if (input.value.trim() !== '') {
                        socket.emit('chatMessage', input.value);
                        input.value = '';
                    }
                }

                socket.on('message', (msg) => {
                    const msgDiv = document.createElement('div');
                    msgDiv.innerText = msg;
                    document.getElementById('messages').appendChild(msgDiv);
                    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
                });

                // מסך סיום
                function showEndScreen(isWin, playerList, earnedCoins) {
                    const screen = document.getElementById('end-screen');
                    const title = document.getElementById('end-title');
                    const rewardText = document.getElementById('reward-text');
                    const list = document.getElementById('players-end-list');

                    title.innerText = isWin ? '🏆 ניצחון מוחץ!' : '❌ הפסדת!';
                    title.style.color = isWin ? '#2ed573' : '#ff4757';

                    rewardText.innerText = 'הרווחת בסיבוב הזה: ' + earnedCoins + '₪';

                    list.innerHTML = '';
                    playerList.forEach(p => {
                        const li = document.createElement('li');
                        li.innerText = '👤 ' + p;
                        list.appendChild(li);
                    });

                    screen.style.display = 'flex';
                }

                function closeEndScreen() {
                    document.getElementById('end-screen').style.display = 'none';
                }

                updateUI();
            </script>
        </body>
        </html>
    `);
});

// לוגיקת שרת
io.on('connection', (socket) => {
    console.log('שחקן התחבר:', socket.id);
    
    socket.on('chatMessage', (msg) => {
        io.emit('message', `שחקן (${socket.id.substring(0,4)}): ${msg}`);
    });

    socket.on('disconnect', () => {
        console.log('שחקן התנתק:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
