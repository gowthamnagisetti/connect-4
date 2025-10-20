const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const matchmaker = require('./matchmaker');
const gameManager = require('./gameManager');
const url = require('url');

function createWebsocketServer(httpServer) {
    const wss = new WebSocket.Server({ server: httpServer });

    wss.on('connection', (ws, req) => {
        ws._id = uuidv4();
        ws._username = null;
        ws._reconnectToken = null;

        const parsed = url.parse(req.url, true);
        if (parsed.query && parsed.query.username) {
            ws._username = parsed.query.username;
        }

        ws.on('message', (raw) => {
            let msg;
            try { msg = JSON.parse(raw); } catch (e) { return; }

            switch (msg.type) {
                case 'auth': {
                    const username = (msg.username || '').trim();
                    if (!username) {
                        ws.send(JSON.stringify({ type: 'error', message: 'username required' }));
                        return;
                    }
                    ws._username = username;
                    ws.send(JSON.stringify({ type: 'auth_ok', username }));
                    break;
                }

                case 'create_bot': {
                    // require that user sent auth before
                    if (!ws._username) {
                        ws.send(JSON.stringify({ type: 'error', message: 'Authenticate first' }));
                        break;
                    }
                    // create a player object and request immediate bot game
                    try {
                        const player = { username: ws._username, socket: ws, id: ws._id, isBot: false };
                        gameManager.createGameWithBot(player);
                        ws.send(JSON.stringify({ type: 'create_bot_ack' }));
                    } catch (e) {
                        ws.send(JSON.stringify({ type: 'error', message: 'create_bot_failed' }));
                    }
                    break;
                }

                case 'join_queue': {
                    if (!ws._username) {
                        ws.send(JSON.stringify({ type: 'error', message: 'Authenticate first (send {type: \"auth\", username})' }));
                        return;
                    }
                    const player = { username: ws._username, socket: ws, id: ws._id };
                    matchmaker.joinQueue(player);
                    ws.send(JSON.stringify({ type: 'queued' }));
                    break;
                }

                case 'leave_queue': {
                    if (!ws._username) { ws.send(JSON.stringify({ type: 'error', message: 'auth first' })); break; }
                    matchmaker.leaveQueue({ username: ws._username });
                    ws.send(JSON.stringify({ type: 'left_queue' }));
                    break;
                }

                case 'play_move': {
                    const { gameId, col, reconnectToken } = msg;
                    // Prefer reconnectToken, else try mapping by socket (not ideal but fallback)
                    const token = reconnectToken || msg.playerToken || null;
                    let tokenToSend = token;
                    if (!tokenToSend) {
                        // attempt to find token by scanning active games for this socket
                        // find game's player index by socket
                        tokenToSend = ws;
                    }
                    const res = gameManager.applyMove(gameId, tokenToSend, col);
                    if (!res.success) {
                        ws.send(JSON.stringify({ type: 'invalid_move', message: res.message }));
                    }
                    break;
                }

                case 'rejoin': {
                    const { reconnectToken } = msg;
                    if (!reconnectToken) {
                        ws.send(JSON.stringify({ type: 'error', message: 'reconnectToken required' }));
                        return;
                    }
                    const rec = gameManager.handleReconnect(reconnectToken, ws);
                    if (!rec) ws.send(JSON.stringify({ type: 'error', message: 'reconnect failed' }));
                    else ws.send(JSON.stringify({ type: 'rejoin_ok', gameId: rec.gameId }));
                    break;
                }

                case 'rematch_offer': {
                    const { gameId, reconnectToken } = msg;
                    const tokenOrSocket = reconnectToken || ws;
                    const out = gameManager.rematchOffer(gameId, tokenOrSocket);
                    if (!out.success) {
                        ws.send(JSON.stringify({ type: 'error', message: out.message || 'rematch failed' }));
                    } else {
                        ws.send(JSON.stringify({ type: 'rematch_offer_sent', gameId }));
                    }
                    break;
                }

                case 'rematch_response': {
                    const { gameId, reconnectToken } = msg;
                    // accept may be sent as `accept` or `accepted` by different clients
                    const acceptedFlag = ('accept' in msg) ? msg.accept : ('accepted' in msg ? msg.accepted : false);
                    const tokenOrSocket = reconnectToken || ws;
                    const out = gameManager.rematchResponse(gameId, tokenOrSocket, !!acceptedFlag);
                    if (!out.success) {
                        ws.send(JSON.stringify({ type: 'error', message: out.message || 'rematch response failed' }));
                    } else {
                        ws.send(JSON.stringify({ type: 'rematch_response_received', gameId }));
                    }
                    break;
                }

                default:
                    ws.send(JSON.stringify({ type: 'error', message: 'unknown message type' }));
            }
        });

        ws.on('close', () => {
            // handle disconnect and remove from queue
            gameManager.handleDisconnect(ws);
            if (ws._username) matchmaker.leaveQueue({ username: ws._username });
        });

        ws.send(JSON.stringify({ type: 'hello', message: 'Welcome to Connect4 WS. Send {type:\"auth\", username: \"yourname\"} then {type:\"join_queue\"}.' }));
    });

    console.log('WebSocket server created');
    return wss;
}

module.exports = { createWebsocketServer };