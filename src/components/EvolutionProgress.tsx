import type { PetState, Stage } from '../game/types';

interface Props {
  state: PetState;
}

// Evolution thresholds extracted from reducer.ts
// EVO[stage] = [minAge (minutes), minAvgStats, minCareScore]
const EVO: Record<string, [number, number, number]> = {
  seed:   [15,  50,   0],
  sprite: [60,  55,  50],
  entity: [180, 60, 200],
  apex:   [480, 65, 500],
};

// Stage progression order (stops at ascendant for normal evolution)
const STAGE_ORDER: Stage[] = ['seed', 'sprite', 'entity', 'apex', 'ascendant', 'corrupted'];

function nextEvolutionStage(current: Stage): Stage | null {
  const i = STAGE_ORDER.indexOf(current);
  // Only stages 0-3 (seed through apex) have a next evolution stage
  if (i < 0 || i >= 4) return null;
  return STAGE_ORDER[i + 1] as Stage;
}

// Badge colors from StageBadge.tsx
const STAGE_COLORS: Record<Stage, string> = {
  seed:      '#00d4ff',
  sprite:    '#4d9fff',
  entity:    '#a78bfa',
  apex:      '#fbbf24',
  ascendant: '#ffffff',
  corrupted: '#ff4444',
};

const STAGE_LABELS: Record<Stage, string> = {
  seed:      'SEED',
  sprite:    'SPRITE',
  entity:    'ENTITY',
  apex:      'APEX',
  ascendant: 'ASCENDANT',
  corrupted: 'CORRUPTED',
};

function formatMinutes(mins: number): string {
  if (mins < 60) return `${Math.round(mins)} min`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function EvolutionProgress({ state }: Props) {
  const { stage, signal, coherence, heat, power, age, careScore, recoverNeeded } = state;

  // ── Corrupted state ──────────────────────────────────────────────────────
  if (stage === 'corrupted') {
    return (
      <div
        style={{
          background: '#080d1a',
          padding: '10px 14px',
          borderRadius: 8,
          border: '1px solid #1a2845',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 11,
            color: '#ff4444',
            letterSpacing: '0.08em',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          <span style={{ fontWeight: 700 }}>CORRUPTED</span>
          {' — run '}
          <span style={{ color: '#ff8888' }}>DEFRAG</span>
          {' to recover'}
          {recoverNeeded > 0 && (
            <span style={{ color: '#ff6666' }}> ({recoverNeeded} remaining)</span>
          )}
        </div>
      </div>
    );
  }

  // ── Ascendant state ──────────────────────────────────────────────────────
  if (stage === 'ascendant') {
    return (
      <div
        style={{
          background: '#080d1a',
          padding: '10px 14px',
          borderRadius: 8,
          border: '1px solid #1a2845',
          width: '100%',
          boxSizing: 'border-box',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: '#ffffff',
            textShadow: '0 0 8px rgba(255,255,255,0.6)',
          }}
        >
          ⬡ READY TO ASCEND
        </span>
      </div>
    );
  }

  // ── Normal evolution progress ─────────────────────────────────────────────
  const next = nextEvolutionStage(stage);
  if (!next) return null;

  const thresholds = EVO[stage as keyof typeof EVO];
  if (!thresholds) return null;

  const [minAge, minAvg, minCare] = thresholds;

  // Average stat formula from reducer: (signal + coherence + (100 - heat) + power) / 4
  const avgStats = (signal + coherence + (100 - heat) + power) / 4;

  // Progress ratio toward each constraint (capped at 1.0)
  const ageProgress  = minAge  > 0 ? Math.min(age / minAge, 1)           : 1;
  const avgProgress  = minAvg  > 0 ? Math.min(avgStats / minAvg, 1)      : 1;
  const careProgress = minCare > 0 ? Math.min(careScore / minCare, 1)    : 1;

  // The limiting factor is the one with the lowest progress
  type Constraint = { label: string; progress: number; current: number; required: number; unit: string };
  const constraints: Constraint[] = [
    { label: 'Age',   progress: ageProgress,  current: age,       required: minAge,  unit: 'min' },
    { label: 'Stats', progress: avgProgress,  current: avgStats,  required: minAvg,  unit: ''    },
    { label: 'Care',  progress: careProgress, current: careScore, required: minCare, unit: ''    },
  ].filter(c => c.required > 0);

  // Sort ascending by progress — the first is the most-limiting
  constraints.sort((a, b) => a.progress - b.progress);
  const limiting = constraints[0];

  // Overall progress = the most-limiting constraint
  const overallProgress = limiting.progress;

  const targetColor = STAGE_COLORS[next];

  // Segmented bar: 20 segments
  const SEGMENTS = 20;
  const filledSegments = Math.round(overallProgress * SEGMENTS);

  // Constraint display text
  let constraintText = '';
  if (limiting.label === 'Age') {
    constraintText = `Age: ${formatMinutes(limiting.current)} / ${formatMinutes(limiting.required)}`;
  } else if (limiting.label === 'Stats') {
    constraintText = `Avg Stats: ${Math.floor(limiting.current)} / ${limiting.required}`;
  } else {
    constraintText = `Care: ${Math.floor(limiting.current)} / ${limiting.required}`;
  }

  return (
    <div
      style={{
        background: '#080d1a',
        padding: '10px 14px',
        borderRadius: 8,
        border: '1px solid #1a2845',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Label row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 10,
            color: '#4a5a7a',
            letterSpacing: '0.08em',
          }}
        >
          NEXT:
        </span>
        <span
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 10,
            color: targetColor,
            letterSpacing: '0.1em',
            fontWeight: 700,
            opacity: 0.85,
          }}
        >
          {STAGE_LABELS[next]}
        </span>
      </div>

      {/* Segmented progress bar */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          marginBottom: 5,
        }}
        role="progressbar"
        aria-valuenow={Math.round(overallProgress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Evolution progress toward ${STAGE_LABELS[next]}`}
      >
        {Array.from({ length: SEGMENTS }, (_, i) => {
          const filled = i < filledSegments;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 2,
                background: filled
                  ? targetColor
                  : 'rgba(255,255,255,0.07)',
                boxShadow: filled
                  ? `0 0 4px ${targetColor}55`
                  : 'none',
                transition: 'background 0.3s',
              }}
            />
          );
        })}
      </div>

      {/* Constraint text */}
      <div
        style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 10,
          color: '#3a4a6a',
          letterSpacing: '0.06em',
          textAlign: 'right',
        }}
      >
        {constraintText}
      </div>
    </div>
  );
}
