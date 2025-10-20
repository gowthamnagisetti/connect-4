// src/components/LoadingModal.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function LoadingModal({ open = false, title = 'Waiting', message = 'Please wait...', countdown = null, onCancel = null }) {
  const [count, setCount] = useState(countdown);

  useEffect(() => {
    if (countdown == null) return;
    setCount(countdown);
    const t = setInterval(() => {
      setCount(c => {
        if (c == null) return c;
        if (c <= 1) {
          clearInterval(t);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [countdown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" />
      <motion.div initial={{ scale: .98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10 card w-[420px]">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <div className="flex items-center gap-4">
          <div className="search-spinner-outer">
            <div className="search-spinner" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-slate-200">{message}</div>
            {count != null && <div className="text-xs text-slate-400 mt-2">Auto cancel in <b className="font-mono">{count}s</b></div>}
          </div>
        </div>

        <div className="flex justify-end mt-4 gap-2">
          {onCancel && <button onClick={onCancel} className="btn-bubble-outline">Cancel</button>}
        </div>
      </motion.div>
    </div>
  );
}
