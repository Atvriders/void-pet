import type { PetState, Action } from '../game/types';

interface Props {
  pet: PetState;
  now: number;
  dispatch: (a: Action) => void;
}

interface Btn {
  label:   string;
  icon:    string;
  action:  Action;
  tooltip: string;
  ready:   (p: PetState, now: number) => boolean;
}

const ACTIONS: Btn[] = [
  {
    label: 'INJECT',
    icon:  '⬡',
    action: { type: 'INJECT' },
    tooltip: 'Feed data packet. +Signal, +Heat.',
    ready: (p) => !p.sleeping && p.stage !== 'corrupted',
  },
  {
    label: 'SIMULATE',
    icon:  '◈',
    action: { type: 'SIMULATE' },
    tooltip: '+Coherence, +Heat, -Power. 30s cooldown.',
    ready: (p, now) => !p.sleeping && p.stage !== 'corrupted'
                    && now >= p.coolSimulate && p.power >= 15,
  },
  {
    label: 'DEFRAG',
    icon:  '⟳',
    action: { type: 'DEFRAG' },
    tooltip: '-Heat, +Coherence. Required to recover from corruption. 60s cooldown.',
    ready: (p, now) => !p.sleeping && now >= p.coolDefrag,
  },
  {
    label: 'HIBERNATE',
    icon:  '⏾',
    action: { type: 'HIBERNATE' },
    tooltip: 'Toggle sleep. Restores Power, cools Heat, pauses play.',
    ready: (p) => p.stage !== 'corrupted' || p.recoverNeeded === 0,
  },
  {
    label: 'OVERCLOCK',
    icon:  '⚡',
    action: { type: 'OVERCLOCK' },
    tooltip: 'Max coherence boost — high heat risk. 20% chance of thermal surge. 120s cooldown.',
    ready: (p, now) => !p.sleeping && p.stage !== 'corrupted'
                    && now >= p.coolOverclock && p.power >= 25,
  },
];

function coolLabel(expires: number, now: number): string {
  const s = Math.ceil((expires - now) / 1000);
  return s > 0 ? `${s}s` : '';
}

export default function ActionBar({ pet, now, dispatch }: Props) {
  return (
    <div className="action-bar">
      {ACTIONS.map(btn => {
        const ok = btn.ready(pet, now);
        const coolExpiry = btn.action.type === 'SIMULATE'  ? pet.coolSimulate
                         : btn.action.type === 'DEFRAG'    ? pet.coolDefrag
                         : btn.action.type === 'OVERCLOCK' ? pet.coolOverclock
                         : 0;
        const cool = coolLabel(coolExpiry, now);
        const isSleeping = btn.action.type === 'HIBERNATE' && pet.sleeping;

        return (
          <button
            key={btn.label}
            className={`action-btn${ok ? '' : ' disabled'}${isSleeping ? ' active' : ''}`}
            title={btn.tooltip}
            onClick={() => ok && dispatch(btn.action)}
          >
            <span className="action-icon">{btn.icon}</span>
            <span className="action-label">{btn.label}</span>
            {cool && <span className="action-cool">{cool}</span>}
          </button>
        );
      })}
    </div>
  );
}
