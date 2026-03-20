import { useState, useEffect, type CSSProperties } from 'react';

interface Props {
  ageMinutes: number;
  ascensions?: number;
  className?: string;
  style?: CSSProperties;
}

const VETERAN_THRESHOLD = 480; // 8 hours in minutes

const clockKeyframes = `
@keyframes clockTick {
  0%   { transform: rotate(0deg);   opacity: 1;    }
  25%  { transform: rotate(90deg);  opacity: 0.75; }
  50%  { transform: rotate(180deg); opacity: 1;    }
  75%  { transform: rotate(270deg); opacity: 0.75; }
  100% { transform: rotate(360deg); opacity: 1;    }
}
@keyframes clockPulse {
  0%, 100% { opacity: 1;   transform: scale(1);    }
  50%       { opacity: 0.5; transform: scale(0.88); }
}
`;

function formatAge(ageMinutes: number): string {
  if (ageMinutes < 60) {
    return `${Math.floor(ageMinutes)}m`;
  }
  if (ageMinutes < 1440) {
    const h = Math.floor(ageMinutes / 60);
    const m = Math.floor(ageMinutes % 60);
    return `${h}h ${m}m`;
  }
  const d = Math.floor(ageMinutes / 1440);
  const h = Math.floor((ageMinutes % 1440) / 60);
  return `${d}d ${h}h`;
}

export function AgeDisplay({ ageMinutes, ascensions = 0, className, style }: Props) {
  // Tick state drives the icon animation restart trick — toggled every second.
  const [tick, setTick] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTick(t => !t), 1000);
    return () => clearInterval(id);
  }, []);

  const isVeteran = ageMinutes >= VETERAN_THRESHOLD;
  const color = isVeteran ? '#fbbf24' : '#4a6090';
  const glowColor = isVeteran ? '#fbbf2460' : '#4a609040';

  return (
    <>
      <style>{clockKeyframes}</style>
      <div
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: '13px',
          fontWeight: 600,
          color,
          letterSpacing: '0.05em',
          userSelect: 'none',
          ...style,
        }}
      >
        {/* Clock icon — uses a CSS animation that restarts each second via key change */}
        <span
          key={String(tick)}
          aria-hidden="true"
          style={{
            display: 'inline-block',
            lineHeight: 1,
            fontSize: '14px',
            color,
            textShadow: `0 0 6px ${glowColor}`,
            animation: isVeteran
              ? 'clockTick 1s linear forwards'
              : 'clockPulse 1s ease-in-out forwards',
            transformOrigin: 'center',
          }}
        >
          ◷
        </span>

        {/* Age text */}
        <span
          style={{
            textShadow: `0 0 4px ${glowColor}`,
          }}
        >
          {formatAge(ageMinutes)}
        </span>

        {/* Ascension badge */}
        {ascensions > 0 && (
          <span
            aria-label={`${ascensions} ascension${ascensions === 1 ? '' : 's'}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#fbbf2422',
              border: '1px solid #fbbf2466',
              borderRadius: '10px',
              padding: '0px 5px',
              fontSize: '10px',
              fontWeight: 700,
              color: '#fbbf24',
              letterSpacing: '0.03em',
              lineHeight: '16px',
              textShadow: '0 0 4px #fbbf2480',
              marginLeft: '2px',
            }}
          >
            ↑{ascensions}
          </span>
        )}
      </div>
    </>
  );
}
