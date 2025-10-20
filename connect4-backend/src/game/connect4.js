// src/game/connect4.js
class Connect4 {
    constructor() {
        this.rows = 6;
        this.cols = 7;
        this.reset();
    }

    reset() {
        this.board = Array.from({ length: this.cols }, () => []);
        this.currentPlayer = 1;
        this.moves = [];
        this.status = 'ongoing';
        this.winner = null;
        this.moveCount = 0;
        this.createdAt = Date.now();
        this.startedAt = null;
        this.endedAt = null;
        this.lastWinningCells = []; // store winning coordinates when win detected
        this.winningCells = []; // Current winning cells
    }

    // safe accessor
    getCell(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return null;
        return this.board[col].length > row ? this.board[col][row] : null;
    }

    inBounds(col, row) {
        return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
    }

    isColumnFull(col) {
        if (col < 0 || col >= this.cols) return true;
        return this.board[col].length >= this.rows;
    }

    isBoardFull() {
        return this.board.every(col => col.length === this.rows);
    }

    switchPlayer() {
        this.currentPlayer = 3 - this.currentPlayer;
    }

    playMove(col, playerId = null) {
        if (this.status !== 'ongoing') {
            return { success: false, message: 'Game already finished.' };
        }
        if (!Number.isInteger(col) || col < 0 || col >= this.cols) {
            return { success: false, message: 'Invalid column.' };
        }
        if (this.isColumnFull(col)) {
            return { success: false, message: 'Column is full.' };
        }
        if (playerId && playerId !== this.currentPlayer) {
            return { success: false, message: `Not player ${playerId}'s turn.` };
        }

        if (!this.startedAt) this.startedAt = Date.now();

        const row = this.board[col].length;
        const player = this.currentPlayer;

        this.board[col].push(player);
        this.moveCount += 1;
        this.moves.push({
            player,
            col,
            row,
            moveIndex: this.moveCount,
            ts: Date.now()
        });

        // reset lastWinningCells
        this.lastWinningCells = [];

        if (this.checkWin(col, row, player)) {
            this.status = 'finished';
            this.winner = player;
            this.endedAt = Date.now();
            // gather winning cells
            this.lastWinningCells = this.getWinningCells(col, row, player);
            return { success: true, winner: player, col, row, winningCells: this.lastWinningCells };
        }

        if (this.isBoardFull()) {
            this.status = 'finished';
            this.winner = 'draw';
            this.endedAt = Date.now();
            return { success: true, winner: 'draw', col, row };
        }

        this.switchPlayer();
        return { success: true, col, row, nextPlayer: this.currentPlayer };
    }

    countDirection(col, row, dc, dr, player) {
        let count = 0;
        let c = col + dc;
        let r = row + dr;
        while (this.inBounds(c, r) && this.getCell(c, r) === player) {
            count++;
            c += dc;
            r += dr;
        }
        return count;
    }

    checkWin(col, row, player) {
        const directions = [
            [1, 0],
            [0, 1],
            [1, 1],
            [1, -1]
        ];
        for (const [dc, dr] of directions) {
            let total = 1;
            total += this.countDirection(col, row, dc, dr, player);
            total += this.countDirection(col, row, -dc, -dr, player);
            if (total >= 4) {
                // When win is detected, store winning cells
                this.winningCells = this.getWinningCells(col, row, player);
                console.log('Win detected! Winning cells:', this.winningCells); // Debug log
                return true;
            }
        }
        return false;
    }

    // return array of {c,r} for the winning 4 cells including the last move
    getWinningCells(col, row, player) {
        const directions = [
            [1, 0],
            [0, 1],
            [1, 1],
            [1, -1]
        ];
        for (const [dc, dr] of directions) {
            const cells = [{ c: col, r: row }];
            // forward
            let c = col + dc, r = row + dr;
            while (this.inBounds(c, r) && this.getCell(c, r) === player) {
                cells.push({ c, r });
                c += dc; r += dr;
            }
            // backward
            c = col - dc; r = row - dr;
            while (this.inBounds(c, r) && this.getCell(c, r) === player) {
                cells.push({ c, r });
                c -= dc; r -= dr;
            }
            if (cells.length >= 4) {
                // if more than 4, pick any contiguous 4 that include (col,row)
                // sort by (c then r) — but better: find contiguous segment
                // Build a set of occupied positions along the line in order
                // We'll reconstruct ordered list along the line from min to max
                const ordered = [];
                // find min distance backward from last move
                // step back until cell not player's
                let startC = col, startR = row;
                while (this.inBounds(startC - dc, startR - dr) && this.getCell(startC - dc, startR - dr) === player) {
                    startC -= dc; startR -= dr;
                }
                // now go forward and collect in-order
                let cc = startC, rr = startR;
                while (this.inBounds(cc, rr) && this.getCell(cc, rr) === player) {
                    ordered.push({ c: cc, r: rr });
                    cc += dc; rr += dr;
                }
                // find the slice of length 4 that contains (col,row)
                for (let i = 0; i + 4 <= ordered.length; i++) {
                    const slice = ordered.slice(i, i + 4);
                    if (slice.some(s => s.c === col && s.r === row)) return slice;
                }
                // fallback
                return ordered.slice(0, 4);
            }
        }
        return [];
    }

    serialize() {
        return {
            rows: this.rows,
            cols: this.cols,
            board: this.board,
            currentPlayer: this.currentPlayer,
            moves: this.moves,
            status: this.status,
            winner: this.winner,
            moveCount: this.moveCount,
            createdAt: this.createdAt,
            startedAt: this.startedAt,
            endedAt: this.endedAt,
            lastWinningCells: this.lastWinningCells
        };
    }
}

module.exports = Connect4;