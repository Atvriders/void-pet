import { useState, useEffect } from 'react';

/**
 * Returns remaining cooldown seconds (0 if expired).
 * Updates every second while active.
 */
export function useCooldown(expiresAt: number): number {
  const [remaining, setRemaining] = useState<number>(
    Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
  );

  useEffect(() => {
    const calc = () => Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));

    setRemaining(calc());

    const current = calc();
    if (current <= 0) return;

    const interval = setInterval(() => {
      const next = calc();
      setRemaining(next);
      if (next <= 0) {
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return remaining;
}
