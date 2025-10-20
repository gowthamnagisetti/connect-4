// src/App.jsx
import React, { useEffect, useRef, useState } from 'react';
import { connectWebSocket, sendJSON } from './ws/client';
import Landing from './components/Landing';
import NameModal from './components/NameModal';
import Board from './components/Board';
import WinnerModal from './components/WinnerModal';
import LoadingModal from './components/LoadingModal';
import Leaderboard from './components/Leaderboard';
import useToast from './hooks/useToast';

const WS_URL = (import.meta.env.VITE_WS_URL || 'ws://localhost:8080');

export default function App() {
  const wsRef = useRef(null);
  const toasts = useToast();

  // UI state
  const [showLanding, setShowLanding] = useState(true);
  const [showNameModal, setShowNameModal] = useState(false);
  const [loadingModalOpen, setLoadingModalOpen] = useState(false);
  const [loadingModalProps, setLoadingModalProps] = useState({});

  // Game state
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [status, setStatus] = useState('idle'); // idle | searching | in_game
  const [gameState, setGameState] = useState(null);
  const [playerIndex, setPlayerIndex] = useState(null);
  const [reconnectToken, setReconnectToken] = useState(localStorage.getItem('reconnectToken') || null);

  // Winner
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState({ name: '', isBot: false, result: 'win' });
  const [rematchOffer, setRematchOffer] = useState(null); // { from, gameId }

  // ensure websocket
  function ensureConnected() {
    if (wsRef.current && wsRef.current.readyState === 1) return wsRef.current;
    const ws = connectWebSocket(WS_URL, handleMessage, handleOpen, handleClose);
    wsRef.current = ws;
    return ws;
  }

  function handleOpen() {
    toasts.push('Connected to server');
  }

  function handleClose() {
    toasts.push('Disconnected from server');
    setStatus('idle');
  }

  function handleMessage(msg) {
    if (!msg || !msg.type) return;
    // console.debug('WS ->', msg);
    if (msg.type === 'auth_ok') {
      toasts.push(`Authenticated as ${msg.username}`);
    } else if (msg.type === 'queued') {
      setStatus('searching');
    } else if (msg.type === 'matched') {
      if (msg.youAre) setPlayerIndex(msg.youAre);
      if (msg.reconnectToken) {
        setReconnectToken(msg.reconnectToken);
        localStorage.setItem('reconnectToken', msg.reconnectToken);
      }
      if (msg.game_state) setGameState(msg.game_state);
      setStatus('in_game');
      setShowNameModal(false);
      setShowLanding(false);
      setLoadingModalOpen(false);
      toasts.push(`Matched vs ${msg.opponent?.username || 'BOT'}`);
    } else if (msg.type === 'game_state') {
      setGameState(msg);
      if (msg.status === 'finished') {
        setWinnerInfo({
          name: msg.winnerName || (msg.winner === 'draw' ? 'Draw' : `Player ${msg.winner}`),
          isBot: !!(msg.players && (msg.players[1] === 'BOT' || msg.players[2] === 'BOT') || msg.opponentIsBot),
          result: msg.winner === 'draw' ? 'draw' : 'win'
        });
        setWinnerModalOpen(true);
        setStatus('idle');
      }
    } else if (msg.type === 'rematch_result') {
      setLoadingModalOpen(false);
      if (msg.accepted) {
        toasts.push('Rematch accepted — starting new game');
        // server will send matched
      } else {
        toasts.push('Rematch declined or timed out');
      }
    } else if (msg.type === 'rematch_offer') {
      // incoming offer from opponent
      setRematchOffer({ from: msg.from || 'Opponent', gameId: msg.gameId });
    } else if (msg.type === 'error') {
      toasts.push(`Server error: ${msg.message}`);
    }
  }

  // Start button -> open name modal
  function onStart() {
    setShowLanding(false);
    setShowNameModal(true);
  }

  // Name modal callback
  function onStartSearching(name, opts = {}) {
    setUsername(name);
    localStorage.setItem('username', name);
    const ws = ensureConnected();
    sendJSON(ws, { type: 'auth', username: name });

    if (opts && opts.immediateBot) {
      setLoadingModalProps({ title: 'Starting vs Bot', message: 'Creating bot match...' });
      setLoadingModalOpen(true);
      sendJSON(ws, { type: 'create_bot' });
      setStatus('searching');
    } else {
      sendJSON(ws, { type: 'join_queue' });
      setStatus('searching');
    }
    setShowNameModal(true);
  }

  function onCancelSearching() {
    if (wsRef.current && wsRef.current.readyState === 1) sendJSON(wsRef.current, { type: 'leave_queue' });
    setShowNameModal(false);
    setShowLanding(true);
    setStatus('idle');
  }

  function handleDrop(col) {
    if (!gameState || !wsRef.current) return;
    if (!playerIndex || gameState.currentPlayer !== playerIndex) {
      toasts.push('Not your turn');
      return;
    }
    sendJSON(wsRef.current, { type: 'play_move', gameId: gameState.gameId, col, reconnectToken });
  }

  // Rematch button from WinnerModal
  function handleRematch() {
    // if opponent is bot -> start bot match immediately
    if (winnerInfo.isBot) {
      setLoadingModalProps({ title: 'Starting vs Bot', message: 'Creating bot match...' });
      setLoadingModalOpen(true);
      if (wsRef.current && wsRef.current.readyState === 1) sendJSON(wsRef.current, { type: 'create_bot' });
      setWinnerModalOpen(false);
      return;
    }

    // else human opponent -> offer rematch and show loading
    if (!gameState || !wsRef.current) return;
    setLoadingModalProps({ title: 'Rematch', message: 'Waiting for opponent to accept...', countdown: 10 });
    setLoadingModalOpen(true);
    sendJSON(wsRef.current, { type: 'rematch_offer', gameId: gameState.gameId, reconnectToken });
    setWinnerModalOpen(false);
  }

  function respondRematch(accepted) {
    if (!wsRef.current || wsRef.current.readyState !== 1 || !rematchOffer) return;
    sendJSON(wsRef.current, { type: 'rematch_response', gameId: rematchOffer.gameId, accepted, reconnectToken });
    setRematchOffer(null);
    if (!accepted) {
      // redirect home
      setShowLanding(true);
      setGameState(null);
      setStatus('idle');
    } else {
      setLoadingModalOpen(true);
      setLoadingModalProps({ title: 'Rematch', message: 'Starting rematch...' });
    }
  }

  // New match: open name modal so player can change name and start new match
  function handleNewMatch(openNameModal = true) {
    // close winner modal and open name modal
    setWinnerModalOpen(false);
    setTimeout(() => {
      if (openNameModal) {
        setShowNameModal(true);
        setShowLanding(false);
      } else {
        // if immediate new match without name change -> fallback to bot
        if (wsRef.current && wsRef.current.readyState === 1) {
          setLoadingModalProps({ title: 'Starting new match', message: 'Creating bot match...' });
          setLoadingModalOpen(true);
          sendJSON(wsRef.current, { type: 'create_bot' });
        }
      }
    }, 120);
  }

  function onCancelLoading() {
    if (wsRef.current && wsRef.current.readyState === 1) {
      sendJSON(wsRef.current, { type: 'leave_queue' });
    }
    setLoadingModalOpen(false);
    setShowNameModal(false);
    setShowLanding(true);
    setStatus('idle');
  }

  function logout() {
    if (wsRef.current) wsRef.current.close();
    localStorage.removeItem('username');
    localStorage.removeItem('reconnectToken');
    wsRef.current = null;
    setShowLanding(true);
    setShowNameModal(false);
    setGameState(null);
    setPlayerIndex(null);
    setStatus('idle');
  }

  useEffect(() => {
    // create ws connection early
    ensureConnected();
    // cleanup on unload
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return (
    <div className="app">
      <div className="container">
        {showLanding ? (
          <Landing onStart={onStart} />
        ) : (
          <>
            <div className="topbar">
              <div className="left-info">
                <strong>{username || 'Guest'}</strong>
                <span className="status"> — {status}</span>
              </div>
              <div className="right-actions">
                <button onClick={() => setShowNameModal(true)} className="top-btn">Change Name</button>
                <button onClick={logout} className="top-btn danger">Exit</button>
              </div>
            </div>

            <main className="main-area">
              <Board
                board={(gameState && gameState.board) || Array.from({ length: 7 }, () => [])}
                onPlay={handleDrop}
                currentPlayer={(gameState && gameState.currentPlayer) || 1}
                lastMove={(gameState && gameState.moves && gameState.moves[gameState.moves.length - 1]) || null}
                winningCells={(gameState && gameState.winningCells) || []}
              />

              <div className="side-area">
                <Leaderboard />
              </div>
            </main>
          </>
        )}
      </div>

      <NameModal
        visible={showNameModal}
        initialName={username}
        onCancel={onCancelSearching}
        onStartSearching={(name, opts) => onStartSearching(name, opts)}
        onMatched={(payload) => {
          if (payload.game_state) setGameState(payload.game_state);
          setShowNameModal(false);
          setStatus('in_game');
          try {
            const ev = new CustomEvent('connect4:matched', { detail: { you: payload.youAre, opponent: payload.opponent } });
            window.dispatchEvent(ev);
          } catch (e) {}
        }}
      />

      <WinnerModal
        open={winnerModalOpen}
        winnerName={winnerInfo.name}
        opponentIsBot={winnerInfo.isBot}
        result={winnerInfo.result}
        onRematch={handleRematch}
        onNewMatch={(openModal) => handleNewMatch(openModal)}
        onClose={() => {
          setWinnerModalOpen(false);
          setShowLanding(true);
          setGameState(null);
        }}
      />

      <LoadingModal
        open={loadingModalOpen}
        title={loadingModalProps.title || 'Please wait'}
        message={loadingModalProps.message || 'Waiting...'}
        countdown={loadingModalProps.countdown ?? null}
        onCancel={onCancelLoading}
      />

      {/* Rematch offer prompt for incoming offers */}
      {rematchOffer && (
        <div className="rematch-offer-modal">
          <div className="card">
            <h3>Rematch request</h3>
            <p>{rematchOffer.from} wants a rematch. Accept?</p>
            <div className="row">
              <button className="btn-bubble" onClick={() => respondRematch(true)}>Accept</button>
              <button className="btn-bubble danger" onClick={() => respondRematch(false)}>Decline</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
