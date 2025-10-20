import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { initMatchBanner } from './utils/matchBanner';

createRoot(document.getElementById('root')).render(<App />);

// start match banner listener
initMatchBanner();
