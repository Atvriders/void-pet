import { useState, useEffect } from 'react';

/**
 * Returns a Date.now() value that updates every second.
 */
export function useNow(): number {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return now;
}
