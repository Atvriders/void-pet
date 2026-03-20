import { useRef, useEffect } from 'react';
import type { PetState, Mood } from '../game/types';
import { MOOD_HUE } from '../game/mood';

interface Props { pet: PetState; mood: Mood; }

const BUFFER_SIZE = 150;

type Sample = { signal: number; coherence: number; heat: number; power: number };

const TRACES: { key: keyof Sample; label: string; color: string }[] = [
  { key: 'signal',    label: 'SIG', color: '#00d4ff' },
  { key: 'coherence', label: 'COH', color: '#a78bfa' },
  { key: 'heat',      label: 'HT',  color: '#f97316' },
  { key: 'power',     label: 'PWR', color: '#22d3a0' },
];

export default function WaveformMonitor({ pet, mood }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufRef    = useRef<Sample[]>([]);
  const rafRef    = useRef<number>(0);
  const hue       = MOOD_HUE[mood];

  // Push a new sample whenever the pet ticks
  useEffect(() => {
    bufRef.current.push({
      signal:    pet.signal,
      coherence: pet.coherence,
      heat:      pet.heat,
      power:     pet.power,
    });
    if (bufRef.current.length > BUFFER_SIZE) {
      bufRef.current = bufRef.current.slice(bufRef.current.length - BUFFER_SIZE);
    }
  }, [pet.lastTick]); // eslint-disable-line react-hooks/exhaustive-deps

  // RAF draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const H            = 200;
    const LEFT_MARGIN  = 48;
    const RIGHT_MARGIN = 52;
    const TOP          = 20;
    const BOTTOM       = 12;

    function draw(t: number) {
      const ctx = canvas!.getContext('2d');
      if (!ctx) return;

      const dpr  = window.devicePixelRatio || 1;
      const rect = canvas!.getBoundingClientRect();
      const W    = rect.width;

      // Resize canvas if needed
      if (canvas!.width !== Math.round(W * dpr) || canvas!.height !== Math.round(H * dpr)) {
        canvas!.width  = Math.round(W * dpr);
        canvas!.height = Math.round(H * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Background
      ctx.fillStyle = '#020507';
      ctx.fillRect(0, 0, W, H);

      // Subtle hex-grid-like dots
      ctx.fillStyle = `hsla(${hue}, 80%, 50%, 0.07)`;
      for (let gx = 0; gx < W; gx += 24) {
        for (let gy = 0; gy < H; gy += 24) {
          ctx.fillRect(gx, gy, 1, 1);
        }
      }

      // Horizontal dashed grid lines at 25, 50, 75%
      ctx.strokeStyle = `hsla(${hue}, 60%, 50%, 0.15)`;
      ctx.lineWidth   = 1;
      ctx.setLineDash([3, 8]);
      for (const pct of [0.25, 0.5, 0.75]) {
        const y = TOP + (H - TOP - BOTTOM) * (1 - pct);
        ctx.beginPath();
        ctx.moveTo(LEFT_MARGIN, y);
        ctx.lineTo(W - RIGHT_MARGIN, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Header text
      ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.6)`;
      ctx.font      = '11px "Share Tech Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('◈ SIGNAL MONITOR', LEFT_MARGIN + 4, 13);

      // Timestamp / buffer status bottom-left
      const buf = bufRef.current;
      ctx.fillStyle = 'rgba(100,140,160,0.4)';
      ctx.font      = '10px "Share Tech Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`BUFFER: ${buf.length}/${BUFFER_SIZE} SAMPLES`, LEFT_MARGIN + 4, H - 3);

      // Left axis labels at 25, 50, 75
      ctx.fillStyle = 'rgba(100,140,160,0.5)';
      ctx.font      = '9px "Share Tech Mono", monospace';
      ctx.textAlign = 'right';
      for (const pct of [0.25, 0.5, 0.75]) {
        const y     = TOP + (H - TOP - BOTTOM) * (1 - pct);
        const label = String(Math.round(pct * 100));
        ctx.fillText(label, LEFT_MARGIN - 4, y + 3);
      }

      // Traces
      if (buf.length > 1) {
        const drawWidth = W - LEFT_MARGIN - RIGHT_MARGIN;
        const drawHeight = H - TOP - BOTTOM;

        for (const trace of TRACES) {
          ctx.save();
          ctx.strokeStyle = trace.color;
          ctx.lineWidth   = 1.5;
          ctx.globalAlpha = 0.8;
          ctx.beginPath();

          for (let i = 0; i < buf.length; i++) {
            const x = LEFT_MARGIN + (i / (buf.length - 1)) * drawWidth;
            const v = buf[i][trace.key];
            const y = TOP + drawHeight * (1 - v / 100);
            if (i === 0) ctx.moveTo(x, y);
            else         ctx.lineTo(x, y);
          }
          ctx.stroke();

          // Dot at rightmost (current) point
          const lastVal = buf[buf.length - 1][trace.key];
          const dotX    = LEFT_MARGIN + drawWidth;
          const dotY    = TOP + drawHeight * (1 - lastVal / 100);
          ctx.beginPath();
          ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
          ctx.fillStyle   = trace.color;
          ctx.globalAlpha = 1;
          ctx.fill();

          // Right margin label: e.g. "SIG 87"
          ctx.fillStyle   = trace.color;
          ctx.globalAlpha = 0.9;
          ctx.font        = '10px "Share Tech Mono", monospace';
          ctx.textAlign   = 'left';
          ctx.fillText(`${trace.label} ${Math.round(lastVal)}`, dotX + 6, dotY + 3);

          ctx.restore();
        }
      }

      // Animated vertical scan line
      const plotWidth = W - LEFT_MARGIN - RIGHT_MARGIN;
      const scanX     = LEFT_MARGIN + ((t * 0.015) % plotWidth);
      ctx.save();
      ctx.strokeStyle = `hsla(${hue}, 100%, 70%, 0.06)`;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.moveTo(scanX, TOP);
      ctx.lineTo(scanX, H - BOTTOM);
      ctx.stroke();
      ctx.restore();

      ctx.restore();

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [mood, hue]);

  return (
    <div
      style={{
        background:   '#020507',
        border:       '1px solid #1a2240',
        borderRadius: 12,
        overflow:     'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: 200 }}
      />
    </div>
  );
}
