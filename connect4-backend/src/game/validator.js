module.exports = {
    isValidColumn(col, cols) {
        return Number.isInteger(col) && col >= 0 && col < cols;
    },

    isColumnFull(board, col, rows) {
        if (!Number.isInteger(col) || col < 0 || col >= board.length) return true;
        return board[col].length >= rows;
    },

    isBoardFull(board, rows) {
        return board.every(col => col.length === rows);
    }
};
