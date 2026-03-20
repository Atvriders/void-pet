import type { Mood } from '../game/types';

interface Props {
  mood: Mood;
  label?: string;
}

const moodData: Record<Mood, { icon: string; label: string; color: string }> = {
  happy:       { icon: '◉', label: 'CONTENT',     color: '#00d4ff' },
  neutral:     { icon: '○', label: 'STABLE',       color: '#4a9090' },
  sad:         { icon: '◎', label: 'DEGRADING',    color: '#9060d0' },
  tired:       { icon: '◔', label: 'LOW POWER',    color: '#4d6090' },
  hungry:      { icon: '◈', label: 'DATA HUNGRY',  color: '#ff8800' },
  sleeping:    { icon: '◕', label: 'HIBERNATING',  color: '#4060a0' },
  overheating: { icon: '●', label: 'OVERHEATING',  color: '#ff3030' },
  corrupted:   { icon: '✕', label: 'CORRUPTED',    color: '#ff2020' },
};

const pulseKeyframes = `
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}
@keyframes pulseSlow {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
`;

function getIconAnimation(mood: Mood): string {
  if (mood === 'corrupted' || mood === 'overheating') return 'pulse 0.5s infinite';
  if (mood === 'sleeping') return 'pulseSlow 2s infinite';
  return 'none';
}

export function MoodIndicator({ mood, label }: Props) {
  const data = moodData[mood];
  const { color } = data;
  const displayLabel = label ?? data.label;
  const iconAnimation = getIconAnimation(mood);

  return (
    <>
      <style>{pulseKeyframes}</style>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: `${color}14`,
          border: `1px solid ${color}33`,
          padding: '8px 14px',
          borderRadius: '20px',
        }}
      >
        <span
          style={{
            fontSize: '24px',
            lineHeight: 1,
            color,
            textShadow: `0 0 8px ${color}, 0 0 16px ${color}80`,
            animation: iconAnimation,
            display: 'inline-block',
          }}
        >
          {data.icon}
        </span>
        <span
          style={{
            fontSize: '12px',
            color,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontWeight: 600,
          }}
        >
          {displayLabel}
        </span>
      </div>
    </>
  );
}
