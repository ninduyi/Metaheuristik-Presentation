/**
 * Gambar jadwal tugas pada VM (diagram Gantt sederhana): satu lajur per VM, satu blok per tugas.
 * Lebar blok = waktu eksekusi (MI / MIPS). Garis putus-putus vertikal = makespan.
 */

import { COLORS, drawText, hexToRgba } from './sprites.js';

export const TASK_COLORS = ['#3b82f6', '#22d3ee', '#8b5cf6', '#f472b6', '#fbbf24', '#a3e635', '#fb7185', '#38bdf8'];

export function taskColor(id) {
  return TASK_COLORS[(id - 1) % TASK_COLORS.length];
}

/** Peta id tugas -> { lane, start, dur } dari hasil evaluateAssignment. */
export function layoutOf(ev) {
  const map = new Map();
  ev.vmTasks.forEach((list, lane) => {
    for (const t of list) map.set(t.id, { lane, start: t.start, dur: t.execSec, mi: t.mi });
  });
  return map;
}

const lerp = (a, b, t) => a + (b - a) * t;

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{x:number,y:number,w:number,h:number}} rect
 * @param {Array} tasks
 * @param {Array} vms
 * @param {Map} to - tata letak akhir (layoutOf)
 * @param {Object} [opts]
 * @param {Map} [opts.from] - tata letak awal untuk animasi
 * @param {number} [opts.alpha] - 0..1
 * @param {number} opts.tMax - batas skala waktu (detik)
 * @param {number} [opts.makespan]
 * @param {number} [opts.ideal]
 * @param {Function} [opts.appear] - (index) => 0..1 untuk animasi masuk dari antrean
 * @param {{x:number,y:number}} [opts.queue] - posisi awal blok yang belum masuk
 * @param {string} [opts.laneColor]
 */
export function drawSchedule(ctx, rect, tasks, vms, to, opts = {}) {
  const { from = null, alpha = 1, tMax, makespan = null, ideal = null, appear = null, queue = null, laneColor = COLORS.blue, labelW = 168, fontScale = 1 } = opts;
  const laneGap = 14;
  const laneH = (rect.h - laneGap * (vms.length - 1)) / vms.length;
  const trackX = rect.x + labelW;
  const trackW = rect.w - labelW;
  const secToPx = trackW / tMax;

  vms.forEach((vm, j) => {
    const y = rect.y + j * (laneH + laneGap);
    ctx.fillStyle = hexToRgba(laneColor, 0.1);
    ctx.beginPath();
    ctx.roundRect(trackX, y, trackW, laneH, 14);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(laneColor, 0.35);
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = hexToRgba(laneColor, 0.22);
    ctx.beginPath();
    ctx.roundRect(rect.x, y, labelW - 12, laneH, 14);
    ctx.fill();
    drawText(ctx, vm.name, rect.x + 16, y + laneH * 0.36, { size: Math.min(30, laneH * 0.34) * fontScale, color: COLORS.ink });
    drawText(ctx, `${vm.mips} MIPS`, rect.x + 16, y + laneH * 0.72, { size: Math.min(22, laneH * 0.26) * fontScale, weight: 600, color: COLORS.muted, mono: true });
  });

  if (ideal != null) {
    const ix = trackX + ideal * secToPx;
    ctx.save();
    ctx.strokeStyle = hexToRgba(COLORS.lime, 0.85);
    ctx.lineWidth = 3;
    ctx.setLineDash([3, 8]);
    ctx.beginPath();
    ctx.moveTo(ix, rect.y - 14);
    ctx.lineTo(ix, rect.y + rect.h + 6);
    ctx.stroke();
    ctx.restore();
  }

  tasks.forEach((task, idx) => {
    const target = to.get(task.id);
    if (!target) return;
    const prev = from && from.get(task.id) ? from.get(task.id) : target;
    const lane = lerp(prev.lane, target.lane, alpha);
    const start = lerp(prev.start, target.start, alpha);
    const dur = lerp(prev.dur, target.dur, alpha);
    let bx = trackX + start * secToPx;
    let by = rect.y + lane * (laneH + laneGap) + 6;
    let bw = Math.max(4, dur * secToPx - 3);
    const bh = laneH - 12;
    let a = 1;
    if (appear) {
      const p = appear(idx);
      if (p <= 0) return;
      if (p < 1 && queue) {
        const e = 1 - Math.pow(1 - p, 3);
        bx = lerp(queue.x + (idx % 4) * 8, bx, e);
        by = lerp(queue.y + (idx % 5) * 6, by, e) - Math.sin(Math.PI * e) * 120;
      }
      a = Math.min(1, p * 3);
    }
    const color = taskColor(task.id);
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 9);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh * 0.4, 9);
    ctx.fill();
    if (bw > 38 * fontScale) {
      drawText(ctx, task.name, bx + bw / 2, by + bh / 2, {
        size: Math.min(24, bh * 0.46) * fontScale,
        color: '#050d26',
        align: 'center',
        weight: 800
      });
    }
    ctx.restore();
  });

  if (makespan != null) {
    const mx = trackX + makespan * secToPx;
    ctx.save();
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.moveTo(mx, rect.y - 14);
    ctx.lineTo(mx, rect.y + rect.h + 6);
    ctx.stroke();
    ctx.restore();
  }
}
