import type { PetState, LeaderboardEntry } from './types';

const USERNAME_KEY = 'void_username';

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

// Pet save/load (server API)

export async function loadPetFromServer(username: string): Promise<PetState | null> {
  try {
    const res = await fetch(`/api/pet/${encodeURIComponent(username)}`);
    if (!res.ok) return null;
    return (await res.json()) as PetState;
  } catch {
    return null;
  }
}

export function savePetToServer(username: string, state: PetState): void {
  fetch(`/api/pet/${encodeURIComponent(username)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  }).catch(() => {});
}

export function deletePetFromServer(username: string): void {
  fetch(`/api/pet/${encodeURIComponent(username)}`, {
    method: 'DELETE',
  }).catch(() => {});
}

// Leaderboard (server API)

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch('/api/leaderboard');
    if (!res.ok) return [];
    return (await res.json()) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export function submitScoreToServer(entry: LeaderboardEntry): void {
  fetch('/api/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  }).catch(() => {});
}

export function removeScoreFromServer(username: string): void {
  fetch(`/api/scores/${encodeURIComponent(username)}`, {
    method: 'DELETE',
  }).catch(() => {});
}
