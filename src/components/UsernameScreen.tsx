import React, { useState } from 'react';

interface Props {
  onSubmit: (username: string) => void;
}

const UsernameScreen: React.FC<Props> = ({ onSubmit }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const validate = (value: string): string => {
    const trimmed = value.trim();
    if (trimmed.length < 2) return 'Minimum 2 characters required.';
    if (trimmed.length > 16) return 'Maximum 16 characters allowed.';
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return 'Only letters, numbers, and underscores allowed.';
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw.length <= 16) {
      setUsername(raw);
      if (error) setError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(username);
    if (err) {
      setError(err);
      return;
    }
    onSubmit(username.trim().toUpperCase());
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

        @keyframes voidPulse {
          0%, 100% { text-shadow: 0 0 8px #00d4ff, 0 0 24px #00d4ff44; opacity: 1; }
          50% { text-shadow: 0 0 18px #00d4ff, 0 0 48px #00d4ff88, 0 0 72px #00d4ff33; opacity: 0.88; }
        }

        @keyframes gridScroll {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }

        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }

        .void-screen {
          font-family: 'Share Tech Mono', monospace;
          background-color: #050810;
          color: #c8d8f8;
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
        }

        .void-screen::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0, 212, 255, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.04) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: gridScroll 4s linear infinite;
          pointer-events: none;
          z-index: 0;
        }

        .void-screen::after {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, transparent, #00d4ff33, transparent);
          animation: scanline 6s linear infinite;
          pointer-events: none;
          z-index: 1;
        }

        .void-card {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 400px;
          padding: 24px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }

        .void-title {
          font-size: 4rem;
          font-weight: normal;
          letter-spacing: 0.4em;
          color: #00d4ff;
          margin: 0 0 8px 0;
          animation: voidPulse 3s ease-in-out infinite;
          user-select: none;
        }

        .void-subtitle {
          font-size: 0.78rem;
          color: #5a7a9a;
          letter-spacing: 0.12em;
          margin: 0 0 48px 0;
          text-align: center;
          text-transform: uppercase;
        }

        .void-label {
          width: 100%;
          font-size: 0.7rem;
          letter-spacing: 0.18em;
          color: #00d4ff;
          text-transform: uppercase;
          margin-bottom: 8px;
          text-align: left;
        }

        .void-input {
          width: 100%;
          background: #080d1a;
          border: 1px solid #1a2240;
          color: #c8d8f8;
          font-family: 'Share Tech Mono', monospace;
          font-size: 1.1rem;
          letter-spacing: 0.22em;
          padding: 12px 14px;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          text-transform: uppercase;
          caret-color: #00d4ff;
          margin-bottom: 0;
        }

        .void-input::placeholder {
          color: #1e2e4a;
          letter-spacing: 0.18em;
        }

        .void-input:focus {
          border-color: #00d4ff;
          box-shadow: 0 0 0 1px #00d4ff44, 0 0 18px #00d4ff22;
        }

        .void-input.has-error {
          border-color: #ff3366;
          box-shadow: 0 0 0 1px #ff336644;
        }

        .void-error {
          width: 100%;
          font-size: 0.68rem;
          color: #ff3366;
          letter-spacing: 0.1em;
          margin-top: 6px;
          min-height: 1em;
          text-align: left;
        }

        .void-hint {
          width: 100%;
          font-size: 0.64rem;
          color: #2e4060;
          letter-spacing: 0.06em;
          line-height: 1.6;
          margin-top: 14px;
          text-align: left;
        }

        .void-button {
          margin-top: 36px;
          width: 100%;
          background: transparent;
          border: 1px solid #00d4ff;
          color: #00d4ff;
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.88rem;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          padding: 14px 0;
          cursor: pointer;
          transition: background 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .void-button:hover {
          background: #00d4ff12;
          box-shadow: 0 0 18px #00d4ff44, inset 0 0 18px #00d4ff0a;
          color: #80eeff;
        }

        .void-button:active {
          background: #00d4ff22;
          box-shadow: 0 0 28px #00d4ff66, inset 0 0 24px #00d4ff18;
        }

        .void-divider {
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent, #1a2240, transparent);
          margin: 32px 0 0 0;
        }

        @media (max-width: 440px) {
          .void-card {
            padding: 24px 20px;
          }
          .void-title {
            font-size: 3rem;
          }
        }
      `}</style>

      <div className="void-screen">
        <div className="void-card">
          <h1 className="void-title">VOID</h1>
          <p className="void-subtitle">A sentient data entity awaits.</p>

          <form
            onSubmit={handleSubmit}
            style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
          >
            <label className="void-label" htmlFor="void-username-input">
              Designate User
            </label>

            <input
              id="void-username-input"
              className={`void-input${error ? ' has-error' : ''}`}
              type="text"
              value={username}
              onChange={handleChange}
              maxLength={16}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="USERNAME"
            />

            <div className="void-error" aria-live="polite">
              {error}
            </div>

            <p className="void-hint">
              Your username identifies your save. Use the same name on any device to continue your journey.
            </p>

            <div className="void-divider" />

            <button className="void-button" type="submit">
              Initialize
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default UsernameScreen;
