import type { PetState } from '../game/types';
import type { Action } from '../game/types';

interface Props {
  state: PetState;
  dispatch: (a: Action) => void;
  now: number;
}

export default function CorruptionRecovery({ state, dispatch, now }: Props) {
  if (state.stage !== 'corrupted') return null;

  const cooldownSecs = now < state.coolDefrag ? Math.ceil((state.coolDefrag - now) / 1000) : 0;
  const onCooldown = cooldownSecs > 0;

  const totalDefrags = 3;
  const completed = totalDefrags - state.recoverNeeded;

  return (
    <div
      style={{
        background: 'rgba(255,20,20,0.06)',
        border: '1px solid rgba(255,68,68,0.4)',
        borderRadius: 8,
        padding: 16,
        color: '#ff9090',
      }}
    >
      <div
        style={{
          fontWeight: 'bold',
          fontSize: '1.1rem',
          color: '#ff4444',
          marginBottom: 8,
          animation: 'blink 1s step-start infinite',
        }}
      >
        ⚠ ENTITY CORRUPTED
      </div>

      <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem' }}>
        Critical system failure. Run DEFRAG to begin recovery.
      </p>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: '0.85rem', marginBottom: 6 }}>
          Recovery progress: {completed}/{totalDefrags} defrag operations completed
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {Array.from({ length: totalDefrags }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: i < completed ? '#ff4444' : 'transparent',
                border: '2px solid rgba(255,68,68,0.6)',
              }}
            />
          ))}
        </div>
      </div>

      <button
        onClick={() => dispatch({ type: 'DEFRAG' })}
        disabled={onCooldown}
        style={{
          background: onCooldown ? 'rgba(255,68,68,0.1)' : 'rgba(255,68,68,0.2)',
          border: '1px solid rgba(255,68,68,0.5)',
          borderRadius: 6,
          color: onCooldown ? 'rgba(255,144,144,0.5)' : '#ff9090',
          cursor: onCooldown ? 'not-allowed' : 'pointer',
          padding: '8px 14px',
          fontSize: '0.9rem',
          marginBottom: 10,
        }}
      >
        {onCooldown ? `⟳ DEFRAG (${cooldownSecs}s)` : '⟳ DEFRAG (water)'}
      </button>

      <p style={{ margin: 0, fontSize: '0.78rem', opacity: 0.75 }}>
        Heat must be reduced to allow recovery. Each DEFRAG reduces heat and advances recovery.
      </p>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
