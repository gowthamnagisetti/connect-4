// src/ws/client.js
export function connectWebSocket(url, onMessage, onOpen, onClose) {
    const ws = new WebSocket(url);

    ws.addEventListener('open', () => {
        if (onOpen) onOpen(ws);
    });

    ws.addEventListener('message', (ev) => {
        let msg;
        try { msg = JSON.parse(ev.data); } catch (e) { console.warn('Invalid JSON from server', e); return; }
        if (onMessage) onMessage(msg, ws);
    });

    ws.addEventListener('close', () => {
        if (onClose) onClose();
    });

    ws.addEventListener('error', (e) => {
        console.error('WebSocket error', e);
    });

    return ws;
}

export function sendJSON(ws, obj) {
    if (!ws) return;
    try {
        ws.send(JSON.stringify(obj));
    } catch (e) {
        console.error('sendJSON failed', e);
    }
}