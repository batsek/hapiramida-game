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
            <title>משחק פירמידה ענק - 100+ שאלות</title>
            <style>
                * { box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                body { background: #1e272e; color: #ffffff; margin: 0; padding: 15px; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
                
                /* מסך טעינה */
                #loading-screen { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #0f172a; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 9999; }
                .loader-bar { width: 300px; height: 20px; background: #334155; border-radius: 10px; overflow: hidden; margin-top: 15px; border: 2px solid #64748b; }
                .loader-fill { width: 0%; height: 100%; background: linear-gradient(90deg, #f59e0b, #ef4444); transition: width 0.1s; }
                #tip-text { margin-top: 15px; font-size: 15px; color: #cbd5e1; font-style: italic; max-width: 80%; text-align: center; }

                /* קונטיינר ותפריטים */
                .card-box { background: #2d3748; padding: 20px; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); width: 100%; max-width: 650px; text-align: center; margin-bottom: 15px; }
                h1 { color: #f6e58d; margin-bottom: 5px; }
                .stats-bar { display: flex; justify-content: space-around; background: #1a202c; padding: 10px; border-radius: 10px; margin: 15px 0; font-size: 15px; }
                
                button { background: #0984e3; color: white; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: bold; margin: 4px; transition: 0.2s; }
                button:hover { background: #74b9ff; transform: translateY(-2px); }
                button:disabled { background: #636e72; cursor: not-allowed; transform: none; }
                .btn-danger { background: #d63031; }
                .btn-success { background: #2ed573; }

                /* פירמידת קלפים מדורגת אמיתית */
                #game-area { display: none; width: 100%; max-width: 650px; background: #2d3748; padding: 15px; border-radius: 15px; margin-bottom: 15px; text-align: center; }
                .pyramid-container { display: flex; flex-direction: column; align-items: center; gap: 8px; margin: 15px 0; }
                .pyramid-row { display: flex; justify-content: center; gap: 8px; }
                
                .playing-card {
                    width: 48px; height: 72px; background: #ffffff; color: #2d3748; border-radius: 5px;
                    display: flex; flex-direction: column; justify-content: center; align-items: center;
                    font-weight: bold; font-size: 14px; cursor: pointer; box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                    transition: transform 0.4s ease, background 0.3s;
                }
                .playing-card.hidden { background: #c0392b; color: #c0392b; }
                .playing-card:hover:not(.hidden) { transform: scale(1.08); }

                /* שאלות וחנות */
                .question-box { background: #1a202c; padding: 12px; border-radius: 10px; margin-top: 10px; border: 1px solid #4a5568; }
                .ingame-shop { display: flex; justify-content: space-between; background: #1a202c; padding: 8px; border-radius: 10px; margin-top: 10px; gap: 5px; }
                .ingame-shop button { flex: 1; font-size: 12px; padding: 6px 2px; }

                /* צ'אט */
                #chat-box { width: 100%; max-width: 650px; background: #2d3748; border-radius: 10px; padding: 10px; height: 140px; display: flex; flex-direction: column; }
                #messages { flex: 1; overflow-y: auto; text-align: right; padding: 5px; background: #1a202c; border-radius: 5px; margin-bottom: 6px; font-size: 13px; }
                .chat-input { display: flex; gap: 5px; }
                .chat-input input { flex: 1; padding: 6px; border-radius: 5px; border: none; }

                /* מסך סיום */
                #end-screen { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: none; flex-direction: column; justify-content: center; align-items: center; z-index: 999; }
                .players-list { background: #2d3748; padding: 15px; border-radius: 10px; margin: 15px 0; min-width: 250px; }
            </style>
        </head>
        <body>

            <!-- מסך טעינה -->
            <div id="loading-screen">
                <h2 style="color:#f6e58d;">טוען את הפירמידה ועמודי השאלות...</h2>
                <div class="loader-bar"><div class="loader-fill" id="loader"></div></div>
                <div id="loading-percentage">0%</div>
                <div id="tip-text">טיפ: טוענים למעלה מ-100 שאלות ייחודיות לכל קומה בפירמידה!</div>
            </div>

            <!-- תפריט ראשי -->
            <div class="card-box" id="main-menu">
                <h1>🏆 משחק פירמידה ענק</h1>
                <div class="stats-bar">
                    <div>💰 כסף: <span id="coins-display" style="color:#2ed573; font-weight:bold;">0</span>₪</div>
                    <div>🎯 ניסיונות: <span id="attempts-display" style="color:#ff7979; font-weight:bold;">1</span>/5</div>
                </div>

                <h3>בחר מצב משחק:</h3>
                <button onclick="startGame('multiplayer')" class="btn-success">🎮 משחק נגד שחקנים אמיתיים</button>
                <button onclick="startGame('ai')">🤖 משחק נגד AI (בוט)</button>

                <div style="background: #222f3e; padding: 10px; border-radius: 10px; margin-top: 12px; border: 1px solid #576574;">
                    <h4>🛒 חנות ראשית</h4>
                    <button id="buy-btn" onclick="buyAttempt()">קנה ניסיון ב-1,000₪</button>
                </div>
            </div>

            <!-- לוח משחק ופירמידה מדורגת -->
            <div id="game-area">
                <h2>🔺 פירמידת הקלפים המדורגת</h2>
                <div class="stats-bar">
                    <div>⏱️ זמן: <span id="timer-display" style="color:#f1c40f; font-weight:bold;">15</span>ש'</div>
                    <div>🎯 ניסיונות: <span id="ingame-attempts" style="color:#ff7979; font-weight:bold;">1</span></div>
                </div>

                <!-- הפירמידה המדורגת (6, 5, 4, 3, 2, 1) -->
                <div class="pyramid-container" id="pyramid-board"></div>

                <!-- אזור שאלה פעילה -->
                <div class="question-box">
                    <p id="question-text" style="font-weight: bold; margin-bottom: 8px;">טוען שאלה...</p>
                    <div id="answers-container" style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;"></div>
                </div>

                <!-- חנות בזמן משחק -->
                <div class="ingame-shop">
                    <button onclick="buyTimeInGame()" id="buy-time-btn">⏱️ מילוי זמן (50₪)</button>
                    <button onclick="buyAttemptInGame()" id="buy-attempt-btn">🎯 עוד ניסיון (150₪)</button>
                </div>
            </div>

            <!-- צ'אט -->
            <div id="chat-box">
                <h4 style="margin: 0 0 3px 0; color: #f6e58d;">💬 צ'אט החדר</h4>
                <div id="messages"></div>
                <div class="chat-input">
                    <input type="text" id="chat-msg" placeholder="כתוב הודעה...">
                    <button onclick="sendMessage()">שלח</button>
                </div>
            </div>

            <!-- מסך סיום -->
            <div id="end-screen">
                <h1 id="end-title" style="font-size: 35px;"></h1>
                <p id="reward-text" style="color: #2ed573; font-size: 18px; font-weight: bold;"></p>
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

                // אפקט סאונד בדפדפן
                function playSound(type) {
                    try {
                        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                        const osc = audioCtx.createOscillator();
                        const gain = audioCtx.createGain();
                        osc.connect(gain);
                        gain.connect(audioCtx.destination);

                        if (type === 'success') {
                            osc.frequency.setValueAtTime(500, audioCtx.currentTime);
                            osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.15);
                            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
                            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                            osc.start(); osc.stop(audioCtx.currentTime + 0.3);
                        } else if (type === 'error') {
                            osc.frequency.setValueAtTime(180, audioCtx.currentTime);
                            osc.frequency.linearRampToValueAtTime(90, audioCtx.currentTime + 0.2);
                            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
                            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
                            osc.start(); osc.stop(audioCtx.currentTime + 0.25);
                        } else if (type === 'card') {
                            osc.type = 'triangle';
                            osc.frequency.setValueAtTime(700, audioCtx.currentTime);
                            osc.frequency.exponentialRampToValueAtTime(350, audioCtx.currentTime + 0.1);
                            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
                            osc.start(); osc.stop(audioCtx.currentTime + 0.12);
                        }
                    } catch (e) {}
                }

                // יצירת מאגר של מעל 100 שאלות לפירמידה
                const questionBank = [];
                const topics = [
                    { q: "מהו הבירה של", options: ["פריז", "לונדון", "ברלין", "מדריד"], correct: 0 },
                    { q: "כמה צדדים יש ל", options: ["3", "4", "5", "6"], correct: 1 },
                    { q: "תוצאה של התרגיל", options: ["12", "15", "18", "24"], correct: 2 },
                    { q: "איזה בעל חיים הוא", options: ["יונק", "זוחל", "דו-חיים", "עוף"], correct: 0 }
                ];

                // בניית מאגר עשיר של 100+ שאלות דינמיות
                for (let i = 1; i <= 120; i++) {
                    questionBank.push({
                        q: "שאלה מס' " + i + ": כמה זה " + i + " כפול 2 פחות 1?",
                        options: [String(i*2 - 1), String(i*2), String(i*2 + 1), String(i)],
                        correct: 0
                    });
                }
                
                let currentQuestionIndex = 0;

                // מסך טעינה
                let progress = 0;
                const tips = ["טיפ: פירמידת הקלפים בנויה מ-6 קומות (6 עד 1).", "טיפ: השתמש בחנות כדי לקנות זמן או ניסיונות בזמן המשחק!"];
                const loadingInterval = setInterval(() => {
                    progress += 5;
                    document.getElementById('loader').style.width = progress + '%';
                    document.getElementById('loading-percentage').innerText = progress + '%';
                    if (progress % 50 === 0) {
                        document.getElementById('tip-text').innerText = tips[Math.floor(Math.random() * tips.length)];
                    }
                    if (progress >= 100) {
                        clearInterval(loadingInterval);
                        document.getElementById('loading-screen').style.display = 'none';
                    }
                }, 25);

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

                // בניית הפירמידה המדורגת (6, 5, 4, 3, 2, 1)
                function buildPyramid() {
                    const board = document.getElementById('pyramid-board');
                    board.innerHTML = '';
                    const rowsConfig = [6, 5, 4, 3, 2, 1]; // קומות מדורגות מלמטה למעלה

                    rowsConfig.forEach((rowCount, rowIndex) => {
                        const rowDiv = document.createElement('div');
                        rowDiv.className = 'pyramid-row';
                        for (let i = 0; i < rowCount; i++) {
                            const card = document.createElement('div');
                            card.className = 'playing-card hidden';
                            card.innerHTML = '🂠';
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
                    cardElement.innerHTML = 'K♠';
                    
                    coins += 150;
                    updateUI();
                    loadNextQuestion();
                }

                function loadNextQuestion() {
                    if (currentQuestionIndex >= questionBank.length) currentQuestionIndex = 0;
                    const qData = questionBank[currentQuestionIndex++];
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
                        alert('תשובה נכונה! הרווחת 300₪');
                    } else {
                        playSound('error');
                        alert('שגוי! נסה שוב או רכוש תוספת זמן/ניסיון.');
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

                    const earned = isWin ? 1000 : 150;
                    coins += earned;
                    updateUI();

                    const list = currentGameMode === 'ai' ? ['אתה (שחקן)', 'AI_Bot_Master'] : ['אתה (שחקן)', 'Player_Two', 'Player_Three'];
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
                    document.getElementById('end-title').innerText = isWin ? '🏆 ניצחון מדהים בפירמידה!' : '❌ נגמרו הניסיונות!';
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
            <title>משחק הפירמידה - סטייל טלוויזיה</title>
            <style>
                * { box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                body { background: #0b0b1a; color: #ffffff; margin: 0; padding: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; overflow: hidden; }
                
                /* מסך טעינה */
                #loading-screen { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #050510; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 9999; }
                .loader-bar { width: 320px; height: 18px; background: #1a1a3a; border-radius: 10px; overflow: hidden; margin-top: 15px; border: 2px solid #6366f1; }
                .loader-fill { width: 0%; height: 100%; background: linear-gradient(90deg, #8b5cf6, #ec4899); transition: width 0.1s; }

                /* זירת המשחק הראשית (סטייל התמונה) */
                #game-container { position: relative; width: 900px; height: 600px; background: radial-gradient(circle, #241445 0%, #0c071e 100%); border-radius: 20px; box-shadow: 0 0 50px rgba(139, 92, 246, 0.4); display: none; flex-direction: column; align-items: center; border: 3px solid #7c3aed; }
                
                /* כותרת עליונה - פרס */
                .prize-header { margin-top: 15px; background: linear-gradient(135deg, #7c3aed, #db2777); padding: 8px 30px; border-radius: 12px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(219,39,119,0.5); border: 2px solid #f472b6; text-align: center; }

                /* צ'אט צף בצד ימין למעלה */
                .floating-chat { position: absolute; top: 15px; right: 15px; width: 220px; background: rgba(26, 26, 58, 0.9); border: 2px solid #8b5cf6; border-radius: 10px; padding: 8px; display: flex; flex-direction: column; height: 160px; z-index: 10; }
                .chat-messages { flex: 1; overflow-y: auto; font-size: 12px; text-align: right; background: rgba(10, 10, 25, 0.6); padding: 4px; border-radius: 5px; margin-bottom: 5px; }
                .chat-row { display: flex; gap: 4px; }
                .chat-row input { flex: 1; padding: 4px; font-size: 11px; border-radius: 4px; border: none; background: #2a2a4a; color: white; }
                .chat-row button { padding: 4px 8px; font-size: 11px; background: #7c3aed; color: white; border: none; border-radius: 4px; cursor: pointer; }

                /* הפירמידה הגרפית ברקע והשאלה במרכז */
                .pyramid-stage { position: relative; width: 100%; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
                
                /* פירמידת תלת-ממד מזויפת בעזרת עיצוב */
                .pyramid-graphic { width: 500px; height: 180px; background: linear-gradient(180deg, rgba(124, 58, 237, 0.2) 0%, rgba(124, 58, 237, 0.8) 100%); clip-path: polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%); display: flex; flex-direction: column; align-items: center; justify-content: flex-end; padding-bottom: 15px; box-shadow: inset 0 0 20px rgba(255,255,255,0.2); border-bottom: 4px solid #f472b6; }
                
                /* טיימר פירמידה */
                .timer-bar-container { width: 200px; height: 12px; background: #0f172a; border-radius: 6px; overflow: hidden; border: 1px solid #f472b6; margin-bottom: 10px; }
                .timer-bar-fill { width: 100%; height: 100%; background: #22c55e; transition: width 1s linear; }

                /* שאלות ותשובות */
                .question-panel { background: rgba(15, 23, 42, 0.9); padding: 15px; border-radius: 12px; width: 600px; text-align: center; border: 2px solid #8b5cf6; margin-top: -30px; z-index: 5; box-shadow: 0 10px 25px rgba(0,0,0,0.8); }
                .question-title { font-size: 16px; font-weight: bold; margin-bottom: 12px; color: #f3f4f6; }
                .answers-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
                .answer-btn { background: #3b82f6; color: white; border: none; padding: 10px; border-radius: 8px; font-size: 14px; font-weight: bold; cursor: pointer; transition: 0.2s; border: 1px solid #60a5fa; }
                .answer-btn:hover:not(:disabled) { background: #2563eb; transform: scale(1.03); }
                .answer-btn:disabled { background: #4b5563; border-color: #374151; cursor: not-allowed; }
                .answer-btn.correct { background: #22c55e !important; border-color: #4ade80; }
                .answer-btn.wrong { background: #ef4444 !important; border-color: #f87171; }

                /* תחתית - דמות ושחקנים */
                .bottom-stage { width: 100%; height: 80px; background: #070514; display: flex; justify-content: center; align-items: center; gap: 10px; border-top: 2px solid #4c1d95; }
                .player-slot { width: 60px; height: 50px; background: #1e1b4b; border: 2px solid #7c3aed; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; box-shadow: inset 0 0 10px rgba(124,58,237,0.5); }
                .player-slot.active { border-color: #22c55e; background: #064e3b; }

                /* תפריט ראשי */
                #main-menu { background: #1e1b4b; padding: 30px; border-radius: 20px; border: 3px solid #8b5cf6; text-align: center; box-shadow: 0 0 40px rgba(139,92,246,0.5); width: 450px; }
                .main-btn { background: #7c3aed; color: white; border: none; padding: 12px 24px; border-radius: 10px; font-size: 16px; font-weight: bold; cursor: pointer; margin: 8px; width: 100%; transition: 0.2s; }
                .main-btn:hover { background: #6d28d9; transform: translateY(-2px); }

                /* מסך סיום */
                #end-screen { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(5, 5, 15, 0.95); display: none; flex-direction: column; justify-content: center; align-items: center; z-index: 9999; }
            </style>
        </head>
        <body>

            <!-- מסך טעינה -->
            <div id="loading-screen">
                <h2 style="color:#c084fc;">טוען את אולפן הפירמידה...</h2>
                <div class="loader-bar"><div class="loader-fill" id="loader"></div></div>
                <div id="tip-text" style="margin-top: 15px; font-size: 14px; color: #a78bfa;">הכינו את עצמכם לשאלות טריוויה מאתגרות!</div>
            </div>

            <!-- תפריט ראשי -->
            <div id="main-menu">
                <h1 style="color: #f472b6; margin-top: 0;">🔺 משחק הפירמידה</h1>
                <p style="color: #cbd5e1;">💰 כסף התחלתי: <span style="color:#4ade80; font-weight:bold;">0₪</span> | 🎯 ניסיונות: <span style="color:#f87171; font-weight:bold;">1</span>/5</p>
                <button class="main-btn" onclick="startGame('multiplayer')">🎮 שחק נגד שחקנים אמיתיים</button>
                <button class="main-btn" onclick="startGame('ai')">🤖 שחק נגד AI (בוט)</button>
                <div style="margin-top: 15px; background: #0f172a; padding: 12px; border-radius: 10px; border: 1px solid #4c1d95;">
                    <h4 style="margin:0 0 8px 0; color:#facc15;">🛒 חנות ראשית</h4>
                    <button class="main-btn" id="buy-btn" onclick="buyAttempt()" style="margin:0; background: #2563eb;">קנה ניסיון ב-1,000₪</button>
                </div>
            </div>

            <!-- זירת המשחק המרכזית (כמו בתמונה) -->
            <div id="game-container">
                <!-- פרס נוכחי למעלה -->
                <div class="prize-header" id="prize-box">🎁 קומה 1: 2,500 ₪</div>

                <!-- צ'אט צף מימין -->
                <div class="floating-chat">
                    <div style="font-weight:bold; color:#f472b6; font-size:12px; margin-bottom:3px;">💬 צ'אט חדר</div>
                    <div class="chat-messages" id="messages"></div>
                    <div class="chat-row">
                        <input type="text" id="chat-msg" placeholder="הקלד הודעה...">
                        <button onclick="sendMessage()">שלח</button>
                    </div>
                </div>

                <!-- הפירמידה ברקע -->
                <div class="pyramid-stage">
                    <div class="pyramid-graphic">
                        <div class="timer-bar-container">
                            <div class="timer-bar-fill" id="timer-fill"></div>
                        </div>
                    </div>

                    <!-- פאנל השאלות והתשובות שיושב במרכז -->
                    <div class="question-panel">
                        <div class="question-title" id="question-text">טוען שאלה...</div>
                        <div class="answers-grid" id="answers-container"></div>
                    </div>
                </div>

                <!-- תחתית המשחק - דמויות/שחקנים -->
                <div class="bottom-stage">
                    <div class="player-slot">שחקן 6</div>
                    <div class="player-slot">שחקן 5</div>
                    <div class="player-slot">שחקן 4</div>
                    <div class="player-slot">שחקן 3</div>
                    <div class="player-slot">שחקן 2</div>
                    <div class="player-slot active" id="my-slot">אתה (0₪)</div>
                </div>
            </div>

            <!-- מסך סיום משחק -->
            <div id="end-screen">
                <h1 id="end-title" style="font-size: 40px; margin-bottom: 10px;"></h1>
                <p id="end-subtitle" style="font-size: 20px; color: #4ade80; margin-bottom: 20px;"></p>
                <div style="background: #1e1b4b; padding: 20px; border-radius: 12px; border: 2px solid #8b5cf6; min-width: 300px; text-align: center;">
                    <h3 style="margin-top:0; color:#f472b6;">משתתפי הסיבוב:</h3>
                    <ul id="players-end-list" style="list-style: none; padding: 0; color: #e2e8f0;"></ul>
                </div>
                <button class="main-btn" onclick="closeEndScreen()" style="width: auto; margin-top: 20px;">חזור לתפריט הראשי</button>
            </div>

            <script src="/socket.io/socket.io.js"></script>
            <script>
                const socket = io();

                let coins = 0;
                let attempts = 1;
                let maxAttempts = 5;
                let currentFloor = 1; // קומות 1 עד 6
                let timerValue = 15;
                let timerInterval = null;
                let isAnswered = false; // למנוע לחיצות כפולות

                // מאגר שאלות ענק המחולק לקומות
                const questionsByFloor = {
                    1: [
                        { q: "כמה קלפים יש בחפיסת קלפים תקנית?", options: ["48", "52", "54"], correct: 1 },
                        { q: "איזה צבע מקבלים מערבוב אדום וכחול?", options: ["ירוק", "סגול", "כתום"], correct: 1 },
                        { q: "איזה בעל חיים הוא הגדול ביותר בעולם?", options: ["פיל אפריקאי", "לווייתן כחול", "כריש לבן"], correct: 1 }
                    ],
                    2: [
                        { q: "מהי בירת רצועת עזה / ישראל (עיר הבירה הרשמית)?", options: ["תל אביב", "חיפה", "ירושלים"], correct: 2 },
                        { q: "כמה רגליים יש לעכביש?", options: ["6", "8", "10"], correct: 1 },
                        { q: "איזה כוכב לכת קרוב ביותר לשמש?", options: ["נוגה", "מאדים", "חמה (מרקורי)"], correct: 2 }
                    ],
                    3: [
                        { q: "באיזו שנה קמה מדינת ישראל?", options: ["1947", "1948", "1949"], correct: 1 },
                        { q: "מהו היסוד הכימי הנפוץ ביותר ביקום?", options: ["חמצן", "מימן", "פחמן"], correct: 1 },
                        { q: "מי כתב את הספר 'הארי פוטר'?", options: ["ג'יי קיי רולינג", "סטיבן קינג", "טולקין"], correct: 0 }
                    ],
                    4: [
                        { q: "כמה שחקנים יש על המגרש בקבוצת כדורגל אחת?", options: ["10", "11", "12"], correct: 1 },
                        { q: "מהי המהירות של האור בקירוב?", options: ["300,000 קמ/ש", "300,000 קמ/שנייה", "150,000 קמ/ש"], correct: 1 },
                        { q: "איזו יבשת היא הגדולה ביותר בעולם?", options: ["אפריקה", "אמריקה", "אסיה"], correct: 2 }
                    ],
                    5: [
                        { q: "כמה עצמות יש בגוף האדם הבוגר?", options: ["206", "215", "180"], correct: 0 },
                        { q: "מה שמה של הגלקסיה שלנו?", options: ["אנדרומדה", "שביל החלב", "סומבררו"], correct: 1 },
                        { q: "איזה יסוד מסומן באותיות Au בטבלה המחזורית?", options: ["כסף", "זהב", "נחושת"], correct: 1 }
                    ],
                    6: [
                        { q: "מי צייר את המונה ליזה?", options: ["ואן גוך", "לאונרדו דה וינצ'י", "פיקאסו"], correct: 1 },
                        { q: "באיזו מדינה נמצא הר המטרהורן?", options: ["שוויץ", "איטליה", "צרפת"], correct: 0 },
                        { q: "מהו האוקיינוס הגדול ביותר בעולם?", options: ["האוקיינוס האטלנטי", "האוקיינוס השקט", "האוקיינוס ההודי"], correct: 1 }
                    ]
                };

                // אנימציית טעינה
                let progress = 0;
                const loadingInterval = setInterval(() => {
                    progress += 4;
                    document.querySelector('.loader-fill').style.width = progress + '%';
                    if (progress >= 100) {
                        clearInterval(loadingInterval);
                        document.getElementById('loading-screen').style.display = 'none';
                    }
                }, 25);

                function startGame(mode) {
                    document.getElementById('main-menu').style.display = 'none';
                    document.getElementById('game-container').style.display = 'flex';
                    currentFloor = 1;
                    coins = 0;
                    attempts = 1;
                    loadFloorQuestion();
                }

                function loadFloorQuestion() {
                    isAnswered = false;
                    const floorQuestions = questionsByFloor[currentFloor];
                    const randomQ = floorQuestions[Math.floor(Math.random() * floorQuestions.length)];
                    
                    document.getElementById('prize-box').innerText = "🎁 קומה " + currentFloor + " : " + (currentFloor * 2500).toLocaleString() + " ₪";
                    document.getElementById('question-text').innerText = randomQ.q;

                    const ansContainer = document.getElementById('answers-container');
                    ansContainer.innerHTML = '';

                    randomQ.options.forEach((opt, idx) => {
                        const btn = document.createElement('button');
                        btn.className = 'answer-btn';
                        btn.innerText = opt;
                        btn.onclick = () => selectAnswer(idx, randomQ.correct, btn);
                        ansContainer.appendChild(btn);
                    });

                    startTimer();
                }

                function startTimer() {
                    clearInterval(timerInterval);
                    timerValue = 15;
                    const timerFill = document.getElementById('timer-fill');
                    timerFill.style.width = '100%';
                    timerFill.style.background = '#22c55e';

                    timerInterval = setInterval(() => {
                        timerValue--;
                        const pct = (timerValue / 15) * 100;
                        timerFill.style.width = pct + '%';
                        if (timerValue <= 5) timerFill.style.background = '#ef4444';

                        if (timerValue <= 0) {
                            clearInterval(timerInterval);
                            if (!isAnswered) handleWrongAnswer("נגמר הזמן!");
                        }
                    }, 1000);
                }

                // נעילת כפתורים ובדיקת תשובה נכונה/שגויה
                function selectAnswer(selectedIndex, correctIndex, clickedBtn) {
                    if (isAnswered) return; // מונע לחיצות כפולות
                    isAnswered = true;
                    clearInterval(timerInterval);
