import { useEffect, useRef } from 'react';
import type { PetState, Mood, Stage } from '../game/types';
import { MOOD_HUE } from '../game/mood';

interface Props { pet: PetState; mood: Mood }

const TWO_PI = Math.PI * 2;
const CSS_SIZE = 480;
const CX = 240, CY = 240; // canvas centre (CSS pixels)

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
  rx: number, ry: number, tilt: number, hue: number, alpha: number, width = 2.25
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
  orbitR: number, angle: number, hue: number, r = 4.5
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
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function glitchSlices(
  ctx: CanvasRenderingContext2D, t: number, hue: number,
  canvasW: number, canvasH: number,
  physW: number, physH: number
) {
  // getImageData/putImageData operate in physical (device) pixels, not CSS pixels
  const dpr = physW / canvasW;
  const n = 3;
  for (let i = 0; i < n; i++) {
    const seed = Math.sin(t * 0.003 + i * 2.7) * 0.5 + 0.5;
    if (seed < 0.6) continue;
    const y  = ((seed * physH) | 0);
    const h  = ((seed * 12 + 3) * dpr) | 0;
    const dx = ((Math.sin(t * 0.007 + i) * 30) * dpr) | 0;
    if (h <= 0 || y + h > physH) continue;
    const img = ctx.getImageData(0, y, physW, h);
    ctx.putImageData(img, dx, y);
  }
  ctx.fillStyle = `hsla(${hue}, 100%, 60%, 0.05)`;
  ctx.fillRect(0, 0, canvasW, canvasH);
}

// ── Face drawing ───────────────────────────────────────────────────────────

function drawFace(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  orbR: number,
  hue: number,
  mood: Mood
) {
  const sleeping    = mood === 'sleeping';
  const sad         = mood === 'sad';
  const happy       = mood === 'happy';
  const overheating = mood === 'overheating';
  const corrupted   = mood === 'corrupted';
  const hungry      = mood === 'hungry';

  const eyeBaseR  = orbR * 0.22;
  const eyeR      = happy ? eyeBaseR * 1.12 : eyeBaseR;
  const pupilR    = orbR * 0.12;

  const leftEyeX  = cx - orbR * 0.35;
  const rightEyeX = cx + orbR * 0.35;
  const eyeY      = cy - orbR * 0.2;

  // Pupil offset for moods
  const pupilDY = (sad || corrupted) ? pupilR * 0.5 : hungry ? -pupilR * 0.4 : 0;

  // Pupil colour
  const pupilColor = overheating
    ? 'hsl(0, 100%, 55%)'
    : happy
      ? `hsl(${hue}, 100%, 80%)`
      : `hsl(${hue}, 90%, 65%)`;

  ctx.save();

  if (sleeping) {
    // Closed eyes: horizontal lines
    ctx.strokeStyle = `hsla(${hue}, 60%, 80%, 0.9)`;
    ctx.lineWidth   = orbR * 0.045;
    ctx.lineCap     = 'round';
    [-1, 1].forEach(side => {
      const ex = cx + side * orbR * 0.35;
      ctx.beginPath();
      ctx.moveTo(ex - eyeR * 0.7, eyeY);
      ctx.lineTo(ex + eyeR * 0.7, eyeY);
      ctx.stroke();
    });
  } else {
    // Eye sockets (white)
    [leftEyeX, rightEyeX].forEach(ex => {
      // White sclera
      ctx.beginPath(); ctx.arc(ex, eyeY, eyeR, 0, TWO_PI);
      ctx.fillStyle = overheating
        ? 'hsla(30, 100%, 92%, 0.92)'
        : 'hsla(0, 0%, 96%, 0.92)';
      ctx.fill();

      // Stressed crease lines for overheating
      if (overheating) {
        ctx.strokeStyle = 'hsla(0, 80%, 55%, 0.5)';
        ctx.lineWidth   = orbR * 0.025;
        // Furrowed brow line above each eye
        const browY = eyeY - eyeR * 0.85;
        ctx.beginPath();
        ctx.moveTo(ex - eyeR * 0.6, browY + eyeR * 0.2);
        ctx.lineTo(ex,              browY);
        ctx.lineTo(ex + eyeR * 0.6, browY + eyeR * 0.2);
        ctx.stroke();
      }

      // Pupil
      ctx.beginPath(); ctx.arc(ex, eyeY + pupilDY, pupilR, 0, TWO_PI);
      ctx.fillStyle = pupilColor;
      ctx.fill();

      // Pupil shine
      ctx.beginPath(); ctx.arc(ex - pupilR * 0.3, eyeY + pupilDY - pupilR * 0.3, pupilR * 0.28, 0, TWO_PI);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fill();
    });
  }

  // ── Mouth ──
  const mouthY   = cy + orbR * 0.15;
  const mouthHW  = orbR * 0.30; // half-width
  const mouthCtrlX = cx;

  ctx.lineWidth = orbR * 0.05;
  ctx.lineCap   = 'round';

  if (sleeping) {
    // Small peaceful closed curve
    ctx.strokeStyle = `hsla(${hue}, 60%, 75%, 0.8)`;
    ctx.beginPath();
    ctx.moveTo(cx - mouthHW * 0.6, mouthY + orbR * 0.04);
    ctx.quadraticCurveTo(mouthCtrlX, mouthY + orbR * 0.18, cx + mouthHW * 0.6, mouthY + orbR * 0.04);
    ctx.stroke();

  } else if (happy) {
    // Smile
    ctx.strokeStyle = `hsla(${hue}, 80%, 80%, 0.95)`;
    ctx.beginPath();
    ctx.moveTo(cx - mouthHW, mouthY);
    ctx.quadraticCurveTo(mouthCtrlX, mouthY + orbR * 0.45, cx + mouthHW, mouthY);
    ctx.stroke();

  } else if (sad || mood === 'tired') {
    // Frown
    ctx.strokeStyle = `hsla(${hue}, 60%, 65%, 0.85)`;
    ctx.beginPath();
    ctx.moveTo(cx - mouthHW, mouthY + orbR * 0.25);
    ctx.quadraticCurveTo(mouthCtrlX, mouthY - orbR * 0.12, cx + mouthHW, mouthY + orbR * 0.25);
    ctx.stroke();

  } else if (overheating) {
    // Wavy stressed line
    ctx.strokeStyle = 'hsla(0, 90%, 65%, 0.9)';
    ctx.beginPath();
    const waveY = mouthY + orbR * 0.1;
    ctx.moveTo(cx - mouthHW, waveY);
    ctx.bezierCurveTo(
      cx - mouthHW * 0.5, waveY - orbR * 0.1,
      cx,                  waveY + orbR * 0.1,
      cx + mouthHW * 0.5,  waveY - orbR * 0.1
    );
    ctx.lineTo(cx + mouthHW, waveY);
    ctx.stroke();

  } else if (corrupted) {
    // Jagged/glitchy line
    ctx.strokeStyle = 'hsla(5, 100%, 60%, 0.9)';
    ctx.lineWidth   = orbR * 0.045;
    ctx.beginPath();
    const jY = mouthY + orbR * 0.1;
    ctx.moveTo(cx - mouthHW, jY);
    ctx.lineTo(cx - mouthHW * 0.5, jY - orbR * 0.12);
    ctx.lineTo(cx - mouthHW * 0.1, jY + orbR * 0.1);
    ctx.lineTo(cx + mouthHW * 0.2,  jY - orbR * 0.08);
    ctx.lineTo(cx + mouthHW * 0.6,  jY + orbR * 0.05);
    ctx.lineTo(cx + mouthHW, jY);
    ctx.stroke();

  } else if (hungry) {
    // Open 'O' mouth — gasping for signal
    ctx.strokeStyle = `hsla(${hue}, 90%, 70%, 0.9)`;
    ctx.beginPath();
    ctx.ellipse(cx, mouthY + orbR * 0.1, mouthHW * 0.45, orbR * 0.22, 0, 0, TWO_PI);
    ctx.stroke();

  } else {
    // Neutral: straight horizontal line
    ctx.strokeStyle = `hsla(${hue}, 50%, 72%, 0.8)`;
    ctx.beginPath();
    ctx.moveTo(cx - mouthHW, mouthY + orbR * 0.12);
    ctx.lineTo(cx + mouthHW, mouthY + orbR * 0.12);
    ctx.stroke();
  }

  ctx.restore();
}

// ── Stage drawers ──────────────────────────────────────────────────────────
// All radii scaled ~1.5× from original 320px canvas → 480px canvas

function drawSeed(ctx: CanvasRenderingContext2D, t: number, hue: number, bright: number, mood: Mood) {
  const pulse = 1 + Math.sin(t * 0.0018) * 0.12;
  const orbR  = 33 * pulse;
  orb(ctx, CX, CY, orbR, hue, bright);
  drawFace(ctx, CX, CY, orbR, hue, mood);
}

function drawSprite(ctx: CanvasRenderingContext2D, t: number, hue: number, bright: number, mood: Mood) {
  const pulse = 1 + Math.sin(t * 0.002) * 0.08;
  const spin  = t * 0.0008;
  const orbR  = 48 * pulse;
  orb(ctx, CX, CY, orbR, hue, bright);
  ring(ctx, CX, CY, 78, 27, spin, hue, 0.5 * bright);
  hexagon(ctx, CX, CY, 87, hue + 20);
  for (let i = 0; i < 4; i++) {
    particle(ctx, CX, CY, 97.5, spin * 1.5 + (i / 4) * TWO_PI, hue + i * 15, 3.75);
  }
  drawFace(ctx, CX, CY, orbR, hue, mood);
}

function drawEntity(ctx: CanvasRenderingContext2D, t: number, hue: number, bright: number, mood: Mood) {
  const pulse = 1 + Math.sin(t * 0.002) * 0.07;
  const s1    = t * 0.0007;
  const s2    = -t * 0.0011;
  const orbR  = 63 * pulse;
  orb(ctx, CX, CY, orbR, hue, bright);
  ring(ctx, CX, CY, 97.5, 33, s1, hue,        0.55 * bright);
  ring(ctx, CX, CY, 97.5, 33, s2 + 1, hue + 40, 0.40 * bright);
  hexagon(ctx, CX, CY, 112.5, hue + 10);
  for (let i = 0; i < 6; i++) {
    particle(ctx, CX, CY, 120, s1 * 1.8 + (i / 6) * TWO_PI, hue + i * 20, 4.5);
  }
  // Inner dash ring
  ctx.setLineDash([4.5, 9]);
  ring(ctx, CX, CY, 75, 75, s1 * 0.5, hue + 20, 0.20 * bright, 1.5);
  ctx.setLineDash([]);
  drawFace(ctx, CX, CY, orbR, hue, mood);
}

function drawApex(ctx: CanvasRenderingContext2D, t: number, hue: number, bright: number, mood: Mood) {
  const pulse = 1 + Math.sin(t * 0.0018) * 0.06;
  const s1    =  t * 0.0006;
  const s2    = -t * 0.0009;
  const s3    =  t * 0.0013;
  const orbR  = 84 * pulse;
  orb(ctx, CX, CY, orbR, hue, bright);
  ring(ctx, CX, CY, 123, 42, s1, hue,        0.60 * bright, 2.25);
  ring(ctx, CX, CY, 123, 42, s2 + 1, hue + 50, 0.45 * bright, 1.5);
  ring(ctx, CX, CY, 142.5, 142.5, s3 * 0.3, hue + 20, 0.15 * bright, 1.5);
  hexagon(ctx, CX, CY, 150, hue + 15);
  ctx.setLineDash([3, 12]);
  ring(ctx, CX, CY, 93, 93, -s1 * 0.6, hue + 30, 0.18 * bright, 1.5);
  ctx.setLineDash([]);
  for (let i = 0; i < 8; i++) {
    particle(ctx, CX, CY, 150, s1 * 2 + (i / 8) * TWO_PI, hue + i * 25, 5.25);
  }
  // Occasional lightning arc — position seeded from t so it holds steady during the fade
  if (Math.sin(t * 0.003) > 0.85) {
    ctx.save();
    ctx.globalAlpha = (Math.sin(t * 0.003) - 0.85) / 0.15;
    ctx.strokeStyle = `hsl(${hue}, 100%, 90%)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const a1 = Math.sin(t * 0.0001) * TWO_PI;
    const a2 = a1 + Math.PI + Math.cos(t * 0.00013) * 0.8;
    ctx.moveTo(CX + Math.cos(a1) * 84, CY + Math.sin(a1) * 84);
    ctx.lineTo(CX + Math.cos(a1 + 0.4) * 135, CY + Math.sin(a1 + 0.4) * 135);
    ctx.lineTo(CX + Math.cos(a2) * 84, CY + Math.sin(a2) * 84);
    ctx.stroke();
    ctx.restore();
  }
  drawFace(ctx, CX, CY, orbR, hue, mood);
}

function drawAscendant(ctx: CanvasRenderingContext2D, t: number, hue: number, bright: number, mood: Mood) {
  // Colour cycling
  const h = (hue + t * 0.03) % 360;
  const pulse = 1 + Math.sin(t * 0.002) * 0.05;
  const s1 =  t * 0.0005;
  const s2 = -t * 0.0008;
  const s3 =  t * 0.0012;
  const orbR = 102 * pulse;

  // Wide background aura
  const bg = ctx.createRadialGradient(CX, CY, 15, CX, CY, 225);
  bg.addColorStop(0,   `hsla(${h}, 100%, 50%, ${0.08 * bright})`);
  bg.addColorStop(0.5, `hsla(${h + 60}, 100%, 50%, ${0.04 * bright})`);
  bg.addColorStop(1,   'transparent');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, CSS_SIZE, CSS_SIZE);

  orb(ctx, CX, CY, orbR, h, bright * 1.1);
  ring(ctx, CX, CY, 142.5, 48, s1,         h,        0.65 * bright, 3);
  ring(ctx, CX, CY, 142.5, 48, s2 + 1,     h + 60,   0.55 * bright, 2.25);
  ring(ctx, CX, CY, 165,   165, s3 * 0.2,  h + 120,  0.20 * bright, 1.5);
  ring(ctx, CX, CY, 195,   195, -s3 * 0.15, h + 180, 0.12 * bright, 1.5);
  hexagon(ctx, CX, CY, 177, h + 20);
  hexagon(ctx, CX, CY, 123, h + 40);
  ctx.setLineDash([3, 7.5]);
  ring(ctx, CX, CY, 108, 108, s2 * 0.5, h + 90, 0.18 * bright, 1.5);
  ctx.setLineDash([]);
  for (let i = 0; i < 12; i++) {
    particle(ctx, CX, CY, 172.5, s1 * 2.5 + (i / 12) * TWO_PI, h + i * 30, 5.25);
  }
  // Inner spiral dots
  for (let i = 0; i < 6; i++) {
    particle(ctx, CX, CY, 120, s2 * 3 + (i / 6) * TWO_PI, h + 180 + i * 20, 3);
  }
  drawFace(ctx, CX, CY, orbR, h, mood);
}

function drawCorrupted(
  ctx: CanvasRenderingContext2D, t: number, _stage: Stage, mood: Mood,
  canvasW: number, canvasH: number, physW: number, physH: number
) {
  const hue    = 5;
  const bright = 0.7;
  const pulse  = 1 + Math.sin(t * 0.004) * 0.15;
  const orbR   = 45 * pulse;
  orb(ctx, CX, CY, orbR, hue, bright);
  ring(ctx, CX, CY, 75, 27, t * 0.001, hue, 0.4, 2.25);
  ctx.save();
  ctx.globalAlpha = 0.6;
  glitchSlices(ctx, t, hue, canvasW, canvasH, physW, physH);
  ctx.restore();
  drawFace(ctx, CX, CY, orbR, hue, mood);
}

// ── Main draw dispatcher ───────────────────────────────────────────────────

function drawFrame(
  ctx: CanvasRenderingContext2D,
  t: number,
  stage: Stage,
  mood: Mood,
  hue: number,
  canvasW: number,
  canvasH: number,
  physW: number,
  physH: number
) {
  ctx.clearRect(0, 0, canvasW, canvasH);

  const sleeping    = mood === 'sleeping';
  const corrupted   = stage === 'corrupted';
  const overheating = mood === 'overheating';

  const bright = sleeping ? 0.45
    : corrupted ? 0.70
    : mood === 'sad' || mood === 'tired' ? 0.65
    : mood === 'happy' ? 1.15
    : 1.0;

  if (corrupted) {
    drawCorrupted(ctx, t, stage, mood, canvasW, canvasH, physW, physH);
  } else {
    const drawT = sleeping ? t * 0.3 : overheating ? t * 1.6 : t;
    switch (stage) {
      case 'seed':       drawSeed(ctx, drawT, hue, bright, mood);       break;
      case 'sprite':     drawSprite(ctx, drawT, hue, bright, mood);     break;
      case 'entity':     drawEntity(ctx, drawT, hue, bright, mood);     break;
      case 'apex':       drawApex(ctx, drawT, hue, bright, mood);       break;
      case 'ascendant':  drawAscendant(ctx, drawT, hue, bright, mood);  break;
    }
  }

  // Sleeping Z's
  if (sleeping) {
    const zs = ['z', 'z', 'Z'];
    zs.forEach((z, i) => {
      const alpha = Math.max(0, Math.sin(t * 0.001 - i * 0.8));
      const x = CX + 60 + i * 21;
      const y = CY - 90 - Math.sin(t * 0.001 - i * 0.8) * 30;
      ctx.globalAlpha = alpha * 0.8;
      ctx.fillStyle   = `hsl(${hue}, 80%, 75%)`;
      ctx.font        = `${18 + i * 6}px 'Share Tech Mono', monospace`;
      ctx.fillText(z, x, y);
      ctx.globalAlpha = 1;
    });
  }

  // Corruption warning flicker
  if (corrupted) {
    const alpha = Math.abs(Math.sin(t * 0.005)) * 0.35;
    ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export default function Creature({ pet, mood }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hue = MOOD_HUE[mood];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const physW = CSS_SIZE * dpr;
    const physH = CSS_SIZE * dpr;

    canvas.width  = physW;
    canvas.height = physH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    let raf = 0;

    function loop(now: number) {
      drawFrame(ctx!, now, pet.stage, mood, hue, CSS_SIZE, CSS_SIZE, physW, physH);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [pet.stage, mood, hue]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display:     'block',
        width:       `${CSS_SIZE}px`,
        height:      `${CSS_SIZE}px`,
        maxWidth:    '100%',
        aspectRatio: '1 / 1',
        margin:      '0 auto',
      }}
    />
  );
}
