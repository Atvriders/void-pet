import type { PetState, Action } from '../game/types';

interface Props {
  pet: PetState;
  now: number;
  dispatch: (a: Action) => void;
}

interface Btn {
  label:    string;
  subLabel: string;
  icon:     string;
  action:   Action;
  tooltip:  string;
  ready:    (p: PetState, now: number) => boolean;
}

const ACTIONS: Btn[] = [
  {
    label:    'INJECT',
    subLabel: 'feed',
    icon:     '⬡',
    action:   { type: 'INJECT' },
    tooltip:  'Feed data packet. +Signal, +Heat.',
    ready:    (p) => !p.sleeping && p.stage !== 'corrupted',
  },
  {
    label:    'SIMULATE',
    subLabel: 'play',
    icon:     '◈',
    action:   { type: 'SIMULATE' },
    tooltip:  '+Coherence, +Heat, -Power. 30s cooldown.',
    ready:    (p, now) => !p.sleeping && p.stage !== 'corrupted'
                       && now >= p.coolSimulate && p.power >= 15,
  },
  {
    label:    'DEFRAG',
    subLabel: 'water',
    icon:     '⟳',
    action:   { type: 'DEFRAG' },
    tooltip:  '-Heat, +Coherence. Required to recover from corruption. 60s cooldown.',
    ready:    (p, now) => !p.sleeping && now >= p.coolDefrag,
  },
  {
    label:    'HIBERNATE',
    subLabel: 'sleep',
    icon:     '⏾',
    action:   { type: 'HIBERNATE' },
    tooltip:  'Toggle sleep. Restores Power, cools Heat; slows (not pauses) stat decay.',
    ready:    (p) => p.stage !== 'corrupted',
  },
  {
    label:    'OVERCLOCK',
    subLabel: 'pet',
    icon:     '⚡',
    action:   { type: 'OVERCLOCK' },
    tooltip:  'Max coherence boost — high heat risk. 20% chance of thermal surge. 120s cooldown.',
    ready:    (p, now) => !p.sleeping && p.stage !== 'corrupted'
                       && now >= p.coolOverclock && p.power >= 25,
  },
];

function coolLabel(expires: number, now: number): string {
  const s = Math.ceil((expires - now) / 1000);
  return s > 0 ? `${s}s` : '';
}

export default function ActionBar({ pet, now, dispatch }: Props) {
  return (
    <>
      <style>{`
        .action-bar {
          display: flex;
          flex-direction: row;
          justify-content: center;
          gap: 8px;
          padding: 8px 4px;
          flex-wrap: wrap;
        }

        .action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          background: #0b0f1e;
          border: 1px solid #1a2240;
          color: #8ab4f8;
          cursor: pointer;
          padding: 8px 12px;
          min-width: 72px;
          min-height: 60px;
          border-radius: 4px;
          transition: border-color 0.2s, box-shadow 0.2s, opacity 0.2s;
          position: relative;
          font-family: inherit;
        }

        .action-btn:not(.disabled):hover {
          border-color: #3a6cc0;
          box-shadow: 0 0 8px #1a3a7a, 0 0 16px #0a1a3a;
        }

        .action-btn.active {
          border-color: #3a7fd4;
          box-shadow: 0 0 6px #1a4a8a;
        }

        .action-btn.disabled {
          opacity: 0.38;
          cursor: not-allowed;
        }

        .action-icon {
          font-size: 18px;
          line-height: 1;
        }

        .action-label {
          font-size: 12px;
          letter-spacing: 0.12em;
          font-weight: 600;
          color: #8ab4f8;
          line-height: 1;
        }

        .action-sublabel {
          font-size: 12px;
          letter-spacing: 0.08em;
          color: #4a6090;
          font-style: italic;
          line-height: 1;
        }

        .action-cool {
          position: absolute;
          top: 3px;
          right: 5px;
          font-size: 11px;
          color: #f87171;
          letter-spacing: 0.04em;
          line-height: 1;
        }

        @media (max-width: 599px) {
          .action-bar {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: auto auto;
            gap: 6px;
            padding: 6px;
          }

          /* Center the 2-button bottom row by spanning cols 1-2 and 2-3 */
          .action-bar .action-btn:nth-child(4) {
            grid-column: 1 / 2;
            justify-self: stretch;
          }

          .action-bar .action-btn:nth-child(5) {
            grid-column: 2 / 3;
            justify-self: stretch;
          }

          .action-btn {
            min-height: 64px;
            min-width: 80px;
            width: 100%;
          }
        }
      `}</style>

      <div className="action-bar">
        {ACTIONS.map(btn => {
          const ok = btn.ready(pet, now);
          const coolExpiry = btn.action.type === 'SIMULATE'  ? pet.coolSimulate
                           : btn.action.type === 'DEFRAG'    ? pet.coolDefrag
                           : btn.action.type === 'OVERCLOCK' ? pet.coolOverclock
                           : 0;
          const cool      = coolLabel(coolExpiry, now);
          const isSleeping = btn.action.type === 'HIBERNATE' && pet.sleeping;
          const subLabel  = btn.action.type === 'HIBERNATE' && pet.sleeping
                              ? 'wake'
                              : btn.subLabel;

          const isHibernate = btn.action.type === 'HIBERNATE';

          return (
            <button
              key={btn.label}
              className={`action-btn${ok ? '' : ' disabled'}${isSleeping ? ' active' : ''}`}
              title={btn.tooltip}
              disabled={!ok}
              aria-disabled={!ok}
              aria-pressed={isHibernate ? isSleeping : undefined}
              onClick={() => ok && dispatch(btn.action)}
            >
              {cool && (
                <span className="action-cool" aria-live="polite" aria-atomic="true">
                  {cool}
                </span>
              )}
              <span className="action-icon" aria-hidden="true">{btn.icon}</span>
              <span className="action-label">{btn.label}</span>
              <span className="action-sublabel" aria-hidden="true">{subLabel}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
