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

export interface FaceExpression {
  eyeStyle: 'open' | 'closed' | 'wide' | 'squint' | 'x';
  mouthStyle: 'smile' | 'frown' | 'neutral' | 'wavy' | 'small-smile' | 'gasp';
  pupilOffset: { x: number; y: number };  // relative offset for pupil within eye
  eyeScale: number;  // multiplier on eye size (1.0 = normal)
  blinkRate: number; // seconds between blinks (0 = no blink)
}

export function getFaceExpression(mood: Mood): FaceExpression {
  switch (mood) {
    case 'happy':
      return { eyeStyle: 'wide',   mouthStyle: 'smile',       pupilOffset: { x: 0, y:  0 }, eyeScale: 1.10, blinkRate: 3 };
    case 'neutral':
      return { eyeStyle: 'open',   mouthStyle: 'neutral',     pupilOffset: { x: 0, y:  0 }, eyeScale: 1.00, blinkRate: 4 };
    case 'sad':
      return { eyeStyle: 'squint', mouthStyle: 'frown',       pupilOffset: { x: 0, y:  3 }, eyeScale: 0.85, blinkRate: 6 };
    case 'tired':
      return { eyeStyle: 'squint', mouthStyle: 'neutral',     pupilOffset: { x: 0, y:  2 }, eyeScale: 0.75, blinkRate: 2 };
    case 'hungry':
      return { eyeStyle: 'open',   mouthStyle: 'gasp',        pupilOffset: { x: 0, y: -2 }, eyeScale: 1.05, blinkRate: 5 };
    case 'sleeping':
      return { eyeStyle: 'closed', mouthStyle: 'small-smile', pupilOffset: { x: 0, y:  0 }, eyeScale: 1.00, blinkRate: 0 };
    case 'overheating':
      return { eyeStyle: 'wide',   mouthStyle: 'wavy',        pupilOffset: { x: 0, y: -3 }, eyeScale: 1.15, blinkRate: 8 };
    case 'corrupted':
      return { eyeStyle: 'x',      mouthStyle: 'wavy',        pupilOffset: { x: 0, y:  0 }, eyeScale: 1.00, blinkRate: 0 };
  }
}
