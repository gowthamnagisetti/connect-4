// index.js
const http = require('http');
const express = require('express');
const path = require('path');
const { createWebsocketServer } = require('./src/server/wsServer');
const storage = require('./src/server/storage');

const app = express();
app.use(express.json());

// REST endpoints
app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/leaderboard', (req, res) => {
    const leaderboard = storage.getLeaderboard();
    res.json(leaderboard);
});

app.get('/games', (req, res) => {
    const games = storage.getAllCompletedGames();
    res.json(games);
});

// Serve built frontend if exists (optional)
const frontendDist = path.join(__dirname, '..', 'connect4-frontend', 'dist');
if (require('fs').existsSync(frontendDist)) {
    app.use('/', express.static(frontendDist));
    app.get('*', (req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
}

const server = http.createServer(app);

// WebSocket server
createWebsocketServer(server);

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`HTTP + WS server listening on port ${PORT}`);
});
