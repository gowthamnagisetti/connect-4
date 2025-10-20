// src/components/Landing.jsx
import React from 'react';
import { motion } from 'framer-motion';

export default function Landing({ onStart }) {
  return (
    <div className="landing-wrap">
      <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.36 }} className="landing-card-2">
        <div className="landing-top">
          <div className="landing-title">
            <div className="logo">●●</div>
            <div>
              <div className="hero-title">Connect 4 — Arena</div>
              <div className="hero-sub">Classic strategy, modern polish. Play quick matches vs human or AI.</div>
            </div>
          </div>

          <div className="player-panel">
            <div className="player-preview">
              <div className="disk disk-primary" />
              <div className="player-name">You</div>
            </div>

            <div className="vs">VS</div>

            <div className="player-preview">
              <div className="disk disk-secondary" />
              <div className="player-name">Opponent</div>
            </div>
          </div>
        </div>

        <div className="landing-cta-wrap">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 360 }} className="hero-cta" onClick={onStart}>
            Play Now
          </motion.button>
        </div>

        <div className="info-cards">
          <div className="info-card">
            <h4>Simple Controls</h4>
            <p>Click a column to drop a disc. Keyboard shortcuts coming soon.</p>
          </div>

          <div className="info-card">
            <h4>Real Gameplay</h4>
            <p>Animated discs, last-move highlights, and subtle haptics make the game feel tactile.</p>
          </div>

          <div className="info-card">
            <h4>Quick Matches</h4>
            <p>Join a queue, play a bot, rematch instantly — designed for repeated play sessions.</p>
          </div>
        </div>

        <div className="landing-foot-2">
          <small>Responsive for desktop & phone • Smooth animations • Lightweight</small>
        </div>
      </motion.div>
    </div>
  );
}