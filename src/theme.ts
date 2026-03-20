import React from 'react';

// Color tokens
export const colors = {
  bg: '#040812',
  surface: '#080d1a',
  surf2: '#0d1428',
  surf3: '#111c35',
  border: '#1a2845',
  border2: '#243560',
  text: '#ccd9f0',
  muted: '#4a6090',
  muted2: '#2a3c60',
  accent: '#00d4ff',
  accent2: '#0099cc',
  purple: '#a78bfa',
  green: '#22d3a0',
  red: '#ff4444',
  gold: '#fbbf24',
  orange: '#f97316',
} as const;

// Stage colors
export const stageColors: Record<string, string> = {
  seed: '#00d4ff',
  sprite: '#4d9fff',
  entity: '#a78bfa',
  apex: '#fbbf24',
  ascendant: '#ffffff',
  corrupted: '#ff4444',
};

// Mood accent colors
export const moodColors: Record<string, string> = {
  happy: '#00ffee',
  neutral: '#00aacc',
  sad: '#9060d0',
  tired: '#4060a0',
  hungry: '#ff8800',
  sleeping: '#4060a0',
  overheating: '#ff3030',
  corrupted: '#ff2020',
};

// Shared style helpers
export const cardStyle: React.CSSProperties = {
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  padding: '12px 14px',
};

export const monoFont = "'Share Tech Mono', monospace";

export const glowStyle = (color: string): React.CSSProperties => ({
  boxShadow: `0 0 12px ${color}44, 0 0 24px ${color}22`,
});

// Formatters
export function formatAge(minutes: number): string {
  if (minutes < 60) {
    return `${Math.floor(minutes)}m`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const remainingMinutes = Math.floor(minutes % 60);
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

export function formatCooldown(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  return `${seconds}s`;
}
