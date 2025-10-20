import React from 'react';
import { motion } from 'framer-motion';

export default function Disk({ player, dropFrom, y, size = 68, highlight }) {
  const color = player === 1 ? 'bg-redDisc' : player === 2 ? 'bg-yellowDisc' : 'bg-transparent';
  const style = {
    width: size,
    height: size,
    borderRadius: '999px'
  };

  // drop animation uses y translate
  return (
    <motion.div
      className={`flex items-center justify-center ${player ? '' : 'opacity-0'}`}
      initial={{ y: dropFrom || -200, scale: 1 }}
      animate={{ y: y || 0, transition: { type: 'spring', stiffness: 700, damping: 30 } }}
      style={style}
    >
      <div className={`${color} w-full h-full rounded-full shadow-lg ${highlight ? 'ring-4 ring-white/40' : ''}`} />
    </motion.div>
  );
}