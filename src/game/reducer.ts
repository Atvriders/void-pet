import type { PetState, Action, Stage } from './types';

// ── Decay rates per second ─────────────────────────────────────────────────
const DECAY = {
  signal:    0.008,
  coherence: 0.005,
  heat:     -0.003,  // natural cooling
  power:     0.002,
};

const SLEEP_RATES = {
  signal:    0.005,
  coherence: 0.003,
  heat:     -0.007, // faster cooling
  power:    -0.010, // restores power (negative = gain)
};

// ── Evolution thresholds [minAge (min), minAvgStats] ─────────────────────
const EVO: Record<string, [number, number, number]> = {
  //               minAge  minAvg  minCare
  seed:    [15,   50,  0],
  sprite:  [60,   55, 50],
  entity:  [180,  60, 200],
  apex:    [480,  65, 500],
};

const STAGE_ORDER: Stage[] = ['seed','sprite','entity','apex','ascendant','corrupted'];

function nextStage(s: Stage): Stage | null {
  const i = STAGE_ORDER.indexOf(s);
  if (i < 0 || i >= 4) return null;
  return STAGE_ORDER[i + 1] as Stage;
}

function clamp(v: number): number { return Math.max(0, Math.min(100, v)); }

function addLog(log: string[], msg: string): string[] {
  const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return [`[${ts}] ${msg}`, ...log].slice(0, 30);
}

export const INITIAL_STATE: PetState = {
  stage:     'seed',
  name:      'ENTITY_01',
  signal:    80,
  coherence: 80,
  heat:      10,
  power:     90,
  age:       0,
  sleeping:  false,
  careScore: 0,
  ascensions: 0,
  corruptTicks:  0,
  recoverNeeded: 0,
  coolSimulate:  0,
  coolDefrag:    0,
  coolOverclock: 0,
  lastTick:  Date.now(),
  log:       [],
};

export function reducer(state: PetState, action: Action): PetState {
  const now = Date.now();

  switch (action.type) {

    case 'TICK': {
      if (state.stage === 'corrupted' && state.recoverNeeded > 0) return state;
      if (!Number.isFinite(action.now)) return state; // guard against NaN/Infinity

      const elapsed = Math.min((action.now - state.lastTick) / 1000, 300); // cap at 5min per tick
      if (elapsed <= 0) return { ...state, lastTick: action.now };

      let { signal, coherence, heat, power, age, careScore, corruptTicks } = state;
      const rates = state.sleeping ? SLEEP_RATES : DECAY;

      // Stat decay
      signal    = clamp(signal    - rates.signal    * elapsed);
      coherence = clamp(coherence - rates.coherence * elapsed);
      heat      = clamp(heat      + rates.heat      * elapsed); // natural cooling
      power     = clamp(power     - rates.power     * elapsed);

      // Heat penalty: high heat accelerates coherence/power decay
      if (heat > 80) {
        coherence = clamp(coherence - 0.010 * elapsed);
        power     = clamp(power     - 0.005 * elapsed);
      }

      // Low signal accelerates coherence decay
      if (signal < 20) coherence = clamp(coherence - 0.008 * elapsed);

      age       += elapsed / 60; // convert to minutes
      const careGain = (signal > 60 ? 1 : 0) + (coherence > 60 ? 1 : 0) +
                       (heat < 40   ? 1 : 0) + (power > 40    ? 1 : 0);
      careScore += careGain * (elapsed / 60); // accumulate scaled to per-minute

      // Corruption check — accumulate elapsed seconds in critical state (not raw tick count)
      const critical = signal < 5 && coherence < 5 && heat > 85;
      corruptTicks = critical ? corruptTicks + elapsed : 0;

      let log = state.log;
      let newStage = state.stage;

      if (corruptTicks >= 20 && state.stage !== 'corrupted') {
        newStage = 'corrupted';
        state = { ...state, recoverNeeded: 5 };
        log = addLog(log, '⚠ CRITICAL FAILURE — entity fragmenting. Run DEFRAG ×5 to recover.');
      }

      // Evolution check (only if not corrupted or sleeping)
      if (newStage !== 'corrupted' && !state.sleeping) {
        const thresholds = EVO[state.stage as keyof typeof EVO];
        if (thresholds) {
          const [minAge, minAvg, minCare] = thresholds;
          const avg = (signal + coherence + (100 - heat) + power) / 4;
          if (age >= minAge && avg >= minAvg && careScore >= minCare) {
            const next = nextStage(state.stage);
            if (next) {
              newStage = next;
              const labels: Record<string, string> = {
                sprite: 'Morphology expanding — SPRITE form achieved.',
                entity: 'Consciousness threshold crossed — ENTITY form achieved.',
                apex:   'Upper bound approached — APEX form achieved.',
                ascendant: '⬡ ASCENDANT. The void has been transcended.',
              };
              log = addLog(log, labels[next] ?? `Evolved to ${next.toUpperCase()}`);
              if (next === 'ascendant') {
                return { ...state, stage: newStage, signal, coherence, heat, power,
                  age, careScore, corruptTicks, lastTick: action.now, log,
                  ascensions: state.ascensions + 1 };
              }
            }
          }
        }
      }

      return {
        ...state, stage: newStage, signal, coherence, heat, power,
        age, careScore, corruptTicks, lastTick: action.now, log,
      };
    }

    case 'INJECT': {
      if (state.sleeping || state.stage === 'corrupted') return state;
      return {
        ...state,
        signal:    clamp(state.signal + 22),
        heat:      clamp(state.heat   + 4),
        log: addLog(state.log, 'Data packet injected.'),
      };
    }

    case 'SIMULATE': {
      if (state.sleeping || state.stage === 'corrupted') return state;
      if (now < state.coolSimulate) return state;
      if (state.power < 15) return state;
      return {
        ...state,
        coherence:    clamp(state.coherence + 25),
        heat:         clamp(state.heat      + 18),
        power:        clamp(state.power     - 15),
        coolSimulate: now + 30_000,
        log: addLog(state.log, 'Simulation run. Coherence restored.'),
      };
    }

    case 'DEFRAG': {
      if (state.sleeping) return state;
      if (now < state.coolDefrag) return state;
      let newState = {
        ...state,
        heat:      clamp(state.heat      - 32),
        coherence: clamp(state.coherence + 8),
        coolDefrag: now + 60_000,
        log: addLog(state.log, 'Defrag complete. Thermal load reduced.'),
      };
      // Recovery from corruption
      if (state.stage === 'corrupted' && state.recoverNeeded > 0) {
        const left = state.recoverNeeded - 1;
        newState = {
          ...newState, recoverNeeded: left,
          log: addLog(newState.log, left === 0
            ? 'Recovery complete. Entity restored.'
            : `Recovery in progress — ${left} defrag(s) remaining.`),
        };
        if (left === 0) {
          newState = { ...newState, stage: 'seed', signal: 40, coherence: 40, heat: 50,
            power: 40, corruptTicks: 0, sleeping: false };
        }
      }
      return newState;
    }

    case 'HIBERNATE':
      if (state.stage === 'corrupted' && state.recoverNeeded > 0) return state;
      return {
        ...state,
        sleeping: !state.sleeping,
        log: addLog(state.log, state.sleeping ? 'Waking from hibernation.' : 'Entering hibernation mode.'),
      };

    case 'OVERCLOCK': {
      if (state.sleeping || state.stage === 'corrupted') return state;
      if (now < state.coolOverclock) return state;
      if (state.power < 25) return state;
      // Random risk: 20% chance of extra heat surge
      const surge = Math.random() < 0.20;
      return {
        ...state,
        coherence:    clamp(state.coherence + 40),
        heat:         clamp(state.heat + (surge ? 60 : 35)),
        power:        clamp(state.power - 25),
        coolOverclock: now + 120_000,
        log: addLog(state.log, surge
          ? '⚡ Overclock complete — THERMAL SURGE detected!'
          : 'Overclock complete. Peak performance achieved.'),
      };
    }

    case 'RENAME':
      return { ...state, name: action.name.slice(0, 16).toUpperCase() };

    case 'RESET':
      return { ...INITIAL_STATE, lastTick: Date.now() };

    case 'LOAD':
      return { ...INITIAL_STATE, ...action.state, lastTick: Date.now() };

    default:
      return state;
  }
}
