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
            <title>משחק הפירמידה - אולפן טלוויזיה</title>
            <style>
                * { box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                body { background: #0b0b1a; color: #ffffff; margin: 0; padding: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; overflow: hidden; }
                
                /* מסך טעינה */
                #loading-screen { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #050510; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 9999; }
                .loader-bar { width: 320px; height: 18px; background: #1a1a3a; border-radius: 10px; overflow: hidden; margin-top: 15px; border: 2px solid #6366f1; }
                .loader-fill { width: 0%; height: 100%; background: linear-gradient(90deg, #8b5cf6, #ec4899); transition: width 0.1s; }

                /* זירת המשחק הראשית */
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
                .player-slot { width: 65px; height: 50px; background: #1e1b4b; border: 2px solid #7c3aed; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; box-shadow: inset 0 0 10px rgba(124,58,237,0.5); text-align: center; }
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

            <!-- זירת המשחק המרכזית -->
            <div id="game-container">
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

                    <!-- פאנל השאלות והתשובות -->
                    <div class="question-panel">
                        <div class="question-title" id="question-text">טוען שאלה...</div>
                        <div class="answers-grid" id="answers-container"></div>
                    </div>
                </div>

                <!-- תחתית המשחק - שחקנים -->
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
                let currentFloor = 1;
                let timerValue = 15;
                let timerInterval = null;
                let isAnswered = false;

                // יצירת מאגר ענק של שאלות (100+ שאלות) מפורט לפי קומות
                const questionsByFloor = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

                // מחולל שאלות אוטומטי ומגוון לכל 6 הקומות
                for (let floor = 1; floor <= 6; floor++) {
                    for (let i = 1; i <= 20; i++) {
                        let numA = floor * 5 + i;
                        let numB = i + 2;
                        questionsByFloor[floor].push({
                            q: "שאלה " + i + " (קומה " + floor + "): כמה זה " + numA + " ועוד " + numB + "?",
                            options: [String(numA + numB - 1), String(numA + numB), String(numA + numB + 2)],
                            correct: 1
                        });
                    }
                }

                // הוספת שאלות טריוויה קבועות לכל קומה
                questionsByFloor[1].push(
                    { q: "כמה קלפים יש בחפיסת קלפים תקנית?", options: ["48", "52", "54"], correct: 1 },
                    { q: "איזה צבע מקבלים מערבוב אדום וכחול?", options: ["ירוק", "סגול", "כתום"], correct: 1 }
                );
                questionsByFloor[2].push(
                    { q: "מהי עיר הבירה הרשמית של ישראל?", options: ["תל אביב", "חיפה", "ירושלים"], correct: 2 },
                    { q: "כמה רגליים יש לעכביש?", options: ["6", "8", "10"], correct: 1 }
                );
                questionsByFloor[3].push(
                    { q: "באיזו שנה קמה מדינת ישראל?", options: ["1947", "1948", "1949"], correct: 1 },
                    { q: "מהו היסוד הכימי הנפוץ ביותר ביקום?", options: ["חמצן", "מימן", "פחמן"], correct: 1 }
                );
                questionsByFloor[4].push(
                    { q: "כמה שחקנים יש על המגרש בקבוצת כדורגל אחת?", options: ["10", "11", "12"], correct: 1 },
                    { q: "איזו יבשת היא הגדולה ביותר בעולם?", options: ["אפריקה", "אמריקה", "אסיה"], correct: 2 }
                );
                questionsByFloor[5].push(
                    { q: "כמה עצמות יש בגוף האדם הבוגר?", options: ["206", "215", "180"], correct: 0 },
                    { q: "מה שמה של הגלקסיה שלנו?", options: ["אנדרומדה", "שביל החלב", "סומבררו"], correct: 1 }
                );
                questionsByFloor[6].push(
                    { q: "מי צייר את המונה ליזה?", options: ["ואן גוך", "לאונרדו דה וינצ'י", "פיקאסו"], correct: 1 },
                    { q: "מהו האוקיינוס הגדול ביותר בעולם?", options: ["האוקיינוס האטלנטי", "האוקיינוס השקט", "האוקיינוס ההודי"], correct: 1 }
                );

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

                function selectAnswer(selectedIndex, correctIndex, clickedBtn) {
                    if (isAnswered) return;
                    isAnswered = true;
                    clearInterval(timerInterval);

                    const allBtns = document.querySelectorAll('.answer-btn');
                    allBtns.forEach(b => b.disabled = true);

                    if (selectedIndex === correctIndex) {
                        clickedBtn.classList.add('correct');
                        coins += currentFloor * 1000;
                        
                        setTimeout(() => {
                            if (currentFloor < 6) {
                                currentFloor++;
                                loadFloorQuestion();
                            } else {
                                showEndScreen(true, "כל הכבוד! עלית את כל הפירמידה!");
                            }
                        }, 1200);
                    } else {
                        clickedBtn.classList.add('wrong');
                        allBtns[correctIndex].classList.add('correct');
                        
                        setTimeout(() => {
                            handleWrongAnswer("תשובה שגויה!");
                        }, 1500);
                    }
                }

                function handleWrongAnswer(reason) {
                    attempts--;
                    if (attempts > 0) {
                        alert(reason + " נותר לך עוד ניסיון אחד בסיבוב.");
                        loadFloorQuestion();
                    } else {
                        showEndScreen(false, reason + " נגמרו הניסיונות!");
                    }
                }

                function buyAttempt() {
                    if (coins >= 1000 && attempts < maxAttempts) {
                        coins -= 1000;
                        attempts++;
                        alert('רכשת ניסיון נוסף בהצלחה!');
                    } else {
                        alert('אין מספיק כסף או שהגעת למקסימום ניסיונות!');
                    }
                }

                function showEndScreen(isWin, message) {
                    document.getElementById('game-container').style.display = 'none';
                    const screen = document.getElementById('end-screen');
                    const title = document.getElementById('end-title');
                    const subtitle = document.getElementById('end-subtitle');

                    title.innerText = isWin ? "🏆 ניצחון מזהיר בפירמידה!" : "❌ הפסדת במשחק!";
                    title.style.color = isWin ? "#4ade80" : "#f87171";
                    subtitle.innerText = message + " | סך הכל הרווחת: " + coins.toLocaleString() + " ₪";

                    const list = document.getElementById('players-end-list');
                    list.innerHTML = "<li>👤 אתה (שחקן ראשי) - " + coins.toLocaleString() + " ₪</li><li>🤖 AI_Bot_Expert - הודח בקומה 4</li><li>👤 שחקן_נוסף - הודח בקומה 2</li>";

                    screen.style.display = 'flex';
                }

                function closeEndScreen() {
                    document.getElementById('end-screen').style.display = 'none';
                    document.getElementById('main-menu').style.display = 'block';
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
