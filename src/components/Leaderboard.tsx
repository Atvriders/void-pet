import React, { useMemo } from 'react';
import { getLeaderboard } from '../game/save';
import type { LeaderboardEntry } from '../game/types';

interface Props {
  currentUsername: string;
  onClose: () => void;
}

function formatAge(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

type Stage = LeaderboardEntry['stage'];

function stageBadge(stage: Stage): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-block',
    padding: '1px 7px',
    borderRadius: 3,
    fontSize: '0.72em',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  };
  switch (stage) {
    case 'seed':
      return { ...base, background: '#0e2a2a', color: '#00e5ff', border: '1px solid #00e5ff' };
    case 'sprite':
      return { ...base, background: '#0d1a2e', color: '#448aff', border: '1px solid #448aff' };
    case 'entity':
      return { ...base, background: '#1a0d2e', color: '#ce93d8', border: '1px solid #ce93d8' };
    case 'apex':
      return { ...base, background: '#2a1a00', color: '#ffd54f', border: '1px solid #ffd54f' };
    case 'ascendant':
      return {
        ...base,
        background: '#111',
        border: '1px solid #aaa',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        backgroundImage: 'linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)',
      };
    case 'corrupted':
      return { ...base, background: '#2a0000', color: '#ff1744', border: '1px solid #ff1744' };
    default:
      return { ...base, background: '#111', color: '#aaa', border: '1px solid #333' };
  }
}

function StageBadge({ stage }: { stage: Stage }) {
  if (stage === 'ascendant') {
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '1px 7px',
          borderRadius: 3,
          fontSize: '0.72em',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          background: '#111',
          border: '1px solid #888',
        }}
      >
        <span
          style={{
            backgroundImage: 'linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            display: 'inline',
          }}
        >
          {stage}
        </span>
      </span>
    );
  }
  return <span style={stageBadge(stage)}>{stage}</span>;
}

export default function Leaderboard({ currentUsername, onClose }: Props) {
  const entries: LeaderboardEntry[] = useMemo(() => {
    const board = getLeaderboard();
    return [...board].sort((a, b) => b.careScore - a.careScore).slice(0, 50);
  }, []);

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    background: 'rgba(5, 8, 16, 0.97)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: "'Courier New', Courier, monospace",
    overflowY: 'auto',
  };

  const panelStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 720,
    padding: '0 16px 40px',
    boxSizing: 'border-box',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px 0 4px',
    borderBottom: '1px solid #1a2a3a',
    marginBottom: 8,
  };

  const titleStyle: React.CSSProperties = {
    color: '#00e5ff',
    fontSize: '1.3em',
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    margin: 0,
  };

  const subtitleStyle: React.CSSProperties = {
    color: '#3a5060',
    fontSize: '0.72em',
    letterSpacing: '0.1em',
    marginTop: 2,
  };

  const closeBtnStyle: React.CSSProperties = {
    background: 'none',
    border: '1px solid #1a2a3a',
    color: '#5a7a8a',
    fontSize: '1.4em',
    lineHeight: 1,
    padding: '2px 10px',
    cursor: 'pointer',
    borderRadius: 3,
    fontFamily: 'inherit',
    transition: 'color 0.15s, border-color 0.15s',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.88em',
    color: '#8aaabb',
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '7px 10px',
    color: '#2a4a5a',
    fontWeight: 700,
    letterSpacing: '0.12em',
    fontSize: '0.8em',
    textTransform: 'uppercase',
    borderBottom: '1px solid #0e1e2a',
    userSelect: 'none',
  };

  const thRightStyle: React.CSSProperties = {
    ...thStyle,
    textAlign: 'right',
  };

  const emptyStyle: React.CSSProperties = {
    textAlign: 'center',
    color: '#2a4a5a',
    letterSpacing: '0.14em',
    padding: '60px 0',
    fontSize: '0.9em',
    textTransform: 'uppercase',
  };

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <div style={headerStyle}>
          <div>
            <div style={titleStyle}>Leaderboard</div>
            <div style={subtitleStyle}>(device-local scores)</div>
          </div>
          <button
            style={closeBtnStyle}
            onClick={onClose}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#00e5ff';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#00e5ff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#5a7a8a';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#1a2a3a';
            }}
            aria-label="Close leaderboard"
          >
            ×
          </button>
        </div>

        {entries.length === 0 ? (
          <div style={emptyStyle}>NO ENTITIES RECORDED YET</div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 40 }}>#</th>
                <th style={thStyle}>Username</th>
                <th style={thRightStyle}>Care Score</th>
                <th style={thStyle}>Stage</th>
                <th
                  style={thRightStyle}
                  className="hide-on-mobile"
                  data-hide-mobile="true"
                >
                  Age
                </th>
                <th style={thRightStyle}>Ascensions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => {
                const isCurrentUser = entry.username === currentUsername;
                const rank = idx + 1;

                const rowStyle: React.CSSProperties = {
                  borderBottom: '1px solid #0a1520',
                  background: isCurrentUser ? 'rgba(0, 229, 255, 0.04)' : 'transparent',
                  boxShadow: isCurrentUser ? 'inset 2px 0 0 #00e5ff' : undefined,
                  transition: 'background 0.1s',
                };

                const tdBase: React.CSSProperties = {
                  padding: '8px 10px',
                  verticalAlign: 'middle',
                };

                const tdRight: React.CSSProperties = {
                  ...tdBase,
                  textAlign: 'right',
                };

                const rankColor =
                  rank === 1
                    ? '#ffd54f'
                    : rank === 2
                    ? '#b0bec5'
                    : rank === 3
                    ? '#ce6c2d'
                    : '#2a4a5a';

                const usernameStyle: React.CSSProperties = {
                  color: isCurrentUser ? '#00e5ff' : '#8aaabb',
                  fontWeight: isCurrentUser ? 700 : 400,
                };

                const scoreStyle: React.CSSProperties = {
                  ...tdRight,
                  color: isCurrentUser ? '#00e5ff' : '#8aaabb',
                  fontWeight: isCurrentUser ? 700 : 400,
                  fontVariantNumeric: 'tabular-nums',
                };

                return (
                  <tr key={entry.username} style={rowStyle}>
                    <td style={{ ...tdBase, color: rankColor, fontWeight: 700, width: 40 }}>
                      {rank}
                    </td>
                    <td style={{ ...tdBase, ...usernameStyle }}>{entry.username}</td>
                    <td style={scoreStyle}>
                      {entry.careScore.toLocaleString()}
                    </td>
                    <td style={tdBase}>
                      <StageBadge stage={entry.stage} />
                    </td>
                    <td
                      style={{ ...tdRight, color: '#4a6a7a', fontVariantNumeric: 'tabular-nums' }}
                      data-hide-mobile="true"
                    >
                      {formatAge(entry.age)}
                    </td>
                    <td style={{ ...tdRight, color: '#4a6a7a', fontVariantNumeric: 'tabular-nums' }}>
                      {entry.ascensions}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        @media (max-width: 480px) {
          [data-hide-mobile="true"] {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
