import { useState, useEffect, useRef, Fragment } from 'react';
import type { PetState, Mood } from '../game/types';
import { MOOD_LABEL } from '../game/mood';

interface Props { pet: PetState; mood: Mood; username: string; }

function fmtAge(m: number): string {
  if (m < 60) return `${Math.floor(m)}m`;
  return `${Math.floor(m / 60)}h ${Math.floor(m % 60)}m`;
}

const GENERIC_MESSAGES = [
  'PACKET STREAM NOMINAL',
  'NEURAL LINK STABLE',
  'ENTROPY INDEX: LOW',
  'MEMORY SECTORS ONLINE',
  'VOID RESONANCE DETECTED',
  'CARRIER SIGNAL LOCKED',
  'QUANTUM COHERENCE MAINTAINED',
  'DATA PIPELINE ACTIVE',
  'PROCESS HEAP NOMINAL',
  'SECTOR SCAN COMPLETE',
  'UPLINK VERIFIED',
  'LATENCY: 0ms',
];

const MOOD_MESSAGES: Partial<Record<Mood, string[]>> = {
  overheating: ['THERMAL THRESHOLD EXCEEDED', 'COOLING PROTOCOL ENGAGED'],
  corrupted:   ['CRITICAL ERROR — CORE FRAGMENTED', 'EMERGENCY DEFRAG REQUIRED'],
  sleeping:    ['LOW POWER MODE ACTIVE', 'STANDBY PROTOCOL ENGAGED'],
  hungry:      ['SIGNAL ACQUISITION FAILING', 'DATA FEED INTERRUPTED'],
  happy:       ['ALL SYSTEMS OPTIMAL', 'ENTITY FLOURISHING'],
  sad:         ['COHERENCE MATRIX DEGRADING', 'STABILITY WARNING ISSUED'],
};

function buildPool(mood: Mood): string[] {
  const moodSpecific = MOOD_MESSAGES[mood] ?? [];
  return [...GENERIC_MESSAGES, ...moodSpecific];
}

function pickMessage(pool: string[], exclude: string): string {
  const candidates = pool.filter(m => m !== exclude);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

const METRICS: { label: string; getValue: (p: PetState, mood: Mood, username: string) => string }[] = [
  { label: 'USER',   getValue: (_p, _m, u) => u },
  { label: 'ENTITY', getValue: (p) => p.name },
  { label: 'STAGE',  getValue: (p) => p.stage.toUpperCase() },
  { label: 'STATUS', getValue: (_p, m) => MOOD_LABEL[m] },
  { label: 'AGE',    getValue: (p) => fmtAge(p.age) },
  { label: 'CARE',   getValue: (p) => String(Math.floor(p.careScore)) },
  { label: 'ASC',    getValue: (p) => `${p.ascensions}\u00d7` },
];

export default function EntityConsole({ pet, mood, username }: Props) {
  const [lines,         setLines]         = useState<string[]>([]);
  const [displayedText, setDisplayedText] = useState('');
  const [fullText,      setFullText]      = useState('');
  const [fading,        setFading]        = useState(false);

  // Refs to track intervals/timeouts safely
  const typingRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentFull  = useRef('');
  const currentMood  = useRef<Mood>(mood);

  function clearAll() {
    if (typingRef.current)  clearInterval(typingRef.current);
    if (holdRef.current)    clearTimeout(holdRef.current);
    if (fadeRef.current)    clearTimeout(fadeRef.current);
    if (nextRef.current)    clearTimeout(nextRef.current);
  }

  function startTyping(msg: string) {
    clearAll();
    currentFull.current = msg;
    setFullText(msg);
    setDisplayedText('');
    setFading(false);

    let idx = 0;
    typingRef.current = setInterval(() => {
      idx += 1;
      setDisplayedText(msg.slice(0, idx));
      if (idx >= msg.length) {
        clearInterval(typingRef.current!);
        // Hold for 1.5s, then fade
        holdRef.current = setTimeout(() => {
          setFading(true);
          // After fade (0.5s), add to lines and pick next
          fadeRef.current = setTimeout(() => {
            setLines(prev => {
              const next = [...prev, currentFull.current];
              return next.slice(-4);
            });
            // Pick next message after a brief gap
            nextRef.current = setTimeout(() => {
              const pool = buildPool(currentMood.current);
              const next = pickMessage(pool, currentFull.current);
              startTyping(next);
            }, 100);
          }, 500);
        }, 1500);
      }
    }, 40);
  }

  // On mount: start the first message
  useEffect(() => {
    const pool = buildPool(mood);
    const first = pool[Math.floor(Math.random() * pool.length)];
    startTyping(first);

    return () => { clearAll(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update mood ref when it changes so new messages use the right pool
  useEffect(() => {
    currentMood.current = mood;
  }, [mood]);

  // Line opacity: oldest = 0.2, newest = 0.8
  function lineOpacity(index: number, total: number): number {
    if (total === 0) return 0.5;
    const t = index / Math.max(total - 1, 1);
    return 0.2 + t * 0.6;
  }

  const isDone = displayedText.length === fullText.length && fullText.length > 0;

  return (
    <div
      style={{
        background:  '#020507',
        borderTop:   '1px solid #1a2240',
        padding:     '12px 16px',
        display:     'flex',
        gap:         24,
        fontFamily:  '"Share Tech Mono", monospace',
        fontSize:    12,
        flexShrink:  0,
        flexWrap:    'wrap',
      }}
    >
      {/* Left: Entity Metrics */}
      <div style={{ flex: '0 0 auto', minWidth: 160 }}>
        <div
          style={{
            color:        '#1e4060',
            fontSize:     11,
            marginBottom: 8,
            letterSpacing: 1,
          }}
        >
          // ENTITY METRICS
        </div>
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: 'auto 1fr',
            gap:                 '2px 16px',
          }}
        >
          {METRICS.map(({ label, getValue }) => (
            <Fragment key={label}>
              <span
                style={{ color: '#2a6080', letterSpacing: 1, whiteSpace: 'nowrap' }}
              >
                {label}
              </span>
              <span
                style={{
                  color:        '#8ab4c8',
                  letterSpacing: 1,
                  whiteSpace:   'nowrap',
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth:     180,
                  display:      'inline-block',
                }}
              >
                {getValue(pet, mood, username)}
              </span>
            </Fragment>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, background: '#0e1e2e', flexShrink: 0 }} />

      {/* Right: System Console */}
      <div style={{ flex: 1, minWidth: 200 }}>
        <div
          style={{
            color:        '#1e4060',
            fontSize:     11,
            marginBottom: 8,
            letterSpacing: 1,
          }}
        >
          // SYSTEM CONSOLE
        </div>

        {/* Historical lines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {lines.map((line, i) => (
            <div
              key={`${i}-${line}`}
              style={{
                opacity:       lineOpacity(i, lines.length),
                color:         '#8ab4c8',
                letterSpacing: 1,
                whiteSpace:    'nowrap',
                overflow:      'hidden',
                textOverflow:  'ellipsis',
              }}
            >
              {line}
            </div>
          ))}

          {/* Currently typing line */}
          {fullText && (
            <div
              style={{
                color:         '#00d4ff',
                letterSpacing: 1,
                opacity:       fading ? 0 : 1,
                transition:    fading ? 'opacity 0.5s ease' : 'none',
                whiteSpace:    'nowrap',
              }}
            >
              {displayedText}
              {!isDone && (
                <BlinkingCursor />
              )}
              {isDone && !fading && (
                <span style={{ opacity: 0.6 }}>▋</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BlinkingCursor() {
  return (
    <span
      style={{
        display:   'inline-block',
        animation: 'blink-cursor 0.7s step-end infinite',
      }}
    >
      ▋
    </span>
  );
}
