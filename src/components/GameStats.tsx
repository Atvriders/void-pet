import type { CSSProperties } from 'react';
import type { PetState } from '../game/types';
import StageBadge from './StageBadge';

interface Props {
  state: PetState;
  username: string;
}

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

const chipBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '3px',
  fontFamily: "'Share Tech Mono', monospace",
  fontSize: '11px',
  lineHeight: 1,
  padding: '2px 6px',
  borderRadius: '4px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  color: '#7a8fa8',
  whiteSpace: 'nowrap' as const,
  letterSpacing: '0.03em',
};

export default function GameStats({ state, username: _username }: Props) {
  const { careScore, age, stage, ascensions } = state;
  const isRichScore = careScore > 1000;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '5px',
        alignItems: 'center',
      }}
    >
      {/* Care Score */}
      <span
        style={{
          ...chipBase,
          color: isRichScore ? '#fbbf24' : '#7a8fa8',
          borderColor: isRichScore ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.09)',
          background: isRichScore ? 'rgba(251,191,36,0.06)' : 'rgba(255,255,255,0.04)',
        }}
      >
        <span aria-hidden="true">◈</span>
        {Math.floor(careScore).toLocaleString()} pts
      </span>

      {/* Age */}
      <span style={chipBase}>
        <span aria-hidden="true" style={{ opacity: 0.7 }}>◷</span>
        {formatAge(age)}
      </span>

      {/* Stage */}
      <StageBadge stage={stage} size="sm" />

      {/* Ascensions — only when > 0 */}
      {ascensions > 0 && (
        <span
          style={{
            ...chipBase,
            color: '#fbbf24',
            borderColor: 'rgba(251,191,36,0.2)',
            background: 'rgba(251,191,36,0.06)',
            fontWeight: 700,
          }}
          aria-label={`${ascensions} ascension${ascensions === 1 ? '' : 's'}`}
        >
          ↑{ascensions}
        </span>
      )}
    </div>
  );
}
