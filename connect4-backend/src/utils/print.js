function printBoard(columnMajorBoard, rows = 6, cols = 7) {
    for (let r = rows - 1; r >= 0; r--) {
        let line = '';
        for (let c = 0; c < cols; c++) {
            const cell = columnMajorBoard[c].length > r ? columnMajorBoard[c][r] : 0;
            if (cell === 1) line += '🔴 ';
            else if (cell === 2) line += '🟡 ';
            else line += '⚪ ';
        }
        console.log(line);
    }
    let idxLine = '';
    for (let c = 0; c < cols; c++) idxLine += `${c} `;
    console.log(idxLine + '\n');
}
module.exports = { printBoard };