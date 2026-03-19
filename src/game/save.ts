import type { PetState } from './types';
import { INITIAL_STATE } from './reducer';

const KEY = 'void_pet_save';

export function save(state: PetState) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}

export function load(): PetState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...INITIAL_STATE, lastTick: Date.now() };
    return { ...INITIAL_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...INITIAL_STATE, lastTick: Date.now() };
  }
}
