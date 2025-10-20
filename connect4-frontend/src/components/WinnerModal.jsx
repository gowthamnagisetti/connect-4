// src/components/WinnerModal.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function WinnerModal({
  open = false,
  winnerName = '',
  opponentIsBot = false,
  result = 'win',
  onRematch = () => {},
  onNewMatch = () => {},
  onClose = () => {}
}) {
  const [count, setCount] = useState(10);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!open) { setShowConfetti(false); return; }
    setCount(10);
    if (result === 'win') {
      setShowConfetti(true);
      playPopSequence();
      // dispatch a DOM event so board can highlight connected discs and show crackers
      try {
        const ev = new CustomEvent('connect4:winner', { detail: { winnerName, result, timestamp: Date.now() } });
        window.dispatchEvent(ev);
      } catch (e) {}
    } else {
      setShowConfetti(false);
    }
    const t = setInterval(() => {
      setCount(c => {
        if (c <= 1) {
          clearInterval(t);
          onClose();
          setShowConfetti(false);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [open]);

  // short pop sound sequence using WebAudio (no external files)
  function playPopOnce(timeOffset = 0) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime + timeOffset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.3, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
      // release the context after a short delay to conserve resources
      setTimeout(() => { try { ctx.close(); } catch { } }, 600);
    } catch (e) {
      // audio might be blocked by the browser until user gesture — ignore silently
    }
  }

  function playPopSequence() {
    // multiple quick pops with small offsets
    for (let i = 0; i < 6; i++) {
      playPopOnce(i * 0.08);
    }
    // one bigger pop slightly later
    setTimeout(() => playPopOnce(0), 450);
  }

  if (!open) return null;

  // make a lot of confetti pieces
  const confettiCount = 80;
  const balloonsCount = 8;

  return (
    <>
      {showConfetti && (
        <div className="celebration-overlay" aria-hidden>
          <div className="paper-layer">
            {Array.from({ length: 40 }).map((_, i) => {
              const left = Math.round(Math.random() * 100);
              const delay = (Math.random() * 0.9).toFixed(2);
              const dur = (1.8 + Math.random() * 1.6).toFixed(2);
              const style = { left: `${left}%`, animationDelay: `${delay}s`, animationDuration: `${dur}s` };
              return <div key={i} className="paper" style={style} aria-hidden />;
            })}
          </div>

          <div className="winner-banner">
            <div className="winner-text">{winnerName ? `${winnerName} Wins!` : 'Winner!'}</div>
          </div>
        </div>
      )}

      <div className="modal-backdrop" role="dialog" aria-modal="true">
        <div className="modal-card">
          <motion.div initial={{ scale: .98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-inner">
            <h2 className="modal-title">{result === 'draw' ? "It's a draw!" : `Winner: ${winnerName || '—'}`}</h2>
            <p className="modal-sub">{result === 'draw' ? 'No winners this time.' : `${winnerName} took the win!`}</p>
            <div className="modal-count">Auto return in <b className="mono">{count}s</b></div>

            <div className="modal-actions">
              <button className="btn-action" onClick={() => onRematch()}>{opponentIsBot ? 'Play Bot Again' : 'Rematch'}</button>
              <button className="btn-action-outline" onClick={() => { onNewMatch(true); }}>New Match</button>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}