import React from 'react';

interface Props {
  label: string;
  icon: string;
  value: number;
  inverted?: boolean;
  segments?: number;
}

function getBarColor(value: number, inverted: boolean): string {
  if (inverted) {
    if (value > 70) return '#ff4444';
    if (value >= 40) return '#fbbf24';
    return '#22d3a0';
  } else {
    if (value > 60) return '#22d3a0';
    if (value >= 30) return '#fbbf24';
    return '#ff4444';
  }
}

const pulseKeyframes = `
@keyframes statbar-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
`;

let styleInjected = false;
function injectPulseStyle() {
  if (styleInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = pulseKeyframes;
  document.head.appendChild(style);
  styleInjected = true;
}

const StatBar: React.FC<Props> = ({
  label,
  icon,
  value,
  inverted = false,
  segments = 20,
}) => {
  injectPulseStyle();

  const clampedValue = Math.max(0, Math.min(100, value));
  const barColor = getBarColor(clampedValue, inverted);
  const isWarning = (inverted && clampedValue > 80) || (!inverted && clampedValue < 20);
  const filledCount = Math.round((clampedValue / 100) * segments);

  const containerStyle: React.CSSProperties = {
    marginBottom: 12,
  };

  const labelRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 12,
    marginBottom: 5,
  };

  const labelStyle: React.CSSProperties = {
    color: '#4a6090',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    animation: isWarning ? 'statbar-pulse 1s ease-in-out infinite' : undefined,
  };

  const iconStyle: React.CSSProperties = {
    color: '#6080a0',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: barColor,
  };

  const segmentsRowStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'nowrap',
  };

  const getSegmentStyle = (filled: boolean): React.CSSProperties => ({
    width: 10,
    height: 10,
    borderRadius: 2,
    margin: '0 1px',
    backgroundColor: filled ? barColor : '#1a2240',
    flexShrink: 0,
  });

  return (
    <div style={containerStyle}>
      <div style={labelRowStyle}>
        <span style={labelStyle}>
          <span style={iconStyle}>{icon}</span>
          {label}
        </span>
        <span style={valueStyle}>{clampedValue}%</span>
      </div>
      <div style={segmentsRowStyle}>
        {Array.from({ length: segments }, (_, i) => (
          <div key={i} style={getSegmentStyle(i < filledCount)} />
        ))}
      </div>
    </div>
  );
};

export default StatBar;
