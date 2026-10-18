const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// קוד ה-HTML של המשחק מובנה ישירות כאן כדי שלא יהיו תקלות בתיקיות
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="he" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>משחק פירמידה</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; background: #2c3e50; color: white; margin-top: 50px; }
                h1 { color: #f1c40f; }
                #game-board { margin-top: 20px; font-size: 20px; }
            </style>
        </head>
        <body>
            <h1>משחק פירמידה מרובה משתתפים</h1>
            <div id="game-board">מתחבר לשרת...</div>
            <script src="/socket.io/socket.io.js"></script>
            <script>
                const socket = io();
                socket.on('updatePlayers', (players) => {
                    document.getElementById('game-board').innerHTML = 
                        'שחקנים מחוברים כרגע: ' + players.length;
                });
            </script>
        </body>
        </html>
    `);
});

let players = [];

io.on('connection', (socket) => {
    console.log('שחקן חדש התחבר:', socket.id);
    players.push({ id: socket.id });
    io.emit('updatePlayers', players);

    socket.on('disconnect', () => {
        players = players.filter(p => p.id !== socket.id);
        io.emit('updatePlayers', players);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
