import type { PetState, LeaderboardEntry } from './types';

const USERNAME_KEY = 'void_username';
const LEADERBOARD_KEY = 'void_leaderboard';

function petKey(username: string): string {
  return `void_pet_${username}`;
}

// Username

export function getStoredUsername(): string | null {
  try {
    return localStorage.getItem(USERNAME_KEY);
  } catch {
    return null;
  }
}

export function setStoredUsername(username: string): void {
  try {
    localStorage.setItem(USERNAME_KEY, username);
  } catch {}
}

// Pet save/load

export function savePet(username: string, state: PetState): void {
  try {
    localStorage.setItem(petKey(username), JSON.stringify(state));
  } catch {}
}

export function loadPet(username: string): PetState | null {
  try {
    const raw = localStorage.getItem(petKey(username));
    if (!raw) return null;
    return JSON.parse(raw) as PetState;
  } catch {
    return null;
  }
}

export function deletePet(username: string): void {
  try {
    localStorage.removeItem(petKey(username));
  } catch {}
}

// Leaderboard

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

/** Only updates the leaderboard entry if the new score is strictly higher than
 *  the existing entry for this username. This prevents every-tick writes from
 *  clobbering a peak score with a lower current value, and avoids redundant
 *  leaderboard rewrites when nothing meaningful has changed. */
export function submitScore(entry: LeaderboardEntry): void {
  try {
    const board = getLeaderboard();
    const existing = board.find((e) => e.username === entry.username);
    if (existing && existing.careScore >= entry.careScore) return; // never downgrade
    const updated = board.filter((e) => e.username !== entry.username);
    updated.push(entry);
    updated.sort((a, b) => b.careScore - a.careScore);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated.slice(0, 50)));
  } catch {}
}

/** Removes a username's entry from the leaderboard entirely (used on abandon). */
export function removeScore(username: string): void {
  try {
    const board = getLeaderboard().filter((e) => e.username !== username);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(board));
  } catch {}
}
