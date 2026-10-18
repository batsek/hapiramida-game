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
            <title>משחק פירמידה - קלפים ואנימציות</title>
            <style>
                * { box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                body { background: #1e272e; color: #ffffff; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
                
                /* מסך טעינה */
                #loading-screen { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #0f172a; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 9999; }
                .loader-bar { width: 300px; height: 20px; background: #334155; border-radius: 10px; overflow: hidden; margin-top: 15px; border: 2px solid #64748b; }
                .loader-fill { width: 0%; height: 100%; background: linear-gradient(90deg, #f59e0b, #ef4444); transition: width 0.1s; }
                #tip-text { margin-top: 15px; font-size: 15px; color: #cbd5e1; font-style: italic; max-width: 80%; text-align: center; }

                /* קונטיינר ראשי ותפריטים */
                .card-box { background: #2d3748; padding: 20px; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); width: 100%; max-width: 600px; text-align: center; margin-bottom: 20px; }
                h1 { color: #f6e58d; margin-bottom: 5px; }
                .stats-bar { display: flex; justify-content: space-around; background: #1a202c; padding: 10px; border-radius: 10px; margin: 15px 0; font-size: 15px; }
                
                button { background: #0984e3; color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; margin: 5px; transition: 0.2s; }
                button:hover { background: #74b9ff; transform: translateY(-2px); }
                button:disabled { background: #636e72; cursor: not-allowed; transform: none; }
                .btn-danger { background: #d63031; }
                .btn-success { background: #2ed573; }

                /* פירמידת קלפים */
                #game-area { display: none; width: 100%; max-width: 600px; background: #2d3748; padding: 20px; border-radius: 15px; margin-bottom: 20px; text-align: center; }
                .pyramid-container { display: flex; flex-direction: column; align-items: center; gap: 10px; margin: 20px 0; }
                .pyramid-row { display: flex; justify-content: center; gap: 10px; }
                
                .playing-card {
                    width: 55px; height: 80px; background: #ffffff; color: #2d3748; border-radius: 6px;
                    display: flex; flex-direction: column; justify-content: center; align-items: center;
                    font-weight: bold; font-size: 16px; cursor: pointer; box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                    transition: transform 0.4s ease, background 0.3s;
                    transform-style: preserve-3d;
                }
                .playing-card.hidden { background: #c0392b; color: #c0392b; transform: rotateY(180deg); }
                .playing-card:hover:not(.hidden) { transform: scale(1.08); }

                /* שאלות וחנות במשחק */
                .question-box { background: #1a202c; padding: 15px; border-radius: 10px; margin-top: 15px; border: 1px solid #4a5568; }
                .ingame-shop { display: flex; justify-content: space-between; background: #1a202c; padding: 10px; border-radius: 10px; margin-top: 15px; gap: 5px; }
                .ingame-shop button { flex: 1; font-size: 12px; padding: 8px 3px; }

                /* צ'אט */
                #chat-box { width: 100%; max-width: 600px; background: #2d3748; border-radius: 10px; padding: 10px; height: 160px; display: flex; flex-direction: column; }
                #messages { flex: 1; overflow-y: auto; text-align: right; padding: 5px; background: #1a202c; border-radius: 5px; margin-bottom: 8px; font-size: 14px; }
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
                <div id="tip-text">טיפ: פנה את בסיס הפירמידה כדי להגיע לקלף שבראש!</div>
            </div>

            <!-- תפריט ראשי -->
            <div class="card-box" id="main-menu">
                <h1>🏆 משחק פירמידה</h1>
                <div class="stats-bar">
                    <div>💰 כסף: <span id="coins-display" style="color:#2ed573; font-weight:bold;">0</span>₪</div>
                    <div>🎯 ניסיונות: <span id="attempts-display" style="color:#ff7979; font-weight:bold;">1</span>/5</div>
                </div>

                <h3>בחר מצב משחק:</h3>
                <button onclick="startGame('multiplayer')" class="btn-success">🎮 משחק נגד שחקנים אמיתיים</button>
                <button onclick="startGame('ai')">🤖 משחק נגד AI (בוט)</button>

                <div style="background: #222f3e; padding: 12px; border-radius: 10px; margin-top: 15px; border: 1px solid #576574;">
                    <h4>🛒 חנות ראשית</h4>
                    <button id="buy-btn" onclick="buyAttempt()">קנה ניסיון ב-1,000₪</button>
                </div>
            </div>

            <!-- לוח משחק ופירמידה -->
            <div id="game-area">
                <h2>🔺 פירמידת הקלפים</h2>
                <div class="stats-bar">
                    <div>⏱️ זמן: <span id="timer-display" style="color:#f1c40f; font-weight:bold;">15</span>ש'</div>
                    <div>🎯 ניסיונות: <span id="ingame-attempts" style="color:#ff7979; font-weight:bold;">1</span></div>
                </div>

                <!-- פירמידת קלפים ויזואלית -->
                <div class="pyramid-container" id="pyramid-board">
                    <!-- נבנה אוטומטית דרך ג'אווהסקריפט -->
                </div>

                <!-- אזור שאלה פעילה -->
                <div class="question-box">
                    <p id="question-text" style="font-weight: bold; margin-bottom: 10px;">טוען שאלה...</p>
                    <div id="answers-container" style="display: flex; justify-content: center; gap: 10px;"></div>
                </div>

                <!-- חנות בזמן משחק -->
                <div class="ingame-shop">
                    <button onclick="buyTimeInGame()" id="buy-time-btn">⏱️ מילוי זמן (50₪)</button>
                    <button onclick="buyAttemptInGame()" id="buy-attempt-btn">🎯 עוד ניסיון (150₪)</button>
                </div>
            </div>

            <!-- צ'אט -->
            <div id="chat-box">
                <h4 style="margin: 0 0 5px 0; color: #f6e58d;">💬 צ'אט החדר</h4>
                <div id="messages"></div>
                <div class="chat-input">
                    <input type="text" id="chat-msg" placeholder="כתוב הודעה...">
                    <button onclick="sendMessage()">שלח</button>
                </div>
            </div>

            <!-- מסך סיום -->
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
                
                let coins = 0;
                let attempts = 1;
                let maxAttempts = 5;
                let inGameTimer = 15;
                let timerInterval = null;
                let currentGameMode = '';

                // אפקט סאונד מגניב בדפדפן (Web Audio API)
                function playSound(type) {
                    try {
                        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                        const osc = audioCtx.createOscillator();
                        const gain = audioCtx.createGain();
                        osc.connect(gain);
                        gain.connect(audioCtx.destination);

                        if (type === 'success') {
                            osc.frequency.setValueAtTime(440, audioCtx.currentTime);
                            osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
                            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
                            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                            osc.start();
                            osc.stop(audioCtx.currentTime + 0.3);
                        } else if (type === 'error') {
                            osc.frequency.setValueAtTime(200, audioCtx.currentTime);
                            osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.2);
                            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
                            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
                            osc.start();
                            osc.stop(audioCtx.currentTime + 0.25);
                        } else if (type === 'card') {
                            osc.type = 'triangle';
                            osc.frequency.setValueAtTime(600, audioCtx.currentTime);
                            osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
                            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
                            osc.start();
                            osc.stop(audioCtx.currentTime + 0.12);
                        }
                    } catch (e) { console.log(e); }
                }

                // שאלות למשחק
                const questions = [
                    { q: "כמה קלפים יש בחפיסת קלפים סטנדרטית?", options: ["52 קלפים", "48 קלפים", "54 קלפים"], correct: 0 },
                    { q: "מהו סכום המספרים מ-1 עד 10?", options: ["45", "55", "50"], correct: 1 },
                    { q: "איזה צבע מקבלים מערבוב אדום וכחול?", options: ["ירוק", "סגול", "כתום"], correct: 1 }
                ];
                let currentQIndex = 0;

                // מסך טעינה
                let progress = 0;
                const tips = ["טיפ: פתח את קלפי הבסיס כדי להתקדם לראש הפירמידה!", "טיפ: קנה תוספת זמן או ניסיונות בזמן המשחק כדי להציל סיבובים!"];
                const loadingInterval = setInterval(() => {
                    progress += 4;
                    document.getElementById('loader').style.width = progress + '%';
                    document.getElementById('loading-percentage').innerText = progress + '%';
                    if (progress % 50 === 0) {
                        document.getElementById('tip-text').innerText = tips[Math.floor(Math.random() * tips.length)];
                    }
                    if (progress >= 100) {
                        clearInterval(loadingInterval);
                        document.getElementById('loading-screen').style.display = 'none';
                    }
                }, 30);

                function updateUI() {
                    document.getElementById('coins-display').innerText = coins;
                    document.getElementById('attempts-display').innerText = attempts;
                    document.getElementById('ingame-attempts').innerText = attempts;

                    const nextCost = attempts * 1000;
                    const buyBtn = document.getElementById('buy-btn');
                    if (attempts >= maxAttempts) {
                        buyBtn.innerText = "מקסימום ניסיונות (5)";
                        buyBtn.disabled = true;
                    } else {
                        buyBtn.innerText = 'קנה ניסיון (' + attempts + '/' + maxAttempts + ') ב-' + nextCost.toLocaleString() + '₪';
                        buyBtn.disabled = coins < nextCost;
                    }

                    document.getElementById('buy-time-btn').disabled = coins < 50;
                    document.getElementById('buy-attempt-btn').disabled = coins < 150;
                }

                function buyAttempt() {
                    const cost = attempts * 1000;
                    if (coins >= cost && attempts < maxAttempts) {
                        coins -= cost;
                        attempts++;
                        playSound('success');
                        updateUI();
                    }
                }

                function buyTimeInGame() {
                    if (coins >= 50) {
                        coins -= 50;
                        inGameTimer = 15;
                        playSound('success');
                        updateUI();
                    }
                }

                function buyAttemptInGame() {
                    if (coins >= 150) {
                        coins -= 150;
                        attempts++;
                        playSound('success');
                        updateUI();
                    }
                }

                // בניית הפירמידה הוויזואלית (4 שורות: 1, 2, 3, 4 קלפים)
                function buildPyramid() {
                    const board = document.getElementById('pyramid-board');
                    board.innerHTML = '';
                    const rowsConfig = [1, 2, 3, 4];

                    rowsConfig.forEach((rowCount, rowIndex) => {
                        const rowDiv = document.createElement('div');
                        rowDiv.className = 'pyramid-row';
                        for (let i = 0; i < rowCount; i++) {
                            const card = document.createElement('div');
                            card.className = 'playing-card hidden';
                            card.innerHTML = '🂠';
                            card.dataset.row = rowIndex;
                            card.onclick = () => tryOpenCard(card);
                            rowDiv.appendChild(card);
                        }
                        board.appendChild(rowDiv);
                    });
                }

                function tryOpenCard(cardElement) {
                    if (!cardElement.classList.contains('hidden')) return;
                    playSound('card');
                    cardElement.classList.remove('hidden');
                    cardElement.innerHTML = 'A♥';
                    
                    coins += 100;
                    updateUI();
                    loadNextQuestion();
                }

                function loadNextQuestion() {
                    if (currentQIndex >= questions.length) currentQIndex = 0;
                    const qData = questions[currentQIndex++];
                    document.getElementById('question-text').innerText = qData.q;
                    
                    const ansContainer = document.getElementById('answers-container');
                    ansContainer.innerHTML = '';
                    qData.options.forEach((opt, idx) => {
                        const btn = document.createElement('button');
                        btn.innerText = opt;
                        btn.className = idx === qData.correct ? 'btn-success' : 'btn-danger';
                        btn.onclick = () => answerQuestion(idx === qData.correct);
                        ansContainer.appendChild(btn);
                    });
                }

                function answerQuestion(isCorrect) {
                    if (isCorrect) {
                        coins += 300;
                        playSound('success');
                        alert('כל הכבוד! תשובה נכונה (+300₪)');
                    } else {
                        playSound('error');
                        alert('טעות! נסה עוד קלף או רכוש זמן/ניסיון.');
                    }
                    updateUI();
                }

                function startGame(mode) {
                    currentGameMode = mode;
                    document.getElementById('main-menu').style.display = 'none';
                    document.getElementById('game-area').style.display = 'block';
                    buildPyramid();
                    loadNextQuestion();

                    inGameTimer = 15;
                    document.getElementById('timer-display').innerText = inGameTimer;
                    clearInterval(timerInterval);
                    timerInterval = setInterval(() => {
                        inGameTimer--;
                        document.getElementById('timer-display').innerText = inGameTimer;
                        if (inGameTimer <= 0) {
                            clearInterval(timerInterval);
                            playSound('error');
                            alert('נגמר הזמן לשאלה!');
                            endGameSimulation(false);
                        }
                    }, 1000);
                }

                function endGameSimulation(isWin) {
                    clearInterval(timerInterval);
                    document.getElementById('game-area').style.display = 'none';
                    document.getElementById('main-menu').style.display = 'block';

                    const earned = isWin ? 1000 : 100;
                    coins += earned;
                    updateUI();

                    const list = currentGameMode === 'ai' ? ['אתה (שחקן)', 'AI_Bot_Pro'] : ['אתה (שחקן)', 'Player_Two'];
                    showEndScreen(isWin, list, earned);
                }

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

                function showEndScreen(isWin, playerList, earnedCoins) {
                    document.getElementById('end-title').innerText = isWin ? '🏆 ניצחון מדהים!' : '❌ הפסדת בסיבוב!';
                    document.getElementById('end-title').style.color = isWin ? '#2ed573' : '#ff4757';
                    document.getElementById('reward-text').innerText = 'סך הכל הרווחת: ' + earnedCoins + '₪';
                    
                    const ul = document.getElementById('players-end-list');
                    ul.innerHTML = '';
                    playerList.forEach(p => {
                        const li = document.createElement('li');
                        li.innerText = '👤 ' + p;
                        ul.appendChild(li);
                    });
                    document.getElementById('end-screen').style.display = 'flex';
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

io.on('connection', (socket) => {
    socket.on('chatMessage', (msg) => {
        io.emit('message', `שחקן (${socket.id.substring(0,4)}): ${msg}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
