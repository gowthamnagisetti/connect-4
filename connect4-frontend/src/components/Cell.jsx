import React from 'react';

export default function Cell({ children, onClick, disabled, onMouseEnter, className }) {
  return (
    <div
      onClick={disabled ? null : onClick}
      onMouseEnter={onMouseEnter}
      className={`cell cursor-pointer select-none ${disabled ? 'opacity-60' : 'hover:scale-105'} ${className || ''}`}
    >
      {children}
    </div>
  );
}