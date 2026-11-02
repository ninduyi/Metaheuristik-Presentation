/**
 * Grafik garis konvergensi: satu atau beberapa seri, legenda, dan label nilai akhir.
 * Ukuran huruf dan garis mengikuti ukuran kanvas agar tetap terbaca saat diproyeksikan.
 */

import { fitCanvas } from './motion.js';

function formatTick(val) {
  if (val === 0) return '0';
  if (val >= 100) return val.toFixed(0);
  if (val >= 10) return val.toFixed(0);
  if (val >= 1) return val.toFixed(1);
  if (val >= 0.1) return val.toFixed(2);
  return val.toExponential(0);
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Array<{label:string,color:string,data:Array<{iteration:number,bestFitness:number}>}>} seriesList
 * @param {{maxIterations?:number, yMin?:number, yMax?:number, legend?:boolean, decimals?:number}} options
 */
export function renderConvergenceChart(canvas, seriesList, options = {}) {
  if (!canvas) return;
  const { ctx, width, height } = fitCanvas(canvas);
  ctx.clearRect(0, 0, width, height);

  const u = Math.max(0.55, Math.min(1.5, Math.min(width / 610, height / 220)));
  const padLeft = 64 * u;
  const padRight = 70 * u;
  const hasLegend = options.legend !== false && seriesList.length > 1;
  const padTop = (hasLegend ? 50 : 22) * u;
  const padBottom = 34 * u;
  const plotW = Math.max(20, width - padLeft - padRight);
  const plotH = Math.max(20, height - padTop - padBottom);

  let maxIter = Math.max(10, options.maxIterations || 20);
  let maxVal = 0;
  let minVal = Infinity;
  for (const s of seriesList) {
    for (const pt of s.data) {
      if (pt.iteration > maxIter) maxIter = pt.iteration;
      if (pt.bestFitness > maxVal) maxVal = pt.bestFitness;
      if (pt.bestFitness < minVal) minVal = pt.bestFitness;
    }
  }
  const yMin = options.yMin ?? 0;
  const yTop = options.yMax ?? (maxVal <= yMin + 1e-6 ? yMin + 1 : yMin + (maxVal - yMin) * 1.08);
  const ySpan = Math.max(1e-9, yTop - yMin);

  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(169, 187, 214, 0.2)';
  ctx.font = `600 ${16 * u}px "Red Hat Mono", "Manrope", monospace`;
  ctx.fillStyle = '#a9bbd6';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= 2; i++) {
    const ratio = i / 2;
    const py = padTop + plotH - ratio * plotH;
    ctx.beginPath();
    ctx.moveTo(padLeft, py);
    ctx.lineTo(padLeft + plotW, py);
    ctx.stroke();
    ctx.fillText(formatTick(yMin + ratio * ySpan), padLeft - 10 * u, py);
  }

  ctx.textAlign = 'center';
  for (let i = 0; i <= 4; i++) {
    const iterVal = Math.round((i / 4) * maxIter);
    ctx.fillText(`${iterVal}`, padLeft + (iterVal / maxIter) * plotW, padTop + plotH + 19 * u);
  }

  const labels = [];
  for (const s of seriesList) {
    if (!s.data || s.data.length === 0) continue;
    const color = s.color || '#22d3ee';
    const points = s.data.map((pt) => ({
      px: padLeft + (pt.iteration / maxIter) * plotW,
      py: padTop + plotH - Math.max(0, Math.min(1, (pt.bestFitness - yMin) / ySpan)) * plotH
    }));

    if (seriesList.length === 1 && points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points[0].px, padTop + plotH);
      points.forEach((p) => ctx.lineTo(p.px, p.py));
      ctx.lineTo(points[points.length - 1].px, padTop + plotH);
      ctx.closePath();
      ctx.fillStyle = s.fill || 'rgba(34, 211, 238, 0.16)';
      ctx.fill();
    }

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = s.dashed ? 0 : 10 * u;
    if (s.dashed) ctx.setLineDash([10 * u, 8 * u]);
    ctx.beginPath();
    points.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.px, p.py);
      else ctx.lineTo(p.px, p.py);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = (s.width || 3.4) * u;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    const last = points[points.length - 1];
    if (!s.dashed) {
      ctx.beginPath();
      ctx.arc(last.px, last.py, 6 * u, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
    labels.push({ y: last.py, x: last.px, color, text: s.data[s.data.length - 1].bestFitness });
  }

  // Label nilai akhir, digeser agar tidak menumpuk
  labels.sort((a, b) => a.y - b.y);
  for (let i = 1; i < labels.length; i++) {
    if (labels[i].y - labels[i - 1].y < 20 * u) labels[i].y = labels[i - 1].y + 20 * u;
  }
  ctx.textAlign = 'left';
  ctx.font = `700 ${17 * u}px "Red Hat Mono", "Manrope", monospace`;
  const dec = options.decimals ?? 2;
  for (const l of labels) {
    ctx.fillStyle = l.color;
    ctx.fillText(l.text.toFixed(dec), Math.min(l.x + 12 * u, width - padRight + 6 * u), l.y);
  }

  if (hasLegend) {
    ctx.font = `700 ${18 * u}px "Manrope", sans-serif`;
    let lx = padLeft + 12 * u;
    for (const s of seriesList) {
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(lx, 20 * u, 6 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2f7ff';
      ctx.textAlign = 'left';
      ctx.fillText(s.label, lx + 14 * u, 20 * u);
      lx += ctx.measureText(s.label).width + 52 * u;
    }
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}
