const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// רשימת שחקנים (אמיתיים ובוטים)
let players = {};

// הוספת בוטים אוטומטית לשרת
const bots = [
    { id: 'bot_1', name: 'פירמידון (בוט)', score: 0, isBot: true },
    { id: 'bot_2', name: 'קלאופטרה (בוט)', score: 0, isBot: true }
];

bots.forEach(bot => {
    players[bot.id] = bot;
});

io.on('connection', (socket) => {
    console.log('שחקן התחבר:', socket.id);

    // ברירת מחדל לשחקן חדש
    players[socket.id] = {
        id: socket.id,
        name: 'שחקן אנושי',
        score: 0,
        isBot: false
    };

    // שליחת רשימת השחקנים המעודכנת לכולם
    io.emit('updatePlayers', Object.values(players));

    // האזנה לשינוי שם השחקן
    socket.on('setName', (name) => {
        if (players[socket.id]) {
            players[socket.id].name = name;
            io.emit('updatePlayers', Object.values(players));
        }
    });

    socket.on('disconnect', () => {
        console.log('שחקן התנתק:', socket.id);
        delete players[socket.id];
        io.emit('updatePlayers', Object.values(players));
    });
});

// הדמיית פעילות של הבוטים (עונים אקראית מדי פעם)
setInterval(() => {
    bots.forEach(bot => {
        // סיכוי של 30% שהבוט יצבור נקודה כל כמה שניות לדוגמה
        if (Math.random() < 0.3) {
            bot.score += 10;
            io.emit('updatePlayers', Object.values(players));
        }
    });
}, 5000);

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`השרת רץ עם תמיכה בבוטים בכתובת: http://localhost:${PORT}`);
});