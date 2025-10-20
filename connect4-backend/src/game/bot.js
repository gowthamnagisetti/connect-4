// src/game/bot.js
const Connect4 = require('./connect4');

function deepCopyBoard(board) {
    return board.map(col => col.slice());
}

function availableColumns(board, rows) {
    const cols = board.length;
    const arr = [];
    for (let c = 0; c < cols; c++) {
        if (board[c].length < rows) arr.push(c);
    }
    return arr;
}

function simulate(board, rows, cols, colIndex, player) {
    const inst = new Connect4();
    inst.rows = rows;
    inst.cols = cols;
    inst.board = deepCopyBoard(board);
    inst.currentPlayer = player;
    if (inst.board[colIndex].length >= inst.rows) return null;
    const row = inst.board[colIndex].length;
    inst.board[colIndex].push(player);
    inst.moveCount = (inst.moveCount || 0) + 1;
    return { row, col: colIndex, inst };
}

function heuristicOrder() {
    return [3, 2, 4, 1, 5, 0, 6];
}

function chooseMove(board, player) {
    const rows = 6;
    const cols = 7;
    const opponent = 3 - player;

    const avail = availableColumns(board, rows);

    // 1) Immediate win
    for (const c of avail) {
        const sim = simulate(board, rows, cols, c, player);
        if (!sim) continue;
        if (sim.inst.checkWin(c, sim.row, player)) return c;
    }

    // 2) Immediate block
    for (const c of avail) {
        const simOpp = simulate(board, rows, cols, c, opponent);
        if (!simOpp) continue;
        if (simOpp.inst.checkWin(c, simOpp.row, opponent)) return c;
    }

    // 3) Threat creation
    let bestCol = null;
    let bestThreats = -1;
    for (const c of avail) {
        const sim = simulate(board, rows, cols, c, player);
        if (!sim) continue;
        const nextAvail = availableColumns(sim.inst.board, rows);
        let threats = 0;
        for (const c2 of nextAvail) {
            const sim2 = simulate(sim.inst.board, rows, cols, c2, player);
            if (!sim2) continue;
            if (sim2.inst.checkWin(c2, sim2.row, player)) threats++;
        }
        if (threats > bestThreats) {
            bestThreats = threats;
            bestCol = c;
        }
    }
    if (bestThreats > 0 && bestCol !== null) return bestCol;

    // 4) Heuristic fallback
    for (const c of heuristicOrder()) {
        if (board[c].length < rows) return c;
    }

    return avail.length ? avail[0] : null;
}

module.exports = { chooseMove };