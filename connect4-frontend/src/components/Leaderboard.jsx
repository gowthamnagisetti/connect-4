// src/components/Leaderboard.jsx
import React, { useEffect, useState } from 'react';

export default function Leaderboard({ list = null }) {
  const [players, setPlayers] = useState(list || []);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (list && list.length) setPlayers(list);
    else {
      fetch('/leaderboard').then(r => r.json()).then(data => setPlayers(data || [])).catch(() => {});
    }
  }, [list]);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Leaderboard</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => fetch('/leaderboard').then(r => r.json()).then(setPlayers)} className="px-3 py-1 rounded bg-blue-500 text-sm">Refresh</button>
          <button onClick={() => setVisible(v => !v)} className="px-3 py-1 rounded bg-transparent text-sm" aria-pressed={!visible}>{visible ? 'Hide' : 'Show'}</button>
        </div>
      </div>

      {visible && (
        <div className="space-y-3">
          {players.length === 0 && <div className="text-sm text-[var(--muted)]">No results yet — play some games!</div>}
          {players.slice(0, 10).map((p, idx) => (
            <div key={p.username} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-yellow-400 text-black' : idx === 1 ? 'bg-slate-400 text-black' : 'bg-slate-700 text-white'}`}>
                  {idx + 1}
                </div>
                <div className="text-sm">{p.username}</div>
              </div>
              <div className="text-sm font-semibold">{p.wins}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
