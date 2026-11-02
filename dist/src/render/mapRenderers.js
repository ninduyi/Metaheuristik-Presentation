/**
 * Renderer peta kontur 2D untuk Firefly (kunang-kunang) dan Bat (kelelawar).
 * Posisi dunia (domain fungsi) diubah ke piksel lewat viewport; gerakan diinterpolasi dengan `alpha` (0..1)
 * antara posisi sebelum dan sesudah langkah yang baru dijalankan.
 */

import { TopoMap } from './heatmap.js';
import { fitCanvas } from './motion.js';
import {
  COLORS,
  drawBat,
  drawCheck,
  drawCross,
  drawEcho,
  drawFirefly,
  drawText,
  hexToRgba
} from './sprites.js';

const lerp = (a, b, t) => a + (b - a) * t;

function worldPos(vp, from, to, alpha) {
  return vp.worldToScreen(lerp(from[0], to[0], alpha), lerp(from[1], to[1], alpha));
}

function ring(ctx, x, y, r, color, width, dash) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export class FARenderer {
  constructor() {
    this.cache = new TopoMap();
  }

  render(canvas, state, objective, { alpha = 1, timestamp = 0, padding } = {}) {
    const { ctx, width, height } = fitCanvas(canvas);
    ctx.clearRect(0, 0, width, height);
    const vp = this.cache.paint(ctx, width, height, objective, 'fa', { padding });
    if (!vp) return;
    const u = Math.min(width, height) / 900;
    const t = timestamp / 1000;
    const agents = state.agents;
    const pos = agents.map((a) => worldPos(vp, a.px, a.x, state.phase === 'EVAL' ? 1 : alpha));

    // Garis tarikan: makin kuat β, makin tebal dan terang
    if (state.phase === 'MOVE') {
      agents.forEach((a, i) => {
        if (a.attractor < 0) return;
        const from = pos[i];
        const to = pos[a.attractor];
        ctx.strokeStyle = hexToRgba(COLORS.cyanLight, 0.15 + 0.6 * a.pull);
        ctx.lineWidth = (1 + 4 * a.pull) * u;
        ctx.setLineDash([10 * u, 7 * u]);
        ctx.lineDashOffset = -t * 40;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      });
      ctx.setLineDash([]);
    }

    // Langkah acak: goresan pendek
    if (state.phase === 'WALK') {
      agents.forEach((a) => {
        const p0 = vp.worldToScreen(a.stepFrom[0], a.stepFrom[1]);
        const p1 = vp.worldToScreen(a.x[0], a.x[1]);
        ctx.strokeStyle = hexToRgba('#ffffff', 0.5 * (1 - alpha * 0.4));
        ctx.lineWidth = 2 * u;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      });
    }

    agents.forEach((a, i) => {
      const isBest = i === state.brightestIndex;
      drawFirefly(ctx, pos[i].x, pos[i].y, 22 * u, {
        glow: state.phase === 'INIT' ? 0.5 : a.glow,
        t,
        color: isBest ? COLORS.gold : COLORS.cyan,
        core: isBest ? '#fff6d6' : '#f4fdff',
        crown: isBest && state.phase !== 'INIT'
      });
    });

    if (state.best) {
      const b = vp.worldToScreen(state.best.x[0], state.best.x[1]);
      ring(ctx, b.x, b.y, 26 * u + Math.sin(t * 4) * 2 * u, hexToRgba(COLORS.gold, 0.9), 3 * u, [6 * u, 5 * u]);
      drawText(ctx, 'terbaik', b.x, b.y - 40 * u, { size: 20 * u, color: COLORS.gold, align: 'center' });
    }
  }
}

export class BARenderer {
  constructor() {
    this.cache = new TopoMap();
  }

  render(canvas, state, objective, { alpha = 1, timestamp = 0, padding } = {}) {
    const { ctx, width, height } = fitCanvas(canvas);
    ctx.clearRect(0, 0, width, height);
    const vp = this.cache.paint(ctx, width, height, objective, 'ba', { padding });
    if (!vp) return;
    const u = Math.min(width, height) / 900;
    const t = timestamp / 1000;
    const agents = state.agents;
    const phase = state.phase;
    const span = objective.max - objective.min;

    const bestPt = state.best ? vp.worldToScreen(state.best.x[0], state.best.x[1]) : null;

    // Lingkaran jelajah lokal di sekitar x*
    if (phase === 'LOCAL' && bestPt) {
      const radius = vp.worldDistToPx(state.params.localRadius ?? state.meanA * 0.1 * span);
      ring(ctx, bestPt.x, bestPt.y, radius, hexToRgba(COLORS.pink, 0.85), 3 * u, [8 * u, 6 * u]);
    }

    agents.forEach((a, i) => {
      const bat = worldPos(vp, a.px, a.x, phase === 'ACCEPT' ? alpha : 1);
      if (phase === 'PULSE') drawEcho(ctx, bat.x, bat.y, (alpha * 0.9 + (i % 3) * 0.05) % 1, COLORS.purpleLight, 70 * u, 0.9);
      if (a.trial && (phase === 'PULSE' || phase === 'LOCAL' || phase === 'ACCEPT')) {
        const fromTrial = a.trialPrev || a.x;
        const tp = phase === 'ACCEPT' ? vp.worldToScreen(a.trial[0], a.trial[1]) : worldPos(vp, fromTrial, a.trial, alpha);
        const local = a.mode === 'local';
        const col = local ? COLORS.pink : COLORS.purpleLight;
        if (phase !== 'ACCEPT') {
          ctx.strokeStyle = hexToRgba(col, 0.55);
          ctx.lineWidth = 2 * u;
          ctx.setLineDash([8 * u, 7 * u]);
          ctx.beginPath();
          ctx.moveTo(bat.x, bat.y);
          ctx.lineTo(tp.x, tp.y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.save();
          ctx.translate(tp.x, tp.y);
          ctx.rotate(Math.PI / 4);
          ctx.strokeStyle = col;
          ctx.lineWidth = 3 * u;
          ctx.strokeRect(-7 * u, -7 * u, 14 * u, 14 * u);
          ctx.restore();
        } else if (a.accepted) {
          drawCheck(ctx, tp.x, tp.y - 20 * u, 9 * u, COLORS.lime, 0.4 + 0.6 * alpha);
        } else {
          drawCross(ctx, tp.x, tp.y, 8 * u, COLORS.coral, 0.9 - 0.3 * alpha);
        }
      }
    });

    agents.forEach((a, i) => {
      const bat = worldPos(vp, a.px, a.x, phase === 'ACCEPT' ? alpha : 1);
      const isBest = state.best && Math.abs(a.f - state.best.fitness) < 1e-12;
      drawBat(ctx, bat.x, bat.y, 18 * u, {
        flap: t * 12 + i,
        color: isBest ? '#fcd34d' : COLORS.purple,
        edge: isBest ? '#fff6d6' : COLORS.purpleLight,
        crown: isBest && phase !== 'INIT',
        glow: isBest ? 1 : 0
      });
    });

    if (bestPt) {
      ring(ctx, bestPt.x, bestPt.y, 30 * u + Math.sin(t * 4) * 2 * u, hexToRgba(COLORS.gold, 0.9), 3 * u, [6 * u, 5 * u]);
      drawText(ctx, 'x*', bestPt.x + 40 * u, bestPt.y + 30 * u, { size: 24 * u, color: COLORS.gold, mono: true });
    }
  }
}
