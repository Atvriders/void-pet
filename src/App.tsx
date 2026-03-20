import { useReducer, useEffect, useRef, useState } from 'react';
import Creature       from './components/Creature';
import StatPanel      from './components/StatPanel';
import ActionBar      from './components/ActionBar';
import LifeLog        from './components/LifeLog';
import UsernameScreen from './components/UsernameScreen';
import Leaderboard    from './components/Leaderboard';
import { reducer, INITIAL_STATE, makeBootLog } from './game/reducer';
import { getMood, MOOD_HUE, MOOD_LABEL } from './game/mood';
import {
  getStoredUsername,
  setStoredUsername,
  savePet,
  loadPet,
  deletePet,
  submitScore,
  removeScore,
} from './game/save';
import './App.css';

export default function App() {
  // ── Auth / view state ────────────────────────────────────────────────────
  const [username, setUsername]             = useState<string | null>(() => getStoredUsername());
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showRename, setShowRename]         = useState(false);
  const [renameInput, setRenameInput]       = useState('');

  // ── Pet state ────────────────────────────────────────────────────────────
  const [petState, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [now, setNow]        = useState(Date.now);
  const rafRef               = useRef(0);

  // ── On mount: if we already have a stored username, load that pet ─────────
  useEffect(() => {
    if (username) {
      const saved = loadPet(username);
      if (saved) {
        dispatch({ type: 'LOAD', state: saved });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Game loop — RAF driven ───────────────────────────────────────────────
  useEffect(() => {
    if (!username) return; // don't run loop on username screen
    let last = performance.now();
    function loop(ts: number) {
      if (ts - last >= 1000) {
        const n = Date.now();
        dispatch({ type: 'TICK', now: n });
        setNow(n);
        last += 1000; // step by exactly 1s to prevent clock drift
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [username]);

  // ── Persist pet on every state change ────────────────────────────────────
  useEffect(() => {
    if (!username) return;
    savePet(username, petState);
    submitScore({
      username,
      careScore:  petState.careScore,
      stage:      petState.stage,
      age:        petState.age,
      ascensions: petState.ascensions,
      date:       Date.now(),
    });
  }, [username, petState]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleUsernameSubmit(name: string) {
    setStoredUsername(name);
    const saved = loadPet(name);
    if (saved) {
      dispatch({ type: 'LOAD', state: saved });
    } else {
      dispatch({ type: 'LOAD', state: { ...INITIAL_STATE, log: makeBootLog() } });
    }
    setUsername(name);
  }

  function handleRename() {
    const trimmed = renameInput.trim();
    if (trimmed) {
      dispatch({ type: 'RENAME', name: trimmed });
    }
    setShowRename(false);
    setRenameInput('');
  }

  function handleAbandon() {
    if (confirm('Abandon this entity? All progress will be lost.')) {
      if (username) {
        deletePet(username);
        removeScore(username);
        setStoredUsername(''); // clear persisted username so next session starts fresh
      }
      dispatch({ type: 'RESET' });
      setUsername(null); // return to username screen
    }
  }

  // ── Username screen ───────────────────────────────────────────────────────
  if (!username) {
    return <UsernameScreen onSubmit={handleUsernameSubmit} />;
  }

  // ── Game view ─────────────────────────────────────────────────────────────
  const mood      = getMood(petState);
  const moodLabel = MOOD_LABEL[mood];
  const hue       = MOOD_HUE[mood];
  const moodHex   = `hsl(${hue}, 80%, 55%)`;

  return (
    <div className="app" data-mood={mood}>
      {/* Scanline overlay */}
      <div className="scanlines" aria-hidden />

      {/* ── Topbar ── */}
      <div className="topbar">
        {/* Left: title + entity name */}
        <div className="topbar-title-block">
          <span className="topbar-title">VOID</span>
          <span className="topbar-subtitle" style={{ color: moodHex }}>
            {petState.name} // {moodLabel}
          </span>
        </div>

        {/* Center: username */}
        <div className="topbar-username" style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 1 }}>
          @{username}
        </div>

        {/* Right: action buttons */}
        <div className="topbar-actions">
          <button
            className="topbar-btn"
            onClick={() => setShowLeaderboard(true)}
            title="Leaderboard"
          >
            &#x229E; BOARD
          </button>

          {showRename ? (
            <span className="rename-row">
              <input
                autoFocus
                maxLength={16}
                value={renameInput}
                onChange={e => setRenameInput(e.target.value.toUpperCase())}
                onKeyDown={e => {
                  if (e.key === 'Enter')  handleRename();
                  if (e.key === 'Escape') { setShowRename(false); setRenameInput(''); }
                }}
                className="rename-input"
                placeholder="ENTITY_NAME"
              />
              <button className="topbar-btn" onClick={handleRename}>&#x2713;</button>
              <button className="topbar-btn" onClick={() => { setShowRename(false); setRenameInput(''); }}>&#x2715;</button>
            </span>
          ) : (
            <button
              className="topbar-btn"
              onClick={() => { setShowRename(true); setRenameInput(petState.name); }}
              title="Rename entity"
            >
              &#x270E; RENAME
            </button>
          )}

          <button
            className="topbar-btn danger"
            onClick={handleAbandon}
            title="Abandon entity"
          >
            &#x23FB; ABANDON
          </button>
        </div>
      </div>

      {/* ── Leaderboard overlay ── */}
      {showLeaderboard && (
        <Leaderboard
          currentUsername={username}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {/* ── Main game area ── */}
      <div className="game-area">
        <div className="creature-col">
          <div className="creature-frame" data-mood={mood}>
            <Creature pet={petState} mood={mood} />
          </div>
          <div className={`mood-badge ${mood}`}>{moodLabel}</div>
          <ActionBar pet={petState} now={now} dispatch={dispatch} />
        </div>

        <div className="info-col">
          <StatPanel pet={petState} mood={mood} />
          <LifeLog log={petState.log} />
        </div>
      </div>

      {/* ── Corruption alert ── */}
      {petState.stage === 'corrupted' && petState.recoverNeeded > 0 && (
        <div className="corruption-alert" role="alert" aria-live="assertive">
          &#x26A0; CORRUPTION — run DEFRAG &#xD7;{petState.recoverNeeded} to recover
        </div>
      )}
    </div>
  );
}
