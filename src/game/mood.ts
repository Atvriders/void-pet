import type { PetState, Mood } from './types';

export function getMood(p: PetState): Mood {
  if (p.stage === 'corrupted') return 'corrupted';
  if (p.sleeping)              return 'sleeping';
  if (p.heat > 80)             return 'overheating';
  if (p.signal < 20)           return 'hungry';
  if (p.power < 15)            return 'tired';
  if (p.coherence > 70 && p.signal > 60 && p.heat < 40) return 'happy';
  if (p.coherence < 30)        return 'sad';
  return 'neutral';
}

// HSL hue for each mood — used by canvas creature
export const MOOD_HUE: Record<Mood, number> = {
  happy:      185,
  neutral:    210,
  sad:        270,
  tired:      230,
  hungry:     30,
  sleeping:   220,
  overheating: 0,
  corrupted:  350,
};

export const MOOD_LABEL: Record<Mood, string> = {
  happy:      'STABLE ◈ HARMONISED',
  neutral:    'NOMINAL',
  sad:        'COHERENCE DEGRADING',
  tired:      'LOW POWER',
  hungry:     'SIGNAL LOST',
  sleeping:   'HIBERNATING',
  overheating:'THERMAL OVERLOAD',
  corrupted:  '⚠ CORRUPTION DETECTED',
};
