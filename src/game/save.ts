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

export function listUsers(): string[] {
  try {
    const users: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('void_pet_')) {
        users.push(key.slice('void_pet_'.length));
      }
    }
    return users;
  } catch {
    return [];
  }
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

export function submitScore(entry: LeaderboardEntry): void {
  try {
    let board = getLeaderboard();
    board = board.filter((e) => e.username !== entry.username);
    board.push(entry);
    board.sort((a, b) => b.careScore - a.careScore);
    board = board.slice(0, 50);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(board));
  } catch {}
}

export function clearLeaderboard(): void {
  try {
    localStorage.removeItem(LEADERBOARD_KEY);
  } catch {}
}
