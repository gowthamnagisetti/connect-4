// src/server/gameManager.js
const { v4: uuidv4 } = require('uuid');
const Connect4 = require('../game/connect4');
const { chooseMove } = require('../game/bot');
const analytics = require('./analytics');
const { toPublicGameState } = require('../utils/serialize');

const activeGames = new Map();
// pendingRematches: gameId -> { responses: Map(username -> boolean|null), timerId }
const pendingRematches = new Map();

function broadcastToPlayers(gameRecord, payload) {
    for (const idx of [1, 2]) {
        const p = gameRecord.players[idx];
        if (p && p.socket && p.socket.readyState === p.socket.OPEN) {
            try { p.socket.send(JSON.stringify(payload)); } catch { }
        }
    }
}

function createGameBetweenPlayers(playerA, playerB) {
    const gameId = uuidv4();
    const game = new Connect4();
    const recTokens = {
        [playerA.username]: uuidv4(),
        [playerB.username]: uuidv4()
    };
    const gameRecord = {
        gameId,
        game,
        players: {
            1: { username: playerA.username, socket: playerA.socket, isBot: !!playerA.isBot, reconnectToken: recTokens[playerA.username] },
            2: { username: playerB.username, socket: playerB.socket, isBot: !!playerB.isBot, reconnectToken: recTokens[playerB.username] }
        },
        createdAt: Date.now(),
        reconnectTimers: {}
    };
    activeGames.set(gameId, gameRecord);

    // send matched to each (include startedAt and game_state)
    try {
        const payload1 = {
            type: 'matched',
            gameId,
            youAre: 1,
            opponent: { username: playerB.username, isBot: !!playerB.isBot },
            reconnectToken: gameRecord.players[1].reconnectToken,
            startedAt: Date.now(),
            game_state: toPublicGameState(gameRecord)
        };
        const payload2 = {
            type: 'matched',
            gameId,
            youAre: 2,
            opponent: { username: playerA.username, isBot: !!playerA.isBot },
            reconnectToken: gameRecord.players[2].reconnectToken,
            startedAt: Date.now(),
            game_state: toPublicGameState(gameRecord)
        };
        if (gameRecord.players[1].socket && gameRecord.players[1].socket.readyState === gameRecord.players[1].socket.OPEN) {
            gameRecord.players[1].socket.send(JSON.stringify(payload1));
        }
        if (gameRecord.players[2].socket && gameRecord.players[2].socket.readyState === gameRecord.players[2].socket.OPEN) {
            gameRecord.players[2].socket.send(JSON.stringify(payload2));
        }
    } catch (e) {
        // ignore send errors
    }

    analytics.emitEvent({
        type: 'GameStarted',
        gameId,
        players: [playerA.username, playerB.username],
        isBotGame: !!(playerA.isBot || playerB.isBot),
        startedAt: Date.now()
    });

    return gameRecord;
}

function createGameWithBot(playerObj) {
    return createGameBetweenPlayers(playerObj, { username: 'BOT', socket: null, isBot: true });
}

function findGameByPlayerSocket(socket) {
    for (const rec of activeGames.values()) {
        for (const idx of [1, 2]) {
            if (rec.players[idx] && rec.players[idx].socket === socket) return rec;
        }
    }
    return null;
}

function findGameByReconnectToken(token) {
    for (const rec of activeGames.values()) {
        for (const idx of [1, 2]) {
            const p = rec.players[idx];
            if (p && p.reconnectToken === token) return { rec, idx };
        }
    }
    return null;
}

function applyMove(gameId, playerToken, col) {
    const rec = activeGames.get(gameId);
    if (!rec) return { success: false, message: 'Game not found' };

    // resolve player index
    let playerIndex = null;
    if (typeof playerToken === 'number') playerIndex = playerToken;
    else if (typeof playerToken === 'string') {
        const found = findGameByReconnectToken(playerToken);
        if (found && found.rec.gameId === gameId) playerIndex = found.idx;
    }

    // fallback: if playerToken omitted, try matching by socket (not provided here)
    if (!playerIndex) return { success: false, message: 'Invalid player token' };
    if (rec.game.currentPlayer !== playerIndex) return { success: false, message: 'Not your turn' };

    const result = rec.game.playMove(col, playerIndex);
    if (!result.success) return result;

    // broadcast move and full state
    broadcastToPlayers(rec, {
        type: 'move_made',
        gameId: rec.gameId,
        player: playerIndex,
        col: result.col,
        row: result.row,
        nextPlayer: rec.game.currentPlayer
    });

    broadcastToPlayers(rec, {
        type: 'game_state',
        ...toPublicGameState(rec)
    });

    analytics.emitEvent({
        type: 'MoveMade',
        gameId: rec.gameId,
        player: playerIndex,
        col: result.col,
        row: result.row,
        moveIndex: rec.game.moveCount
    });

    if (rec.game.status === 'finished') {
        finalizeGame(rec.gameId, 'normal');
        return result;
    }

    // if next is bot, make bot move
    const nextIdx = rec.game.currentPlayer;
    const nextPlayer = rec.players[nextIdx];
    if (nextPlayer && nextPlayer.isBot) {
        const botCol = chooseMove(rec.game.board, nextIdx);
        const botRes = rec.game.playMove(botCol, nextIdx);

        broadcastToPlayers(rec, {
            type: 'move_made',
            gameId: rec.gameId,
            player: nextIdx,
            col: botRes.col,
            row: botRes.row,
            nextPlayer: rec.game.currentPlayer
        });

        broadcastToPlayers(rec, {
            type: 'game_state',
            ...toPublicGameState(rec)
        });

        analytics.emitEvent({
            type: 'MoveMade',
            gameId: rec.gameId,
            player: nextIdx,
            col: botRes.col,
            row: botRes.row,
            moveIndex: rec.game.moveCount
        });

        if (rec.game.status === 'finished') finalizeGame(rec.gameId, 'normal');
    }

    return result;
}

function finalizeGame(gameId, reason = 'normal') {
    const rec = activeGames.get(gameId);
    if (!rec) return;

    analytics.emitEvent({
        type: 'GameEnded',
        gameId: rec.gameId,
        players: [rec.players[1]?.username, rec.players[2]?.username],
        winner: rec.game.winner,
        winnerName: rec.game.winner === 1 || rec.game.winner === 2 ? rec.players[rec.game.winner]?.username : null,
        result: rec.game.winner === 'draw' ? 'draw' : 'win',
        moves: rec.game.moves,
        winningCells: rec.game.lastWinningCells || [],
        startedAt: rec.game.startedAt,
        endedAt: rec.game.endedAt,
        reason
    });

    broadcastToPlayers(rec, {
        type: 'game_over',
        gameId: rec.gameId,
        result: rec.game.winner === 'draw' ? 'draw' : 'win',
        winner: rec.game.winner,
        winnerName: rec.game.winner === 1 || rec.game.winner === 2 ? rec.players[rec.game.winner]?.username : null,
        finalBoard: rec.game.serialize().board,
        moves: rec.game.moves,
        winningCells: rec.game.lastWinningCells || []
    });

    for (const t of Object.values(rec.reconnectTimers || {})) {
        if (t) clearTimeout(t);
    }
    activeGames.delete(gameId);

    // cancel any pending rematch for this game
    const pr = pendingRematches.get(gameId);
    if (pr && pr.timerId) clearTimeout(pr.timerId);
    pendingRematches.delete(gameId);
}

/* ----------------- REMATCH LOGIC ----------------- */

/**
 * Offer rematch: forward offer to opponent and start a 10s window to collect responses.
 * fromToken can be reconnectToken string or null. We support socket-based identification separately.
 */
function rematchOffer(gameId, fromTokenOrSocket) {
    const rec = activeGames.get(gameId);
    if (!rec) return { success: false, message: 'Game not found' };

    // identify sender username/index
    let fromIdx = null;
    if (typeof fromTokenOrSocket === 'string') {
        const f = findGameByReconnectToken(fromTokenOrSocket);
        if (f && f.rec.gameId === gameId) fromIdx = f.idx;
    } else if (fromTokenOrSocket && typeof fromTokenOrSocket === 'object') {
        // socket passed
        for (const idx of [1, 2]) if (rec.players[idx] && rec.players[idx].socket === fromTokenOrSocket) fromIdx = idx;
    }
    if (!fromIdx) return { success: false, message: 'Unknown requester' };

    const otherIdx = fromIdx === 1 ? 2 : 1;
    const fromName = rec.players[fromIdx].username;
    const other = rec.players[otherIdx];

    // If opponent disconnected, cannot rematch
    if (!other || !other.socket || other.socket.readyState !== other.socket.OPEN) {
        return { success: false, message: 'Opponent not connected' };
    }

    // Initialize pendingRematch entry if missing
    let pr = pendingRematches.get(gameId);
    if (!pr) {
        pr = { responses: new Map(), timerId: null };
        // set initial responses: null = not responded yet
        pr.responses.set(rec.players[1].username, null);
        pr.responses.set(rec.players[2].username, null);
        pendingRematches.set(gameId, pr);
    }

    // mark that this player offered (we could treat offer same as accept or just notify opponent)
    pr.responses.set(fromName, true); // owner offering -> considered accept for them

    // forward rematch_offer to opponent
    try {
        other.socket.send(JSON.stringify({ type: 'rematch_offer', from: fromName, gameId }));
    } catch { }

    // start or refresh 10s timer
    if (pr.timerId) clearTimeout(pr.timerId);
    pr.timerId = setTimeout(() => {
        // time expired: if both accepted -> create rematch; else notify timeout/decline
        finalizeRematchWindow(gameId);
    }, 10000);

    return { success: true };
}

/**
 * Record rematch response from a player (accept = true/false).
 */
function rematchResponse(gameId, fromTokenOrSocket, accept) {
    const rec = activeGames.get(gameId);
    if (!rec) return { success: false, message: 'Game not found' };

    let fromIdx = null;
    if (typeof fromTokenOrSocket === 'string') {
        const f = findGameByReconnectToken(fromTokenOrSocket);
        if (f && f.rec.gameId === gameId) fromIdx = f.idx;
    } else if (fromTokenOrSocket && typeof fromTokenOrSocket === 'object') {
        for (const idx of [1, 2]) if (rec.players[idx] && rec.players[idx].socket === fromTokenOrSocket) fromIdx = idx;
    }
    if (!fromIdx) return { success: false, message: 'Unknown responder' };

    let pr = pendingRematches.get(gameId);
    if (!pr) {
        // no pending rematch window — create one but short-circuit: set both responses? We'll create a window and start timer.
        pr = { responses: new Map(), timerId: null };
        pr.responses.set(rec.players[1].username, null);
        pr.responses.set(rec.players[2].username, null);
        pendingRematches.set(gameId, pr);
        pr.timerId = setTimeout(() => finalizeRematchWindow(gameId), 10000);
    }

    const name = rec.players[fromIdx].username;
    pr.responses.set(name, !!accept);

    // notify opponent of this player's response
    const otherIdx = fromIdx === 1 ? 2 : 1;
    const other = rec.players[otherIdx];
    if (other && other.socket && other.socket.readyState === other.socket.OPEN) {
        try {
            other.socket.send(JSON.stringify({ type: 'rematch_status', from: name, accepted: !!accept }));
        } catch { }
    }

    // If both have responded and both accepted -> finalize early
    const values = Array.from(pr.responses.values());
    if (values.every(v => v !== null)) {
        finalizeRematchWindow(gameId);
    }

    return { success: true };
}

/**
 * Helper: finalize rematch window — create new game if both accepted, otherwise notify decline.
 */
function finalizeRematchWindow(gameId) {
    const pr = pendingRematches.get(gameId);
    const rec = activeGames.get(gameId);
    if (!pr || !rec) {
        if (pr && pr.timerId) clearTimeout(pr.timerId);
        pendingRematches.delete(gameId);
        return;
    }

    if (pr.timerId) { clearTimeout(pr.timerId); pr.timerId = null; }

    const responses = pr.responses; // Map username -> true/false/null
    const names = Array.from(responses.keys());
    const resVals = names.map(n => responses.get(n));
    const bothAccepted = resVals.every(v => v === true);

    // notify both players about final rematch decision
    const payload = { type: 'rematch_result', gameId, accepted: bothAccepted };
    broadcastToPlayers(rec, payload);

    if (bothAccepted) {
        // create a fresh game between the two players (reuse sockets)
        const pA = rec.players[1];
        const pB = rec.players[2];
        // small delay to let clients transition UI
        setTimeout(() => {
            createGameBetweenPlayers(
                { username: pA.username, socket: pA.socket, isBot: !!pA.isBot },
                { username: pB.username, socket: pB.socket, isBot: !!pB.isBot }
            );
        }, 400);
    } else {
        // nothing more; clients will return to lobby
    }

    pendingRematches.delete(gameId);
}

/* ----------------- DISCONNECT / RECONNECT ----------------- */

function handleDisconnect(socket) {
    const rec = findGameByPlayerSocket(socket);
    if (!rec) return;
    let idx = null;
    for (const i of [1, 2]) {
        if (rec.players[i] && rec.players[i].socket === socket) idx = i;
    }
    if (!idx) return;
    rec.players[idx].socket = null;
    const otherIdx = idx === 1 ? 2 : 1;
    const other = rec.players[otherIdx];

    if (other && other.socket && other.socket.readyState === other.socket.OPEN) {
        other.socket.send(JSON.stringify({ type: 'opponent_disconnected', username: rec.players[idx].username, reconnectBy: Date.now() + 30000 }));
    }

    rec.reconnectTimers[idx] = setTimeout(() => {
        rec.game.status = 'finished';
        rec.game.winner = otherIdx;
        finalizeGame(rec.gameId, 'forfeit');
    }, 30000);
}

function handleReconnect(reconnectToken, newSocket) {
    for (const rec of activeGames.values()) {
        for (const idx of [1, 2]) {
            const p = rec.players[idx];
            if (!p) continue;
            if (p.reconnectToken && p.reconnectToken === reconnectToken) {
                if (rec.reconnectTimers[idx]) {
                    clearTimeout(rec.reconnectTimers[idx]);
                    rec.reconnectTimers[idx] = null;
                }
                p.socket = newSocket;
                try {
                    p.socket.send(JSON.stringify({ type: 'rejoined', gameId: rec.gameId }));
                    p.socket.send(JSON.stringify({ type: 'game_state', ...toPublicGameState(rec) }));
                } catch { }
                const otherIdx = idx === 1 ? 2 : 1;
                const other = rec.players[otherIdx];
                if (other && other.socket && other.socket.readyState === other.socket.OPEN) {
                    other.socket.send(JSON.stringify({ type: 'opponent_rejoined', username: p.username }));
                }
                return rec;
            }
        }
    }
    return null;
}

module.exports = {
    createGameBetweenPlayers,
    createGameWithBot,
    activeGames,
    applyMove,
    handleDisconnect,
    handleReconnect,
    rematchOffer,
    rematchResponse
};