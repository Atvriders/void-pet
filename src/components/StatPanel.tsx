import type { CSSProperties } from 'react';
import type { PetState, Mood } from '../game/types';
import { MOOD_LABEL } from '../game/mood';

interface Props { pet: PetState; mood: Mood }

// ─── Stat bar config ────────────────────────────────────────────────────────

interface Bar {
  label: string;
  icon:  string;
  key:   keyof Pick<PetState, 'signal' | 'coherence' | 'heat' | 'power'>;
  invert?: boolean;
}

const BARS: Bar[] = [
  { label: 'SIGNAL',    icon: '◈', key: 'signal',    invert: false },
  { label: 'COHERENCE', icon: '❋', key: 'coherence', invert: false },
  { label: 'HEAT',      icon: '▲', key: 'heat',      invert: true  },
  { label: 'POWER',     icon: '⚡', key: 'power',     invert: false },
];

const SEGMENTS = 20;

// Returns fill color for a segment bar
function segmentColor(val: number, invert: boolean): string {
  const pct = invert ? 100 - val : val;
  if (pct > 60) return '#22d36e';
  if (pct >= 40) return '#f5c542';
  return '#ff4040';
}

// ─── Stage badge config ──────────────────────────────────────────────────────

const STAGE_COLORS: Record<string, string> = {
  seed:       '#00d4ff',
  sprite:     '#4080ff',
  entity:     '#a78bfa',
  apex:       '#fbbf24',
  corrupted:  '#ff4040',
};

// ─── Mood icon config ────────────────────────────────────────────────────────

const MOOD_ICONS: Record<Mood, string> = {
  happy:       '◉',
  sad:         '◎',
  neutral:     '○',
  hungry:      '◌',
  tired:       '◔',
  sleeping:    '◕',
  overheating: '●',
  corrupted:   '✕',
};

const MOOD_COLORS: Record<Mood, string> = {
  happy:       '#22d36e',
  sad:         '#4080ff',
  neutral:     '#a0b0c0',
  hungry:      '#f5c542',
  tired:       '#a78bfa',
  sleeping:    '#6b8cba',
  overheating: '#ff6030',
  corrupted:   '#ff4040',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtAge(mins: number): string {
  if (mins < 60) return `${Math.floor(mins)}m`;
  const h = Math.floor(mins / 60);
  const m = Math.floor(mins % 60);
  return `${h}h ${m}m`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SegmentBar({ val, invert }: { val: number; invert: boolean }) {
  const filled = Math.round((val / 100) * SEGMENTS);
  const color  = segmentColor(val, invert);
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
      {Array.from({ length: SEGMENTS }, (_, i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 10,
            borderRadius: 1,
            background: i < filled ? color : '#1a2240',
            boxShadow:  i < filled ? `0 0 4px ${color}80` : 'none',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

function StageBadge({ stage }: { stage: string }) {
  const isAscendant = stage === 'ascendant';
  const color = STAGE_COLORS[stage] ?? '#a0b0c0';

  const baseStyle: CSSProperties = {
    display:       'inline-block',
    padding:       '2px 10px',
    borderRadius:  20,
    fontSize:      11,
    fontWeight:    700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    border:        `1px solid ${isAscendant ? 'transparent' : color}40`,
  };

  if (isAscendant) {
    return (
      <span
        style={{
          ...baseStyle,
          background: 'linear-gradient(90deg,#00d4ff,#a78bfa,#fbbf24,#ff6030)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          border: '1px solid #ffffff30',
        }}
      >
        {stage}
      </span>
    );
  }

  return (
    <span
      style={{
        ...baseStyle,
        color,
        background: `${color}18`,
      }}
    >
      {stage}
    </span>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <span
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           4,
        padding:       '3px 8px',
        borderRadius:  20,
        background:    '#111828',
        border:        '1px solid #1e2e4a',
        fontSize:      11,
        color:         '#6a8aaa',
        letterSpacing: '0.04em',
        whiteSpace:    'nowrap',
      }}
    >
      <span style={{ color: '#3a5070', textTransform: 'uppercase', fontSize: 10 }}>{label}</span>
      <span style={{ color: '#c0d4f0', fontWeight: 700 }}>{value}</span>
    </span>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function StatPanel({ pet, mood }: Props) {
  const moodColor = MOOD_COLORS[mood] ?? '#a0b0c0';
  const moodIcon  = MOOD_ICONS[mood]  ?? '○';

  return (
    <div
      style={{
        maxWidth:    340,
        width:       '100%',
        background:  '#0b0f1e',
        border:      '1px solid #1a2240',
        borderRadius: 12,
        padding:     16,
        fontFamily:  'monospace',
        boxSizing:   'border-box',
        display:     'flex',
        flexDirection: 'column',
        gap:         14,
      }}
    >
      {/* ── Header: stage badge + mood ─────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <StageBadge stage={pet.stage} />
        <div
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        6,
            color:      moodColor,
            fontSize:   13,
            fontWeight: 700,
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>{moodIcon}</span>
          <span style={{ letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 11 }}>
            {MOOD_LABEL[mood]}
          </span>
        </div>
      </div>

      {/* ── Divider ────────────────────────────────────────────────────── */}
      <div style={{ height: 1, background: '#1a2240' }} />

      {/* ── Stat bars ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {BARS.map(b => {
          const val = pet[b.key];
          return (
            <div key={b.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Icon + label */}
              <div
                style={{
                  width:         82,
                  display:       'flex',
                  alignItems:    'center',
                  gap:           5,
                  flexShrink:    0,
                }}
              >
                <span style={{ fontSize: 12, color: '#3a5a7a', lineHeight: 1 }}>{b.icon}</span>
                <span
                  style={{
                    fontSize:      10,
                    letterSpacing: '0.07em',
                    color:         '#5a7a9a',
                    textTransform: 'uppercase',
                  }}
                >
                  {b.label}
                </span>
              </div>

              {/* Segmented bar */}
              <SegmentBar val={val} invert={!!b.invert} />

              {/* Numeric value */}
              <span
                style={{
                  width:     28,
                  textAlign: 'right',
                  fontSize:  11,
                  color:     '#6a8aaa',
                  flexShrink: 0,
                }}
              >
                {Math.floor(val)}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Divider ────────────────────────────────────────────────────── */}
      <div style={{ height: 1, background: '#1a2240' }} />

      {/* ── Metadata chips ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <MetaChip label="Stage" value={pet.stage} />
        <MetaChip label="Age"   value={fmtAge(pet.age)} />
        <MetaChip label="Care"  value={Math.floor(pet.careScore).toString()} />
        <MetaChip label="Asc"   value={pet.ascensions.toString()} />
      </div>
    </div>
  );
}
