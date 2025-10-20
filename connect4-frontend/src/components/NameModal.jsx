// src/components/NameModal.jsx
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 Props:
  - visible (bool)
  - initialName (string)
  - onCancel()                    // cancel/close modal
  - onStartSearching(name, opts)  // called when user presses Play or Start with Bot
                                  // opts: { immediateBot: boolean, fromTimeout: boolean }
  - onMatched(payload)            // optional: parent can call when matched
*/
export default function NameModal({
  visible = true,
  initialName = '',
  onCancel,
  onStartSearching,
  onMatched
}) {
  const [name, setName] = useState(initialName || '');
  const [phase, setPhase] = useState('input'); // 'input' | 'searching' | 'matched'
  const [countdown, setCountdown] = useState(30);
  const counterRef = useRef(null);

  useEffect(() => {
    setName(initialName || '');
  }, [initialName]);

  useEffect(() => {
    if (!visible) {
      clearCounter();
      setPhase('input');
    }
    // cleanup on unmount
    return () => clearCounter();
  }, [visible]);

  function clearCounter() {
    if (counterRef.current) {
      clearInterval(counterRef.current);
      counterRef.current = null;
    }
  }

  function startClientCountdown(nameArg, opts = {}) {
    // start UI countdown; parent is responsible for sending join_queue or create_bot
    setPhase('searching');
    setCountdown(30);

    // start tick
    if (counterRef.current) clearInterval(counterRef.current);
    counterRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearCounter();
          // This triggers the bot fallback if parent wants it.
          onStartSearching && onStartSearching(nameArg, { immediateBot: true, fromTimeout: true });
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  function handlePlay() {
    if (!name || !name.trim()) return alert('Please enter your name.');
    // notify parent to auth + join queue
    onStartSearching && onStartSearching(name, { immediateBot: false });
    // start the client-side countdown and spinner
    startClientCountdown(name, { immediateBot: false });
  }

  function handleStartWithBot() {
    if (!name || !name.trim()) return alert('Please enter your name.');
    // immediate bot request
    onStartSearching && onStartSearching(name, { immediateBot: true });
    startClientCountdown(name, { immediateBot: true }); // still show countdown UI briefly (but server will match immediately)
  }

  function handleCancel() {
    clearCounter();
    setPhase('input');
    setCountdown(30);
    onCancel && onCancel();
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/65" onClick={() => { if (phase === 'input') handleCancel(); }} />
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.16 }}
        className="relative z-10 card p-6 w-[440px]"
      >
        {phase === 'input' && (
          <>
            <h3 className="text-2xl font-semibold mb-2">Enter display name</h3>
            <div className="text-sm text-slate-300 mb-3">Local time: <b>{new Date().toLocaleTimeString()}</b> — {Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
            <input
              className="w-full p-3 rounded-full mb-3 text-black"
              placeholder="e.g. Alice"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button onClick={handleCancel} className="btn-bubble-outline">Cancel</button>
              <button onClick={handlePlay} className="btn-bubble">Play</button>
            </div>
          </>
        )}

        {phase === 'searching' && (
          <>
            <h3 className="text-xl font-semibold mb-2">Searching for opponent</h3>

            <div className="flex items-center gap-4 mb-3">
              <div className="search-spinner-outer">
                <div className="search-spinner" />
              </div>
              <div>
                <div className="text-sm text-slate-200">Finding a match...</div>
                <div className="text-xs text-slate-400 mt-1">Auto fallback to bot in <b className="font-mono">{countdown}s</b></div>
              </div>
            </div>

            <div className="w-full bg-white/10 rounded overflow-hidden mb-3" style={{ height: 10 }}>
              <div className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-full" style={{ width: `${((30 - countdown) / 30) * 100}%`, transition: 'width 0.25s linear' }} />
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-slate-200">Status: <b>Searching</b></div>
              <div className="flex gap-2">
                <button onClick={handleStartWithBot} className="btn-bubble">Start with Bot</button>
                <button onClick={handleCancel} className="btn-bubble-outline">Cancel</button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}