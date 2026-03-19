import type { PetState, Mood } from '../game/types';
import { MOOD_LABEL } from '../game/mood';

interface Props { pet: PetState; mood: Mood; now: number }

interface Bar {
  label: string;
  key:   keyof Pick<PetState, 'signal' | 'coherence' | 'heat' | 'power'>;
  color: string;
  invert?: boolean; // heat is bad when high
}

const BARS: Bar[] = [
  { label: 'SIGNAL',    key: 'signal',    color: '#00d4ff' },
  { label: 'COHERENCE', key: 'coherence', color: '#a78bfa' },
  { label: 'HEAT',      key: 'heat',      color: '#ff6030', invert: true },
  { label: 'POWER',     key: 'power',     color: '#22d3a0' },
];

function fmtAge(mins: number): string {
  if (mins < 60) return `${Math.floor(mins)}m`;
  const h = Math.floor(mins / 60);
  const m = Math.floor(mins % 60);
  return `${h}h ${m}m`;
}

export default function StatPanel({ pet, mood, now }: Props) {
  return (
    <div className="stat-panel">
      <div className="status-line" data-mood={mood}>{MOOD_LABEL[mood]}</div>

      <div className="stat-grid">
        {BARS.map(b => {
          const val = pet[b.key];
          const pct = b.invert ? val : val; // all 0-100
          const dangerClass = b.invert ? (val > 70 ? 'danger' : val > 50 ? 'warn' : '')
                                       : (val < 20 ? 'danger' : val < 40 ? 'warn' : '');
          return (
            <div key={b.key} className={`stat-row ${dangerClass}`}>
              <span className="stat-label">{b.label}</span>
              <div className="stat-bar-track">
                <div
                  className="stat-bar-fill"
                  style={{
                    width: `${pct}%`,
                    background: b.invert
                      ? `hsl(${120 - val * 1.2}, 100%, 50%)`
                      : b.color,
                    boxShadow: `0 0 8px ${b.color}60`,
                  }}
                />
              </div>
              <span className="stat-val">{Math.floor(val)}</span>
            </div>
          );
        })}
      </div>

      <div className="pet-meta">
        <span className="meta-item">STAGE <b>{pet.stage.toUpperCase()}</b></span>
        <span className="meta-item">AGE <b>{fmtAge(pet.age)}</b></span>
        <span className="meta-item">CARE <b>{Math.floor(pet.careScore)}</b></span>
        {pet.ascensions > 0 && <span className="meta-item">⬡ ×{pet.ascensions}</span>}
      </div>
    </div>
  );
}
