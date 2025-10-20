// src/components/Board.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ROWS = 6;
const COLS = 7;

function isWinningCell(winningCells = [], c, r) {
  if (!Array.isArray(winningCells)) return false;
  return winningCells.some(w => w.c === c && w.r === r);
}

export default function Board({
  board = Array.from({ length: 7 }, () => []),
  onPlay,
  currentPlayer = 1,
  lastMove = null,
  winningCells = [] // expected: [{c: 2, r: 1}, ...]
}) {
  const [hoverCol, setHoverCol] = useState(null);
  const [animKey, setAnimKey] = useState(0);
  const [burstCells, setBurstCells] = useState([]); // array of {c,r}
  const touchRef = React.useRef({ startX: 0, startY: 0, startTime: 0, moved: false, col: null });

  useEffect(() => setAnimKey(k => k + 1), [board, lastMove, winningCells]);

  // listen for external winner event to trigger burst/crackers
  useEffect(() => {
    function onWinner(e) {
      // use winningCells prop to compute burst targets
      if (!Array.isArray(winningCells) || winningCells.length === 0) return;
      setBurstCells(winningCells.map(w => ({ c: w.c, r: w.r })));
      // remove after animation
      setTimeout(() => setBurstCells([]), 1400);
    }
    window.addEventListener('connect4:winner', onWinner);
    return () => window.removeEventListener('connect4:winner', onWinner);
  }, [winningCells]);

  const rows = useMemo(() => {
    const out = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        const colArr = board[c] || [];
        const val = colArr.length > r ? colArr[r] : 0;
        row.push({ c, r, val });
      }
      out.push(row);
    }
    return out;
  }, [board]);

  function previewRow(c) {
    const col = board[c] || [];
    return col.length;
  }

  function handleClickCol(c) {
    if (!onPlay) return;
    onPlay(c);
  }

  function handleTouchStart(e, c) {
    const t = e.touches && e.touches[0];
    touchRef.current.startX = t ? t.clientX : 0;
    touchRef.current.startY = t ? t.clientY : 0;
    touchRef.current.startTime = Date.now();
    touchRef.current.moved = false;
    touchRef.current.col = c;
    setHoverCol(c);
  }

  function handleTouchMove(e) {
    const t = e.touches && e.touches[0];
    if (!t) return;
    const dx = Math.abs(t.clientX - touchRef.current.startX);
    const dy = Math.abs(t.clientY - touchRef.current.startY);
    if (dx > 12 || dy > 12) touchRef.current.moved = true;
  }

  function handleTouchEnd(e, c) {
    const dt = Date.now() - touchRef.current.startTime;
    const moved = touchRef.current.moved;
    // if it was a short tap and not moved -> treat as click
    if (!moved && dt < 500 && touchRef.current.col === c) {
      handleClickCol(c);
    }
    // clear hover after tiny delay so UI shows feedback
    setTimeout(() => setHoverCol(null), 120);
    touchRef.current.col = null;
  }

  function isLastMove(c, r) {
    return lastMove && lastMove.col === c && lastMove.row === r;
  }

  return (
    <div className="board-wrapper" role="application" aria-label="Connect 4 board">
      <div className="board-grid" role="grid">
        {rows.map((row, ridx) => (
          <div className="board-row" role="row" key={ridx}>
            {row.map(cell => {
              const { c, r, val } = cell;
              const isPreview = hoverCol === c && previewRow(c) === r && (board[c].length < ROWS) && val === 0;
              const diskPlayer = val || (isPreview ? currentPlayer : 0);
              const winning = isWinningCell(winningCells, c, r);
              const last = isLastMove(c, r);
              const key = `${c}-${r}-${diskPlayer}-${animKey}`;

              return (
                <div
                  key={key}
                  className="cell"
                  onMouseEnter={() => setHoverCol(c)}
                  onMouseLeave={() => setHoverCol(null)}
                  onClick={() => handleClickCol(c)}
                  onTouchStart={(ev) => handleTouchStart(ev, c)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={(ev) => handleTouchEnd(ev, c)}
                  role="button"
                  aria-label={`col ${c} row ${r}`}
                >
                  <div className="cell-hole">
                    <AnimatePresence>
                      {diskPlayer !== 0 && (() => {
                        // choose a smaller drop distance on narrow screens so animation looks right on mobile
                        const isSmall = typeof window !== 'undefined' && window.innerWidth <= 760;
                        const dropY = isSmall ? -160 : -260;
                        return (
                          <motion.div
                            key={`disk-${key}`}
                            initial={{ y: dropY, scale: isPreview ? 0.96 : 0.98, opacity: isPreview ? 0.45 : 1 }}
                            animate={{ y: 0, scale: isPreview ? 0.98 : 1, opacity: isPreview ? 0.45 : 1, transition: { type: 'spring', stiffness: 360, damping: 28 } }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            className={
                              `disk ${diskPlayer === 1 ? 'disk-primary' : 'disk-secondary'} ` +
                              `${isPreview ? 'disk-preview' : ''} ` +
                              `${winning ? 'disk-connected' : ''} ` +
                              `${winning && diskPlayer ? 'disk-win' : ''} ` +
                              `${burstCells.some(b => b.c === c && b.r === r) ? 'burst' : ''}`
                            }
                          />
                        );
                      })()}
                    </AnimatePresence>

                    {last && <div className="last-ring" />}
                    {/* render cracker sparks when bursting */}
                    {burstCells.some(b => b.c === c && b.r === r) && (
                      <div className="cracker-spark" aria-hidden>
                        {Array.from({ length: 6 }).map((_, i) => {
                          const elStyle = { ['--dx']: `${(Math.random() - 0.5) * 140}px`, ['--dy']: `${-40 - Math.random() * 120}px` };
                          return <div key={i} className={`spark s${i % 4 + 1}`} style={elStyle} />;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="cols-row" aria-hidden>
        {Array.from({ length: COLS }).map((_, c) => (
          <div
            key={`col-${c}`}
            className="col-hit"
            onMouseEnter={() => setHoverCol(c)}
            onMouseLeave={() => setHoverCol(null)}
            onClick={() => handleClickCol(c)}
          >
            <div className="col-arrow">▼</div>
          </div>
        ))}
      </div>
    </div>
  );
}