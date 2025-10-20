// test/bot.test.js
const Connect4 = require('../src/game/connect4');
const { chooseMove } = require('../src/game/bot');

describe('Bot behavior', () => {
    test('Bot takes immediate winning move', () => {
        // Build a board where bot (player 2) has three in a row and can win with column 3
        const g = new Connect4();
        // Let player 1 make dummy moves
        g.playMove(0); // p1
        g.playMove(1); // p2
        g.playMove(0); // p1
        g.playMove(1); // p2
        g.playMove(2); // p1
        // Now setup bot (p2) having three in a row on bottom at columns 1,2,3? Let's craft clearer:
        // We'll manually craft board for deterministic scenario:
        g.reset();
        // Place bot discs at columns 0,1,2 at row 0 (bottom)
        g.board[0].push(2);
        g.board[1].push(2);
        g.board[2].push(2);
        // Set current player to bot
        g.currentPlayer = 2;

        const move = chooseMove(g.board, 2);
        expect(move).toBe(3);
    });

    test('Bot blocks opponent immediate win', () => {
        const g = new Connect4();
        // Opponent (player 1) has three in a row at columns 0,1,2 -> bot must play 3 to block
        g.reset();
        g.board[0].push(1);
        g.board[1].push(1);
        g.board[2].push(1);
        g.currentPlayer = 2;

        const move = chooseMove(g.board, 2);
        expect(move).toBe(3);
    });

    test('Bot prefers center when no immediate threats', () => {
        const g = new Connect4();
        g.reset();
        // empty board, bot should pick center 3
        const move = chooseMove(g.board, 2);
        expect(move).toBe(3);
    });
});
