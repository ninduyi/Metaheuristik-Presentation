/**
 * Peta topografi neon untuk lanskap 2D. Medan nilai diwarnai tipis (lembah lebih terang),
 * lalu ditandai garis isoline yang menyala: tiap garis keempat dibuat lebih tebal seperti garis indeks peta.
 * Hasilnya disimpan di kanvas luar layar sehingga tiap frame cukup satu drawImage.
 * Skala piksel seragam menjaga lingkaran jarak tetap bulat sempurna.
 */

import { drawStar } from './sprites.js';

// Tiap tone: warna dasar gelap, warna lembah, dan warna isoline (RGB)
const TONES = {
  fa: { base: [4, 14, 40], valley: [8, 64, 112], line: [94, 234, 252], glow: [34, 211, 238] },
  ba: { base: [10, 10, 38], valley: [58, 38, 130], line: [196, 181, 253], glow: [139, 92, 246] }
};

const mix = (a, b, t) => a + (b - a) * t;
const smoothstep = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** Pemetaan koordinat dunia (domain fungsi) ke piksel kanvas dan sebaliknya. */
export function makeView(width, height, landscape, padding = 0.07) {
  const span = landscape.max - landscape.min;
  const scale = Math.max(1, (Math.min(width, height) * (1 - padding * 2)) / span);
  const mid = (landscape.min + landscape.max) / 2;
  const cx = width / 2;
  const cy = height / 2;
  return {
    width,
    height,
    scale,
    worldToScreen: (wx, wy) => ({ x: cx + (wx - mid) * scale, y: cy - (wy - mid) * scale }),
    screenToWorld: (px, py) => ({ x: mid + (px - cx) / scale, y: mid - (py - cy) / scale }),
    worldDistToPx: (d) => d * scale
  };
}

export class TopoMap {
  constructor() {
    this.key = '';
    this.layer = null;
  }

  /** Menggambar peta ke ctx dan mengembalikan view-nya. Bitmap dihitung ulang hanya bila ukuran atau jenisnya berubah. */
  paint(ctx, width, height, landscape, tone = 'fa', { padding = 0.07, showOptimum = true } = {}) {
    if (width <= 2 || height <= 2) return null;
    const view = makeView(width, height, landscape, padding);
    const key = `${width}x${height}|${landscape.id}|${tone}|${padding}`;
    if (key !== this.key || !this.layer) {
      this.key = key;
      this.layer = this.#bake(width, height, landscape, tone, view);
    }
    ctx.drawImage(this.layer, 0, 0, width, height);

    const a = view.worldToScreen(landscape.min, landscape.max);
    const b = view.worldToScreen(landscape.max, landscape.min);
    ctx.save();
    ctx.strokeStyle = 'rgba(165, 243, 252, 0.28)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([3, 7]);
    ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    ctx.restore();

    if (showOptimum) {
      const o = view.worldToScreen(landscape.optimum.x, landscape.optimum.y);
      drawStar(ctx, o.x, o.y, Math.max(9, Math.min(width, height) * 0.021));
    }
    return view;
  }

  #bake(width, height, landscape, tone, view) {
    const palette = TONES[tone] ?? TONES.fa;
    const down = 2;
    const w = Math.max(2, Math.ceil(width / down));
    const h = Math.max(2, Math.ceil(height / down));
    const ceiling = landscape.maxVisualValue || 50;
    const BANDS = 16;

    // Medan nilai ternormalisasi, diperkuat akar agar lembah dalam tidak tenggelam
    const level = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = view.screenToWorld((x + 0.5) * down, (y + 0.5) * down);
        level[y * w + x] = Math.min(1, Math.max(0, landscape.evaluate(p.x, p.y) / ceiling)) ** 0.55;
      }
    }

    const small = document.createElement('canvas');
    small.width = w;
    small.height = h;
    const sctx = small.getContext('2d');
    const image = sctx.createImageData(w, h);
    const px = image.data;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const n = level[i];
        const depth = (1 - n) ** 2.2; // 1 di dasar lembah, 0 di puncak
        let r = mix(palette.base[0], palette.valley[0], depth);
        let g = mix(palette.base[1], palette.valley[1], depth);
        let b = mix(palette.base[2], palette.valley[2], depth);

        // Isoline dengan lebar tetap dalam piksel: jarak ke garis dibagi laju perubahan medan
        const v = n * BANDS;
        const slope = Math.abs(v - level[x > 0 ? i - 1 : i] * BANDS) + Math.abs(v - level[y > 0 ? i - w : i] * BANDS) + 1e-4;
        const nearest = Math.round(v);
        const dist = Math.abs(v - nearest);
        const isIndex = nearest % 4 === 0;
        const line = 1 - smoothstep(0, (isIndex ? 1.15 : 0.7) * slope, dist);
        if (line > 0) {
          const strength = line * (isIndex ? 0.95 : 0.5) * (0.35 + 0.65 * depth + 0.25);
          r = mix(r, palette.line[0], Math.min(1, strength));
          g = mix(g, palette.line[1], Math.min(1, strength));
          b = mix(b, palette.line[2], Math.min(1, strength));
        }
        const o = i * 4;
        px[o] = r;
        px[o + 1] = g;
        px[o + 2] = b;
        px[o + 3] = 255;
      }
    }
    sctx.putImageData(image, 0, 0);

    const layer = document.createElement('canvas');
    layer.width = width;
    layer.height = height;
    const lctx = layer.getContext('2d');
    lctx.imageSmoothingQuality = 'high';
    lctx.drawImage(small, 0, 0, w, h, 0, 0, width, height);

    // Cahaya lembut di titik optimum dan vinyet di tepi
    const o = view.worldToScreen(landscape.optimum.x, landscape.optimum.y);
    const halo = lctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, Math.min(width, height) * 0.28);
    halo.addColorStop(0, `rgba(${palette.glow.join(',')},0.28)`);
    halo.addColorStop(1, `rgba(${palette.glow.join(',')},0)`);
    lctx.fillStyle = halo;
    lctx.fillRect(0, 0, width, height);
    const vignette = lctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.32, width / 2, height / 2, Math.max(width, height) * 0.75);
    vignette.addColorStop(0, 'rgba(3,8,26,0)');
    vignette.addColorStop(1, 'rgba(3,8,26,0.6)');
    lctx.fillStyle = vignette;
    lctx.fillRect(0, 0, width, height);
    return layer;
  }
}
