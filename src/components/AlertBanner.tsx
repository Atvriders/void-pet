import React from 'react';

interface Alert {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
}

interface Props {
  alerts: Alert[];
}

const ALERT_CONFIG: Record<
  Alert['type'],
  { bg: string; color: string; icon: string }
> = {
  error:   { bg: '#ff4444', color: '#1a0000', icon: '✕' },
  warning: { bg: '#f97316', color: '#1a0800', icon: '⚠' },
  info:    { bg: '#00d4ff', color: '#001a1f', icon: '◈' },
  success: { bg: '#22d3a0', color: '#001a12', icon: '✓' },
};

const AlertBanner: React.FC<Props> = ({ alerts }) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '72px', // sits above action bar on mobile
        left: 0,
        right: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '0 12px 8px',
        pointerEvents: 'none',
      }}
    >
      <style>{`
        @keyframes alertSlideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {alerts.map((alert, index) => {
        const { bg, color, icon } = ALERT_CONFIG[alert.type];
        return (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: bg,
              color: color,
              fontFamily: 'monospace',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              lineHeight: 1.4,
              boxShadow: `0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px ${bg}80`,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              animation: 'alertSlideUp 0.25s ease-out both',
              animationDelay: `${index * 60}ms`,
              pointerEvents: 'auto',
            }}
          >
            <span
              style={{
                flexShrink: 0,
                fontSize: '15px',
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {icon}
            </span>
            <span style={{ flex: 1 }}>{alert.message}</span>
          </div>
        );
      })}
    </div>
  );
};

export default AlertBanner;
