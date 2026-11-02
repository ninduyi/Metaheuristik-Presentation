/**
 * Alat gerak untuk animasi kanvas: fungsi easing, segmen waktu, dan loop gambar berskala.
 * Semua scene digambar pada koordinat tetap STAGE_W x STAGE_H, sama dengan panggung presentasi,
 * sehingga kanvas dan elemen DOM selalu sejajar di ukuran layar mana pun.
 */

export const STAGE_W = 1920;
export const STAGE_H = 1080;

export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeOut = (t) => 1 - (1 - t) ** 3;
export const easeInOut = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
export const easeBack = (t) => 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2;

/** Seberapa jauh sebuah segmen waktu [start, start + length] sudah berjalan pada saat `time`, setelah di-ease. */
export function seg(time, start, length, ease = easeInOut) {
  return ease(clamp01((time - start) / Math.max(1e-6, length)));
}

/**
 * Menjalankan loop requestAnimationFrame untuk sebuah kanvas.
 * draw menerima konteks yang sudah diskalakan ke STAGE (atau width/height yang diberikan) dan
 * { t: detik sejak dibuka, bt: detik sejak beat aktif, beat, dt: selisih frame }.
 */
export function startCanvasLoop(canvas, draw, { calm = false, width = STAGE_W, height = STAGE_H } = {}) {
  let frameId = 0;
  let t0 = null;
  let beatT0 = null;
  let prev = null;
  let beat = 0;

  const tick = (now) => {
    t0 ??= now;
    beatT0 ??= now;

    const box = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const bw = Math.max(10, Math.floor(box.width * ratio));
    const bh = Math.max(10, Math.floor(box.height * ratio));
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(bw / width, 0, 0, bh / height, 0, 0);

    const dt = prev === null ? 0 : Math.min(0.1, (now - prev) / 1000);
    prev = now;

    // Mode gerakan dikurangi: waktu dibekukan dan tiap beat langsung tampil di keadaan akhirnya
    draw(ctx, { t: calm ? 0 : (now - t0) / 1000, bt: calm ? 60 : (now - beatT0) / 1000, beat, dt });
    frameId = requestAnimationFrame(tick);
  };
  frameId = requestAnimationFrame(tick);

  return {
    setBeat(next) {
      beat = next;
      beatT0 = null;
    },
    stop() {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }
  };
}

/** Menyesuaikan resolusi kanvas dengan ukuran CSS-nya dan mengembalikan konteks bersama ukuran logisnya. */
export function fitCanvas(canvas) {
  const box = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(10, Math.floor(box.width));
  const height = Math.max(10, Math.floor(box.height));
  if (canvas.width !== Math.floor(width * ratio) || canvas.height !== Math.floor(height * ratio)) {
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, width, height };
}
