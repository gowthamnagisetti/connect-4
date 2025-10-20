// src/server/storage.js
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const COMPLETED_FILE = path.join(DATA_DIR, 'completed_games.json');

function loadCompletedGames() {
    if (!fs.existsSync(COMPLETED_FILE)) {
        fs.writeFileSync(COMPLETED_FILE, JSON.stringify([]), 'utf8');
        return [];
    }
    try {
        const raw = fs.readFileSync(COMPLETED_FILE, 'utf8');
        return JSON.parse(raw || '[]');
    } catch (e) {
        console.error('Failed to read completed games file:', e);
        return [];
    }
}

function saveCompletedGames(arr) {
    fs.writeFileSync(COMPLETED_FILE, JSON.stringify(arr, null, 2), 'utf8');
}

function addCompletedGame(record) {
    const arr = loadCompletedGames();
    arr.push(record);
    saveCompletedGames(arr);
}

function getAllCompletedGames() {
    return loadCompletedGames();
}

function getLeaderboard(topN = 50) {
    const games = loadCompletedGames();
    const counts = {};
    for (const g of games) {
        if (!g.winner || g.winner === 'draw') continue;
        const winner = g.winnerName || g.winner;
        if (!counts[winner]) counts[winner] = 0;
        counts[winner]++;
    }
    const arr = Object.keys(counts).map(name => ({ username: name, wins: counts[name] }));
    arr.sort((a, b) => b.wins - a.wins);
    return arr.slice(0, topN);
}

module.exports = {
    addCompletedGame,
    getAllCompletedGames,
    getLeaderboard
};
