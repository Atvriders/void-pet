import type { CSSProperties } from 'react';
import type { Stage } from '../game/types';

interface Props {
  stage: Stage;
  size?: 'sm' | 'md' | 'lg';
}

const stageStyles: Record<Stage, { color: string; border: string; background: string }> = {
  seed: {
    color: '#00d4ff',
    border: 'rgba(0,212,255,0.3)',
    background: 'rgba(0,212,255,0.08)',
  },
  sprite: {
    color: '#4d9fff',
    border: 'rgba(77,159,255,0.3)',
    background: 'rgba(77,159,255,0.08)',
  },
  entity: {
    color: '#a78bfa',
    border: 'rgba(167,139,250,0.3)',
    background: 'rgba(167,139,250,0.08)',
  },
  apex: {
    color: '#fbbf24',
    border: 'rgba(251,191,36,0.3)',
    background: 'rgba(251,191,36,0.08)',
  },
  ascendant: {
    color: '#ffffff',
    border: 'rgba(255,255,255,0.3)',
    background: 'rgba(255,255,255,0.06)',
  },
  corrupted: {
    color: '#ff4444',
    border: 'rgba(255,68,68,0.3)',
    background: 'rgba(255,68,68,0.08)',
  },
};

const sizeStyles: Record<'sm' | 'md' | 'lg', { fontSize: string; padding: string; borderRadius: string }> = {
  sm: { fontSize: '12px', padding: '2px 6px', borderRadius: '4px' },
  md: { fontSize: '12px', padding: '3px 8px', borderRadius: '5px' },
  lg: { fontSize: '14px', padding: '4px 10px', borderRadius: '6px' },
};

// Inject shimmer keyframes once at module load (not during render)
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
@keyframes stageBadgeShimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
`;
  document.head.appendChild(style);
}

export default function StageBadge({ stage, size = 'md' }: Props) {
  const { color, border, background } = stageStyles[stage];
  const { fontSize, padding, borderRadius } = sizeStyles[size];

  const baseStyle: CSSProperties = {
    display: 'inline-block',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize,
    padding,
    borderRadius,
    border: `1px solid ${border}`,
    background,
    letterSpacing: '0.1em',
    fontWeight: 700,
    lineHeight: 1,
  };

  if (stage === 'ascendant') {
    return (
      <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.06)', border: `1px solid ${border}`, borderRadius, padding }}>
        <span
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize,
            letterSpacing: '0.1em',
            fontWeight: 700,
            lineHeight: 1,
            background: 'linear-gradient(90deg, #c0c0c0 0%, #ffffff 25%, #e8e8ff 50%, #ffffff 75%, #c0c0c0 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'stageBadgeShimmer 2.5s linear infinite',
            display: 'inline-block',
          }}
        >
          {stage.toUpperCase()}
        </span>
      </span>
    );
  }

  return (
    <span style={{ ...baseStyle, color }}>
      {stage.toUpperCase()}
    </span>
  );
}
