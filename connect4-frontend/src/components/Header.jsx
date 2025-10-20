import React from 'react';

export default function Header({ username, onLogout }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--accent-1)] to-[var(--accent-2)] flex items-center justify-center font-bold text-[var(--bg-2)]">CF</div>
        <div>
          <div className="text-lg font-semibold">Connect4 Arena</div>
          <div className="text-xs text-[var(--muted)]">Quick matches • Smooth animations</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {username ? <div className="text-sm opacity-80">Signed in as <b>{username}</b></div> : null}
        {username && <button onClick={onLogout} className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-sm">Logout</button>}
      </div>
    </div>
  );
}