import React from 'react';

export default function Lobby({ status, onJoin, onLeave, onPlayBot }) {
  return (
    <div className="p-4 rounded bg-slate-800/40 mb-4">
      <div className="flex gap-2 items-center">
        <div className="flex-1">
          <div className="text-sm text-slate-200">Matchmaking</div>
          <div className="text-xs text-slate-400">Join queue to find an opponent. If none join in 10s, a bot will play.</div>
        </div>
        <div>
          {status === 'waiting' ? (
            <button onClick={onLeave} className="px-4 py-2 rounded bg-yellow-500 text-black font-semibold">Leave</button>
          ) : (
            <>
              <button onClick={onJoin} className="px-4 py-2 rounded bg-green-500 mr-2 text-black font-semibold">Play Online</button>
              <button onClick={onPlayBot} className="px-4 py-2 rounded bg-blue-500 text-white">Play Bot</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}