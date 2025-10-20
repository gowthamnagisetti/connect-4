// src/utils/serialize.js
function toPublicGameState(gameRecord) {
    const game = gameRecord.game;
    return {
        gameId: gameRecord.gameId,
        board: game.serialize().board,
        currentPlayer: game.currentPlayer,
        moves: game.moves,
        status: game.status,
        winner: game.winner,
        players: {
            1: { username: gameRecord.players[1]?.username || null, isBot: !!gameRecord.players[1]?.isBot },
            2: { username: gameRecord.players[2]?.username || null, isBot: !!gameRecord.players[2]?.isBot }
        }
    };
}

module.exports = { toPublicGameState };
