import React, { useEffect, useRef, useState } from 'react';

interface Props {
  active: boolean;
}

interface ZParticle {
  id: number;
  x: number;
  y: number;
  fontSize: number;
}

const STYLE_ID = 'sleeping-z-keyframes';

function injectKeyframes() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes sleepingZFloat {
      0% {
        transform: translateY(0px);
        opacity: 1;
      }
      100% {
        transform: translateY(-120px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

let nextId = 0;

const SleepingZAnimation: React.FC<Props> = ({ active }) => {
  const [particles, setParticles] = useState<ZParticle[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    injectKeyframes();
  }, []);

  useEffect(() => {
    if (active) {
      const spawnParticle = () => {
        const particle: ZParticle = {
          id: nextId++,
          x: Math.floor(Math.random() * 200) + 40, // 40–240
          y: 200,
          fontSize: Math.floor(Math.random() * 9) + 14, // 14–22
        };
        setParticles(prev => [...prev, particle]);

        // Remove particle after animation completes
        setTimeout(() => {
          setParticles(prev => prev.filter(p => p.id !== particle.id));
        }, 2500);
      };

      spawnParticle(); // spawn one immediately
      intervalRef.current = setInterval(spawnParticle, 800);
    } else {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setParticles([]);
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [active]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '480px',
        height: '480px',
        pointerEvents: 'none',
        zIndex: 10,
        overflow: 'hidden',
      }}
    >
      {particles.map(particle => (
        <span
          key={particle.id}
          style={{
            position: 'absolute',
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            fontSize: `${particle.fontSize}px`,
            fontFamily: 'monospace',
            fontWeight: 700,
            color: '#4060a0',
            animation: 'sleepingZFloat 2.5s ease-out forwards',
            userSelect: 'none',
          }}
        >
          Z
        </span>
      ))}
    </div>
  );
};

export default SleepingZAnimation;
