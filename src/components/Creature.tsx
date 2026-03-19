import { useEffect, useRef } from 'react';
import type { PetState, Mood, Stage } from '../game/types';
import { MOOD_HUE } from '../game/mood';

interface Props { pet: PetState; mood: Mood }

const TWO_PI = Math.PI * 2;
const CX = 160, CY = 160; // canvas centre

// ── Drawing helpers ────────────────────────────────────────────────────────

function orb(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, hue: number, bright: number) {
  // Outer glow
  const g = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 3);
  g.addColorStop(0,   `hsla(${hue}, 100%, 65%, ${0.35 * bright})`);
  g.addColorStop(0.5, `hsla(${hue}, 100%, 50%, ${0.12 * bright})`);
  g.addColorStop(1,   'transparent');
  ctx.beginPath(); ctx.arc(cx, cy, r * 3, 0, TWO_PI);
  ctx.fillStyle = g; ctx.fill();

  // Core sphere
  const c = ctx.createRadialGradient(cx - r * 0.28, cy - r * 0.32, 0, cx, cy, r);
  c.addColorStop(0,   `hsl(${hue + 20}, 60%, 95%)`);
  c.addColorStop(0.35,`hsl(${hue},      100%, 68%)`);
  c.addColorStop(1,   `hsl(${hue - 20}, 100%, 12%)`);
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TWO_PI);
  ctx.fillStyle = c; ctx.fill();
}

function ring(
  ctx: CanvasRenderingContext2D, cx: number, cy: number,
  rx: number, ry: number, tilt: number, hue: number, alpha: number, width = 1.5
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tilt);
  ctx.scale(1, ry / rx);
  ctx.beginPath(); ctx.ellipse(0, 0, rx, rx, 0, 0, TWO_PI);
  ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${alpha})`;
  ctx.lineWidth = width / (ry / rx);
  ctx.stroke();
  ctx.restore();
}

function particle(
  ctx: CanvasRenderingContext2D, cx: number, cy: number,
  orbitR: number, angle: number, hue: number, r = 3
) {
  const x = cx + Math.cos(angle) * orbitR;
  const y = cy + Math.sin(angle) * orbitR;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
  g.addColorStop(0,   `hsla(${hue}, 100%, 90%, 0.9)`);
  g.addColorStop(1,   'transparent');
  ctx.beginPath(); ctx.arc(x, y, r * 2.5, 0, TWO_PI);
  ctx.fillStyle = g; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI);
  ctx.fillStyle = `hsl(${hue}, 100%, 80%)`; ctx.fill();
}

function hexagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, hue: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TWO_PI - Math.PI / 6;
    i === 0 ? ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
            : ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.strokeStyle = `hsla(${hue}, 100%, 70%, 0.4)`;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function glitchSlices(ctx: CanvasRenderingContext2D, t: number, hue: number) {
  const n = 3;
  for (let i = 0; i < n; i++) {
    const seed = Math.sin(t * 0.003 + i * 2.7) * 0.5 + 0.5;
    if (seed < 0.6) continue;
    const y  = (seed * 320) | 0;
    const h  = (seed * 8 + 2) | 0;
    const dx = (Math.sin(t * 0.007 + i) * 20) | 0;
    const img = ctx.getImageData(0, y, 320, h);
    ctx.putImageData(img, dx, y);
  }
  ctx.fillStyle = `hsla(${hue}, 100%, 60%, 0.05)`;
  ctx.fillRect(0, 0, 320, 320);
}

// ── Stage drawers ──────────────────────────────────────────────────────────

function drawSeed(ctx: CanvasRenderingContext2D, t: number, hue: number, bright: number) {
  const pulse = 1 + Math.sin(t * 0.0018) * 0.12;
  orb(ctx, CX, CY, 22 * pulse, hue, bright);
}

function drawSprite(ctx: CanvasRenderingContext2D, t: number, hue: number, bright: number) {
  const pulse = 1 + Math.sin(t * 0.002) * 0.08;
  const spin  = t * 0.0008;
  orb(ctx, CX, CY, 32 * pulse, hue, bright);
  ring(ctx, CX, CY, 52, 18, spin, hue, 0.5 * bright);
  hexagon(ctx, CX, CY, 58, hue + 20);
  for (let i = 0; i < 4; i++) {
    particle(ctx, CX, CY, 65, spin * 1.5 + (i / 4) * TWO_PI, hue + i * 15, 2.5);
  }
}

function drawEntity(ctx: CanvasRenderingContext2D, t: number, hue: number, bright: number) {
  const pulse = 1 + Math.sin(t * 0.002) * 0.07;
  const s1    = t * 0.0007;
  const s2    = -t * 0.0011;
  orb(ctx, CX, CY, 42 * pulse, hue, bright);
  ring(ctx, CX, CY, 65, 22, s1, hue,       0.55 * bright);
  ring(ctx, CX, CY, 65, 22, s2 + 1, hue + 40, 0.40 * bright);
  hexagon(ctx, CX, CY, 75, hue + 10);
  for (let i = 0; i < 6; i++) {
    particle(ctx, CX, CY, 80, s1 * 1.8 + (i / 6) * TWO_PI, hue + i * 20, 3);
  }
  // Inner dash ring
  ctx.setLineDash([3, 6]);
  ring(ctx, CX, CY, 50, 50, s1 * 0.5, hue + 20, 0.20 * bright, 1);
  ctx.setLineDash([]);
}

function drawApex(ctx: CanvasRenderingContext2D, t: number, hue: number, bright: number) {
  const pulse = 1 + Math.sin(t * 0.0018) * 0.06;
  const s1    =  t * 0.0006;
  const s2    = -t * 0.0009;
  const s3    =  t * 0.0013;
  orb(ctx, CX, CY, 56 * pulse, hue, bright);
  ring(ctx, CX, CY, 82, 28, s1, hue,       0.60 * bright, 1.5);
  ring(ctx, CX, CY, 82, 28, s2 + 1, hue + 50, 0.45 * bright, 1);
  ring(ctx, CX, CY, 95, 95, s3 * 0.3, hue + 20, 0.15 * bright, 1);
  hexagon(ctx, CX, CY, 100, hue + 15);
  ctx.setLineDash([2, 8]);
  ring(ctx, CX, CY, 62, 62, -s1 * 0.6, hue + 30, 0.18 * bright, 1);
  ctx.setLineDash([]);
  for (let i = 0; i < 8; i++) {
    particle(ctx, CX, CY, 100, s1 * 2 + (i / 8) * TWO_PI, hue + i * 25, 3.5);
  }
  // Occasional lightning arc
  if (Math.sin(t * 0.003) > 0.85) {
    ctx.save();
    ctx.globalAlpha = (Math.sin(t * 0.003) - 0.85) / 0.15;
    ctx.strokeStyle = `hsl(${hue}, 100%, 90%)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const a1 = Math.random() * TWO_PI, a2 = a1 + Math.PI + Math.random() * 0.8;
    ctx.moveTo(CX + Math.cos(a1) * 56, CY + Math.sin(a1) * 56);
    ctx.lineTo(CX + Math.cos(a1 + 0.4) * 90, CY + Math.sin(a1 + 0.4) * 90);
    ctx.lineTo(CX + Math.cos(a2) * 56, CY + Math.sin(a2) * 56);
    ctx.stroke();
    ctx.restore();
  }
}

function drawAscendant(ctx: CanvasRenderingContext2D, t: number, hue: number, bright: number) {
  // Colour cycling
  const h = (hue + t * 0.03) % 360;
  const pulse = 1 + Math.sin(t * 0.002) * 0.05;
  const s1 =  t * 0.0005;
  const s2 = -t * 0.0008;
  const s3 =  t * 0.0012;

  // Wide background aura
  const bg = ctx.createRadialGradient(CX, CY, 10, CX, CY, 150);
  bg.addColorStop(0,   `hsla(${h}, 100%, 50%, ${0.08 * bright})`);
  bg.addColorStop(0.5, `hsla(${h + 60}, 100%, 50%, ${0.04 * bright})`);
  bg.addColorStop(1,   'transparent');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 320, 320);

  orb(ctx, CX, CY, 68 * pulse, h, bright * 1.1);
  ring(ctx, CX, CY,  95, 32, s1,       h,       0.65 * bright, 2);
  ring(ctx, CX, CY,  95, 32, s2 + 1,   h + 60,  0.55 * bright, 1.5);
  ring(ctx, CX, CY, 110, 110, s3 * 0.2, h + 120, 0.20 * bright, 1);
  ring(ctx, CX, CY, 130, 130, -s3 * 0.15, h + 180, 0.12 * bright, 1);
  hexagon(ctx, CX, CY, 118, h + 20);
  hexagon(ctx, CX, CY, 82,  h + 40);
  ctx.setLineDash([2, 5]);
  ring(ctx, CX, CY, 72, 72, s2 * 0.5, h + 90, 0.18 * bright, 1);
  ctx.setLineDash([]);
  for (let i = 0; i < 12; i++) {
    particle(ctx, CX, CY, 115, s1 * 2.5 + (i / 12) * TWO_PI, h + i * 30, 3.5);
  }
  // Inner spiral dots
  for (let i = 0; i < 6; i++) {
    particle(ctx, CX, CY, 80, s2 * 3 + (i / 6) * TWO_PI, h + 180 + i * 20, 2);
  }
}

function drawCorrupted(ctx: CanvasRenderingContext2D, t: number, stage: Stage) {
  const hue    = 5;
  const bright = 0.7;
  const pulse  = 1 + Math.sin(t * 0.004) * 0.15;
  // Use a simpler version of the current stage
  orb(ctx, CX, CY, 30 * pulse, hue, bright);
  ring(ctx, CX, CY, 50, 18, t * 0.001, hue, 0.4, 1.5);
  ctx.save();
  ctx.globalAlpha = 0.6;
  glitchSlices(ctx, t, hue);
  ctx.restore();
}

// ── Main draw dispatcher ───────────────────────────────────────────────────

function drawFrame(
  ctx: CanvasRenderingContext2D, t: number,
  stage: Stage, mood: Mood, hue: number
) {
  ctx.clearRect(0, 0, 320, 320);

  const sleeping    = mood === 'sleeping';
  const corrupted   = stage === 'corrupted';
  const overheating = mood === 'overheating';

  const bright = sleeping ? 0.45
    : corrupted ? 0.70
    : mood === 'sad' || mood === 'tired' ? 0.65
    : mood === 'happy' ? 1.15
    : 1.0;

  if (corrupted) { drawCorrupted(ctx, t, stage); }
  else {
    const drawT = sleeping ? t * 0.3 : overheating ? t * 1.6 : t;
    switch (stage) {
      case 'seed':       drawSeed(ctx, drawT, hue, bright);       break;
      case 'sprite':     drawSprite(ctx, drawT, hue, bright);     break;
      case 'entity':     drawEntity(ctx, drawT, hue, bright);     break;
      case 'apex':       drawApex(ctx, drawT, hue, bright);       break;
      case 'ascendant':  drawAscendant(ctx, drawT, hue, bright);  break;
    }
  }

  // Sleeping Z's
  if (sleeping) {
    const zs = ['z', 'z', 'Z'];
    zs.forEach((z, i) => {
      const alpha = Math.max(0, Math.sin(t * 0.001 - i * 0.8));
      const x = CX + 40 + i * 14;
      const y = CY - 60 - Math.sin(t * 0.001 - i * 0.8) * 20;
      ctx.globalAlpha = alpha * 0.8;
      ctx.fillStyle   = `hsl(${hue}, 80%, 75%)`;
      ctx.font        = `${12 + i * 4}px 'Share Tech Mono', monospace`;
      ctx.fillText(z, x, y);
      ctx.globalAlpha = 1;
    });
  }

  // Corruption warning flicker
  if (corrupted) {
    const alpha = Math.abs(Math.sin(t * 0.005)) * 0.35;
    ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
    ctx.fillRect(0, 0, 320, 320);
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export default function Creature({ pet, mood }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hue = MOOD_HUE[mood];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    let start = performance.now();

    function loop(now: number) {
      const t = now - start;
      drawFrame(ctx, t, pet.stage, mood, hue);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [pet.stage, mood, hue]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={320}
      style={{ display: 'block', maxWidth: '100%', margin: '0 auto' }}
    />
  );
}
