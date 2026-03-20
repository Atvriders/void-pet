import { useEffect, useRef } from 'react';
import type { PetState, Mood, Stage } from '../game/types';
import { MOOD_HUE } from '../game/mood';

interface Props {
  pet: PetState;
  mood: Mood;
  lastAction?: { type: string; at: number } | null;
}

const TWO_PI = Math.PI * 2;
const CSS_SIZE = 480;
const CX = 240, CY = 240; // canvas centre (CSS pixels)

// ── Matrix rain ─────────────────────────────────────────────────────────────

const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネ01◈❋▲⚡⬡⟳10110100';

interface RainCol { x: number; y: number; speed: number; length: number; chars: string[]; charTimer: number; }

function mkRain(): RainCol[] {
  const W = 18;
  return Array.from({ length: Math.floor(CSS_SIZE / W) }, (_, i) => ({
    x: i * W + W / 2,
    y: Math.random() * CSS_SIZE,
    speed: 40 + Math.random() * 60,
    length: 7 + Math.floor(Math.random() * 10),
    chars: Array.from({ length: 20 }, () => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]),
    charTimer: 0,
  }));
}

function tickRain(cols: RainCol[], dt: number) {
  for (const c of cols) {
    c.y += c.speed * dt;
    c.charTimer += dt;
    if (c.charTimer > 0.1) {
      c.charTimer = 0;
      c.chars[Math.floor(Math.random() * c.chars.length)] =
        MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
    }
    if (c.y > CSS_SIZE + c.length * 18) c.y = -c.length * 18;
  }
}

function drawRain(ctx: CanvasRenderingContext2D, cols: RainCol[], hue: number) {
  ctx.save();
  ctx.font = '13px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const c of cols) {
    for (let i = 0; i < c.length; i++) {
      const charY = c.y - i * 18;
      if (charY < -18 || charY > CSS_SIZE + 18) continue;
      if (i === 0) {
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = `hsl(${hue}, 80%, 90%)`;
      } else {
        ctx.globalAlpha = (1 - i / c.length) * 0.35;
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      }
      ctx.fillText(c.chars[i % c.chars.length], c.x, charY);
    }
  }
  ctx.restore();
}

// ── Blink system ─────────────────────────────────────────────────────────────

function getBlinkP(state: { nextBlink: number; blinkStart: number; blinking: boolean }, now: number): number {
  if (now >= state.nextBlink && !state.blinking) {
    state.blinking = true;
    state.blinkStart = now;
  }
  if (!state.blinking) return 0;
  const elapsed = now - state.blinkStart;
  const dur = 150;
  if (elapsed > dur) {
    state.blinking = false;
    state.nextBlink = now + 2500 + Math.random() * 4000;
    return 0;
  }
  return elapsed < dur / 2 ? elapsed / (dur / 2) : 1 - (elapsed - dur / 2) / (dur / 2);
}

// ── Action burst effects ─────────────────────────────────────────────────────

interface Burst { type: string; t0: number; dur: number; }

function drawBursts(ctx: CanvasRenderingContext2D, bursts: Burst[], now: number, hue: number) {
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    const p = Math.min((now - b.t0) / b.dur, 1);
    const ep = 1 - Math.pow(1 - p, 3);
    const fade = p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3;
    if (p >= 1) { bursts.splice(i, 1); continue; }
    ctx.save();
    ctx.globalAlpha = fade;

    if (b.type === 'INJECT') {
      ctx.font = 'bold 15px "Share Tech Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * TWO_PI;
        const dist = 220 - ep * 160;
        ctx.fillStyle = `hsl(${hue}, 100%, 75%)`;
        ctx.fillText('◈', CX + Math.cos(a) * dist, CY + Math.sin(a) * dist);
        ctx.strokeStyle = `hsla(${hue}, 100%, 60%, 0.45)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(CX + Math.cos(a) * (dist + 25), CY + Math.sin(a) * (dist + 25));
        ctx.lineTo(CX + Math.cos(a) * dist, CY + Math.sin(a) * dist);
        ctx.stroke();
      }
    }
    else if (b.type === 'SIMULATE') {
      const outerR = 75 + ep * 155;
      for (let j = 0; j < 8; j++) {
        const a = (j / 8) * TWO_PI;
        const pa = a + 0.2;
        const inner = 65, mid = inner + (outerR - inner) * 0.5;
        ctx.strokeStyle = `hsla(${hue}, 100%, 65%, 0.85)`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(CX + Math.cos(a) * inner, CY + Math.sin(a) * inner);
        ctx.lineTo(CX + Math.cos(pa) * mid,  CY + Math.sin(pa) * mid);
        ctx.lineTo(CX + Math.cos(a) * outerR, CY + Math.sin(a) * outerR);
        ctx.stroke();
        if (p > 0.2) {
          ctx.beginPath();
          ctx.arc(CX + Math.cos(a) * outerR, CY + Math.sin(a) * outerR, 3.5, 0, TWO_PI);
          ctx.fillStyle = `hsl(${hue}, 100%, 80%)`;
          ctx.fill();
        }
      }
      ctx.beginPath(); ctx.arc(CX, CY, outerR, 0, TWO_PI);
      ctx.strokeStyle = `hsla(${hue}, 100%, 60%, 0.22)`;
      ctx.lineWidth = 1.5; ctx.stroke();
    }
    else if (b.type === 'DEFRAG') {
      for (let w = 0; w < 3; w++) {
        const wp = Math.max(0, Math.min(1, (ep - w * 0.2) / 0.8));
        if (wp <= 0) continue;
        ctx.beginPath(); ctx.arc(CX, CY, 55 + wp * 190, 0, TWO_PI);
        ctx.strokeStyle = `hsla(195, 100%, 65%, ${(1 - wp) * fade * 0.7})`;
        ctx.lineWidth = 2.5 - wp * 1.5; ctx.stroke();
      }
      for (let j = 0; j < 8; j++) {
        const a = (j / 8) * TWO_PI + ep;
        const d = 55 + ep * 145;
        ctx.beginPath(); ctx.arc(CX + Math.cos(a) * d, CY + Math.sin(a) * d, 3, 0, TWO_PI);
        ctx.fillStyle = 'hsla(195, 100%, 75%, 0.85)'; ctx.fill();
      }
    }
    else if (b.type === 'HIBERNATE') {
      for (let j = 0; j < 8; j++) {
        const a = (j / 8) * TWO_PI + ep * 0.7;
        const d = 80 + Math.sin(ep * Math.PI + j) * 38;
        const sz = 6 + Math.sin(ep * TWO_PI + j) * 4;
        ctx.save();
        ctx.translate(CX + Math.cos(a) * d, CY + Math.sin(a) * d);
        ctx.font = `${sz + 8}px serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = `hsl(${hue + 40}, 80%, 85%)`;
        ctx.fillText('✦', 0, 0);
        ctx.restore();
      }
    }
    else if (b.type === 'OVERCLOCK') {
      for (let j = 0; j < 5; j++) {
        const a = (j / 5) * TWO_PI + Math.PI / 10;
        const len = 70 + ep * 130;
        ctx.strokeStyle = `hsla(${hue + 30}, 100%, 90%, 0.95)`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(CX + Math.cos(a) * 60, CY + Math.sin(a) * 60);
        for (let s = 1; s <= 5; s++) {
          const jit = Math.sin(j * 3.7 + s * 2.1) * 22;
          const pa = a + Math.PI / 2;
          ctx.lineTo(
            CX + Math.cos(a) * (60 + (s / 5) * len) + Math.cos(pa) * jit,
            CY + Math.sin(a) * (60 + (s / 5) * len) + Math.sin(pa) * jit
          );
        }
        ctx.stroke();
      }
      if (p < 0.3) {
        const fa = (1 - p / 0.3) * 0.5;
        const fg = ctx.createRadialGradient(CX, CY, 0, CX, CY, 130);
        fg.addColorStop(0, `rgba(255,255,255,${fa})`); fg.addColorStop(1, 'transparent');
        ctx.fillStyle = fg;
        ctx.beginPath(); ctx.arc(CX, CY, 130, 0, TWO_PI); ctx.fill();
      }
    }
    ctx.restore();
  }
}

// ── Floating stat change labels ──────────────────────────────────────────────

interface FloatText { text: string; x: number; y0: number; color: string; t0: number; }

const ACTION_FLOATS: Record<string, { text: string; color: string }[]> = {
  INJECT:    [{ text: '◈ +22', color: '#55aaff' }, { text: '▲ +4',  color: '#ff7733' }],
  SIMULATE:  [{ text: '❋ +25', color: '#aa55ff' }, { text: '▲ +18', color: '#ff7733' }, { text: '⚡ −15', color: '#ffaa00' }],
  DEFRAG:    [{ text: '▲ −32', color: '#44ddff' }, { text: '❋ +8',  color: '#aa55ff' }],
  HIBERNATE: [{ text: '▲ −',   color: '#44ddff' }, { text: '⚡ +',   color: '#44ff88' }],
  OVERCLOCK: [{ text: '❋ +40', color: '#aa55ff' }, { text: '▲ +35', color: '#ff7733' }, { text: '⚡ −25', color: '#ffaa00' }],
};

function drawFloats(ctx: CanvasRenderingContext2D, floats: FloatText[], now: number) {
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i];
    const p = (now - f.t0) / 1300;
    if (p >= 1) { floats.splice(i, 1); continue; }
    if (p < 0) continue;
    const rise = p * 85;
    const alpha = p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8;
    ctx.save();
    ctx.globalAlpha = alpha * 0.95;
    ctx.fillStyle = f.color;
    ctx.font = 'bold 13px "Share Tech Mono", monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(f.text, f.x, f.y0 - rise);
    ctx.restore();
  }
}

// ── Scanline sweep ───────────────────────────────────────────────────────────

function drawScanline(ctx: CanvasRenderingContext2D, t: number) {
  const y = (t * 0.045) % CSS_SIZE;
  const g = ctx.createLinearGradient(0, y - 18, 0, y + 18);
  g.addColorStop(0, 'transparent');
  g.addColorStop(0.5, 'rgba(0, 255, 120, 0.042)');
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.fillRect(0, y - 18, CSS_SIZE, 36);
}

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
  mood: Mood,
  blinkP: number
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
  const pupilColor = overheating || corrupted
    ? 'hsl(5, 100%, 60%)'
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

      // Blink overlay
      if (blinkP > 0 && !sleeping) {
        ctx.beginPath();
        ctx.arc(ex, eyeY, eyeR, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 20%, 6%, ${blinkP})`;
        ctx.fill();
      }

      // Drooping eyelid for tired — dark arc covers top half of sclera
      if (mood === 'tired') {
        ctx.beginPath();
        ctx.arc(ex, eyeY, eyeR, Math.PI, 0);
        ctx.fillStyle = `hsla(${hue}, 25%, 10%, 0.88)`;
        ctx.fill();
      }
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

function drawSeed(ctx: CanvasRenderingContext2D, t: number, hue: number, bright: number, mood: Mood, blinkP: number) {
  const pulse = 1 + Math.sin(t * 0.0018) * 0.12;
  const orbR  = 33 * pulse;
  orb(ctx, CX, CY, orbR, hue, bright);
  drawFace(ctx, CX, CY, orbR, hue, mood, blinkP);
}

function drawSprite(ctx: CanvasRenderingContext2D, t: number, hue: number, bright: number, mood: Mood, blinkP: number) {
  const pulse = 1 + Math.sin(t * 0.002) * 0.08;
  const spin  = t * 0.0008;
  const orbR  = 48 * pulse;
  orb(ctx, CX, CY, orbR, hue, bright);
  ring(ctx, CX, CY, 78, 27, spin, hue, 0.5 * bright);
  hexagon(ctx, CX, CY, 87, hue + 20);
  for (let i = 0; i < 4; i++) {
    particle(ctx, CX, CY, 97.5, spin * 1.5 + (i / 4) * TWO_PI, hue + i * 15, 3.75);
  }
  drawFace(ctx, CX, CY, orbR, hue, mood, blinkP);
}

function drawEntity(ctx: CanvasRenderingContext2D, t: number, hue: number, bright: number, mood: Mood, blinkP: number) {
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
  drawFace(ctx, CX, CY, orbR, hue, mood, blinkP);
}

function drawApex(ctx: CanvasRenderingContext2D, t: number, hue: number, bright: number, mood: Mood, blinkP: number) {
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
  drawFace(ctx, CX, CY, orbR, hue, mood, blinkP);
}

function drawAscendant(ctx: CanvasRenderingContext2D, t: number, hue: number, bright: number, mood: Mood, blinkP: number) {
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
  drawFace(ctx, CX, CY, orbR, h, mood, blinkP);
}

function drawCorrupted(
  ctx: CanvasRenderingContext2D, t: number, _stage: Stage, mood: Mood,
  canvasW: number, canvasH: number, physW: number, physH: number,
  blinkP: number
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
  drawFace(ctx, CX, CY, orbR, hue, mood, blinkP);
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
  physH: number,
  rain: RainCol[],
  bursts: Burst[],
  floats: FloatText[],
  blinkP: number
) {
  ctx.clearRect(0, 0, canvasW, canvasH);

  drawRain(ctx, rain, hue);
  drawScanline(ctx, t);

  const sleeping    = mood === 'sleeping';
  const corrupted   = stage === 'corrupted';
  const overheating = mood === 'overheating';

  const bright = sleeping ? 0.45
    : corrupted ? 0.70
    : mood === 'sad' || mood === 'tired' ? 0.65
    : mood === 'happy' ? 1.15
    : 1.0;

  const drawT = sleeping ? t * 0.3 : overheating ? t * 1.6 : t;

  if (corrupted) {
    drawCorrupted(ctx, t, stage, mood, canvasW, canvasH, physW, physH, blinkP);
  } else {
    switch (stage) {
      case 'seed':       drawSeed(ctx, drawT, hue, bright, mood, blinkP);       break;
      case 'sprite':     drawSprite(ctx, drawT, hue, bright, mood, blinkP);     break;
      case 'entity':     drawEntity(ctx, drawT, hue, bright, mood, blinkP);     break;
      case 'apex':       drawApex(ctx, drawT, hue, bright, mood, blinkP);       break;
      case 'ascendant':  drawAscendant(ctx, drawT, hue, bright, mood, blinkP);  break;
    }
  }

  // Sleeping Z's — use drawT so Z animation speed matches body (0.3× during sleep)
  if (sleeping) {
    const zs = ['z', 'z', 'Z'];
    zs.forEach((z, i) => {
      const alpha = Math.max(0, Math.sin(drawT * 0.001 - i * 0.8));
      const x = CX + 60 + i * 21;
      const y = CY - 90 - Math.sin(drawT * 0.001 - i * 0.8) * 30;
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

  drawBursts(ctx, bursts, t, hue);
  drawFloats(ctx, floats, t);
}

// ── Component ──────────────────────────────────────────────────────────────

export default function Creature({ pet, mood, lastAction }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const rainRef    = useRef<RainCol[] | null>(null);
  const burstsRef  = useRef<Burst[]>([]);
  const floatsRef  = useRef<FloatText[]>([]);
  const blinkRef   = useRef({ nextBlink: 3000, blinkStart: 0, blinking: false });
  const hue = MOOD_HUE[mood];

  if (!rainRef.current) rainRef.current = mkRain();

  // Trigger burst + floats when action fires
  useEffect(() => {
    if (!lastAction) return;
    const durations: Record<string, number> = {
      INJECT: 750, SIMULATE: 650, DEFRAG: 1000, HIBERNATE: 1400, OVERCLOCK: 650,
    };
    burstsRef.current.push({
      type: lastAction.type,
      t0: performance.now(),
      dur: durations[lastAction.type] ?? 700,
    });
    const floatDefs = ACTION_FLOATS[lastAction.type] ?? [];
    const now = performance.now();
    floatDefs.forEach((fd, i) => {
      floatsRef.current.push({
        text:  fd.text,
        color: fd.color,
        x:     CX + (i - (floatDefs.length - 1) / 2) * 58,
        y0:    CY - 25,
        t0:    now + i * 120,
      });
    });
  }, [lastAction]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr   = window.devicePixelRatio || 1;
    const physW = CSS_SIZE * dpr;
    const physH = CSS_SIZE * dpr;
    canvas.width  = physW;
    canvas.height = physH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    let raf = 0;
    let prevTime = performance.now();
    function loop(now: number) {
      const dt = Math.min((now - prevTime) / 1000, 0.1);
      prevTime = now;
      tickRain(rainRef.current!, dt);
      const blinkP = getBlinkP(blinkRef.current, now);
      drawFrame(
        ctx!, now, pet.stage, mood, hue,
        CSS_SIZE, CSS_SIZE, physW, physH,
        rainRef.current!, burstsRef.current, floatsRef.current, blinkP
      );
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [pet.stage, mood, hue]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: `${CSS_SIZE}px`, height: `${CSS_SIZE}px`, maxWidth: '100%', aspectRatio: '1 / 1', margin: '0 auto' }}
    />
  );
}
