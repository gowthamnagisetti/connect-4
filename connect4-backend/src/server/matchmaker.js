// src/server/matchmaker.js
const gameManager = require('./gameManager');

const WAIT_SECONDS = 30; // <<--- changed to 30 seconds (user request)
const waiting = new Map();

function joinQueue(player) {
    const now = Date.now();
    const existing = waiting.get(player.username);
    if (existing) return;
    const entry = { player, joinedAt: now };
    waiting.set(player.username, entry);

    const timerId = setTimeout(() => {
        const cur = waiting.get(player.username);
        if (cur) {
            waiting.delete(player.username);
            gameManager.createGameWithBot(cur.player);
        }
    }, WAIT_SECONDS * 1000);

    entry.timerId = timerId;

    for (const [otherName, otherEntry] of waiting.entries()) {
        if (otherName === player.username) continue;
        clearTimeout(entry.timerId);
        clearTimeout(otherEntry.timerId);
        waiting.delete(player.username);
        waiting.delete(otherName);
        gameManager.createGameBetweenPlayers(player, otherEntry.player);
        return;
    }
}

function leaveQueue(player) {
    const existing = waiting.get(player.username);
    if (existing) {
        clearTimeout(existing.timerId);
        waiting.delete(player.username);
    }
}

module.exports = { joinQueue, leaveQueue };