import { useReducer, useEffect, useRef, useState, useCallback } from 'react';
import Creature  from './components/Creature';
import StatPanel from './components/StatPanel';
import ActionBar from './components/ActionBar';
import LifeLog   from './components/LifeLog';
import { reducer } from './game/reducer';
import { getMood, MOOD_LABEL } from './game/mood';
import { save, load } from './game/save';
import type { Action } from './game/types';
import './App.css';

export default function App() {
  const [pet, dispatch] = useReducer(reducer, undefined, load);
  const [now, setNow]   = useState(Date.now);
  const [renaming, setRenaming] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const rafRef = useRef(0);

  // Game loop — RAF driven
  useEffect(() => {
    let last = performance.now();
    function loop(ts: number) {
      if (ts - last >= 1000) { // tick once per second
        const n = Date.now();
        dispatch({ type: 'TICK', now: n });
        setNow(n);
        last = ts;
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Save on every meaningful state change
  useEffect(() => { save(pet); }, [pet]);

  const mood      = getMood(pet);
  const moodLabel = MOOD_LABEL[mood];

  const doDispatch = useCallback((a: Action) => dispatch(a), []);

  const handleRename = () => {
    if (nameInput.trim()) dispatch({ type: 'RENAME', name: nameInput.trim() });
    setRenaming(false);
    setNameInput('');
  };

  const handleReset = () => {
    if (confirm(`Abandon ${pet.name}? Ascension count will be preserved.`)) {
      dispatch({ type: 'RESET' });
    }
  };

  return (
    <div className="app" data-mood={mood}>
      {/* Scanline overlay */}
      <div className="scanlines" aria-hidden />

      <header className="topbar">
        <div className="title-block">
          <span className="game-title">VOID</span>
          <span className="build-tag">v0.1 // DATA LIFEFORM</span>
        </div>
        {renaming ? (
          <div className="rename-row">
            <input
              autoFocus
              maxLength={16}
              value={nameInput}
              onChange={e => setNameInput(e.target.value.toUpperCase())}
              onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenaming(false); }}
              className="rename-input"
              placeholder="ENTITY_NAME"
            />
            <button className="icon-btn" onClick={handleRename}>✓</button>
            <button className="icon-btn" onClick={() => setRenaming(false)}>✕</button>
          </div>
        ) : (
          <button className="pet-name-btn" onClick={() => { setRenaming(true); setNameInput(pet.name); }}>
            {pet.name}
          </button>
        )}
        <button className="reset-btn" onClick={handleReset}>ABANDON</button>
      </header>

      <div className="main">
        {/* Centre: creature */}
        <div className="creature-col">
          <div className="creature-frame" data-mood={mood}>
            <Creature pet={pet} mood={mood} />
          </div>
          <div className={`mood-badge ${mood}`}>{moodLabel}</div>

          {pet.stage === 'corrupted' && pet.recoverNeeded > 0 && (
            <div className="corruption-alert">
              ⚠ CORRUPTION — run DEFRAG ×{pet.recoverNeeded} to recover
            </div>
          )}

          <ActionBar pet={pet} now={now} dispatch={doDispatch} />
        </div>

        {/* Right: stats + log */}
        <div className="info-col">
          <StatPanel pet={pet} mood={mood} now={now} />
          <LifeLog   log={pet.log} />
        </div>
      </div>
    </div>
  );
}
