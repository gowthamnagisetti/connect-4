import React from 'react';

export default function Header({ username, onLogout }) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-3 sm:gap-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[var(--accent-1)] to-[var(--accent-2)] flex items-center justify-center font-bold text-[var(--bg-2)]">CF</div>
        <div className="text-center sm:text-left">
          <div className="text-base sm:text-lg font-semibold">Connect4 Arena</div>
          <div className="text-xs text-[var(--muted)] hidden sm:block">Quick matches • Smooth animations</div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {username ? <div className="text-xs sm:text-sm opacity-80">Signed in as <b className="truncate max-w-[100px] inline-block align-bottom">{username}</b></div> : null}
        {username && <button onClick={onLogout} className="px-2 sm:px-3 py-1 rounded bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-xs sm:text-sm">Logout</button>}
      </div>
    </div>
  );
}