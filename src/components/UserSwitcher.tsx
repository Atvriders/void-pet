import React, { useEffect, useState } from 'react';
import { listUsers, loadPet } from '../game/save';
import type { Stage } from '../game/types';
import StageBadge from './StageBadge';

interface Props {
  currentUsername: string;
  onSwitch: (username: string) => void;
  onNew: () => void;
  onClose: () => void;
}

interface UserEntry {
  username: string;
  stage: Stage | null;
  careScore: number | null;
}

export default function UserSwitcher({ currentUsername, onSwitch, onNew, onClose }: Props) {
  const [users, setUsers] = useState<UserEntry[]>([]);

  useEffect(() => {
    const allUsernames = listUsers();
    const entries: UserEntry[] = allUsernames.map((username) => {
      const pet = loadPet(username);
      return {
        username,
        stage: pet ? pet.stage : null,
        careScore: pet ? pet.careScore : null,
      };
    });
    // Sort: current user first, then alphabetically
    entries.sort((a, b) => {
      if (a.username === currentUsername) return -1;
      if (b.username === currentUsername) return 1;
      return a.username.localeCompare(b.username);
    });
    setUsers(entries);
  }, [currentUsername]);

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 1100,
    background: 'rgba(4, 7, 14, 0.96)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Share Tech Mono', 'Courier New', Courier, monospace",
  };

  const modalStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 400,
    margin: '0 16px',
    background: '#080d18',
    border: '1px solid #1a2a3a',
    borderRadius: 6,
    boxShadow: '0 0 40px rgba(0, 212, 255, 0.08), 0 0 80px rgba(0, 0, 0, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px 14px',
    borderBottom: '1px solid #111d2a',
  };

  const titleStyle: React.CSSProperties = {
    color: '#00d4ff',
    fontSize: '0.95em',
    fontWeight: 700,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    margin: 0,
  };

  const closeBtnStyle: React.CSSProperties = {
    background: 'none',
    border: '1px solid #1a2a3a',
    color: '#3a5a6a',
    fontSize: '1.3em',
    lineHeight: 1,
    padding: '1px 9px 3px',
    cursor: 'pointer',
    borderRadius: 3,
    fontFamily: 'inherit',
    transition: 'color 0.15s, border-color 0.15s',
  };

  const bodyStyle: React.CSSProperties = {
    padding: '12px 0 8px',
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 200px)',
  };

  const emptyStyle: React.CSSProperties = {
    textAlign: 'center',
    color: '#2a4a5a',
    letterSpacing: '0.14em',
    padding: '32px 20px',
    fontSize: '0.82em',
    textTransform: 'uppercase',
  };

  const footerStyle: React.CSSProperties = {
    padding: '12px 20px 16px',
    borderTop: '1px solid #111d2a',
  };

  const newBtnStyle: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    border: '1px solid #1a3a2a',
    color: '#00c853',
    fontFamily: 'inherit',
    fontSize: '0.82em',
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    padding: '10px 16px',
    cursor: 'pointer',
    borderRadius: 4,
    transition: 'background 0.15s, border-color 0.15s, color 0.15s',
  };

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <span style={titleStyle}>Saved Entities</span>
          <button
            style={closeBtnStyle}
            onClick={onClose}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#00d4ff';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#00d4ff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#3a5a6a';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#1a2a3a';
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* User list */}
        <div style={bodyStyle}>
          {users.length === 0 ? (
            <div style={emptyStyle}>No entities found</div>
          ) : (
            users.map((entry) => {
              const isCurrent = entry.username === currentUsername;
              return (
                <UserRow
                  key={entry.username}
                  entry={entry}
                  isCurrent={isCurrent}
                  onSwitch={onSwitch}
                />
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <button
            style={newBtnStyle}
            onClick={onNew}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,200,83,0.08)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#00c853';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#1a3a2a';
            }}
          >
            + New Entity
          </button>
        </div>
      </div>
    </div>
  );
}

interface UserRowProps {
  entry: UserEntry;
  isCurrent: boolean;
  onSwitch: (username: string) => void;
}

function UserRow({ entry, isCurrent, onSwitch }: UserRowProps) {
  const [hovered, setHovered] = useState(false);

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 20px',
    borderBottom: '1px solid #0a1520',
    background: isCurrent
      ? 'rgba(0, 212, 255, 0.05)'
      : hovered
      ? 'rgba(255,255,255,0.02)'
      : 'transparent',
    boxShadow: isCurrent ? 'inset 3px 0 0 #00d4ff' : undefined,
    transition: 'background 0.12s',
  };

  const usernameStyle: React.CSSProperties = {
    flex: 1,
    color: isCurrent ? '#00d4ff' : '#7a9aaa',
    fontWeight: isCurrent ? 700 : 400,
    fontSize: '0.88em',
    letterSpacing: '0.06em',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const scoreStyle: React.CSSProperties = {
    color: isCurrent ? '#00d4ff' : '#3a5a6a',
    fontSize: '0.8em',
    letterSpacing: '0.04em',
    fontVariantNumeric: 'tabular-nums',
    minWidth: 52,
    textAlign: 'right',
    flexShrink: 0,
  };

  const currentLabelStyle: React.CSSProperties = {
    fontSize: '0.7em',
    color: '#00d4ff',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    border: '1px solid rgba(0,212,255,0.3)',
    borderRadius: 3,
    padding: '2px 7px',
    flexShrink: 0,
  };

  const loadBtnStyle: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid #1a2a3a',
    color: '#3a5a6a',
    fontFamily: 'inherit',
    fontSize: '0.72em',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    padding: '4px 10px',
    cursor: 'pointer',
    borderRadius: 3,
    transition: 'color 0.15s, border-color 0.15s',
    flexShrink: 0,
  };

  return (
    <div
      style={rowStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Username */}
      <span style={usernameStyle} title={entry.username}>
        {entry.username}
      </span>

      {/* Stage badge */}
      {entry.stage && (
        <StageBadge stage={entry.stage} size="sm" />
      )}

      {/* Care score */}
      <span style={scoreStyle}>
        {entry.careScore !== null ? entry.careScore.toLocaleString() : '—'}
      </span>

      {/* Current indicator or Load button */}
      {isCurrent ? (
        <span style={currentLabelStyle}>Active</span>
      ) : (
        <button
          style={loadBtnStyle}
          onClick={() => onSwitch(entry.username)}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#00d4ff';
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#00d4ff';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#3a5a6a';
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#1a2a3a';
          }}
        >
          Load
        </button>
      )}
    </div>
  );
}
