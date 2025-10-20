// src/server/analytics.js
const fs = require('fs');
const path = require('path');
const storage = require('./storage');

const EVENTS_LOG = path.join(__dirname, '..', '..', 'data', 'events.log');

function emitEvent(event) {
    try {
        const line = JSON.stringify({ ...event, ts: Date.now() });
        fs.appendFileSync(EVENTS_LOG, line + '\n', 'utf8');
    } catch (e) {
        console.error('Failed to write analytics event:', e);
    }

    if (event.type === 'GameEnded') {
        const record = {
            gameId: event.gameId,
            players: event.players,
            winner: event.winner,
            winnerName: event.winnerName || null,
            result: event.result,
            moves: event.moves,
            startedAt: event.startedAt,
            endedAt: event.endedAt,
            durationSeconds: event.durationSeconds || null,
            reason: event.reason || null
        };
        storage.addCompletedGame(record);
    }
}

module.exports = { emitEvent };
