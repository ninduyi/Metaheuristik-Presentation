/**
 * Gerak latar yang deterministik: dua kali dibuka, gambarnya sama. Dipakai untuk bintang,
 * kunang-kunang dan kelelawar yang melayang di scene.
 */

/** Hash bilangan bulat (varian murmur) menjadi bilangan semu di [0, 1) untuk indeks i. */
export function hash01(i) {
  let h = (Math.trunc(i * 1000) ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Posisi melayang agen ke-i pada waktu t di dalam kotak `box`. */
export function drift(i, t, box = { x: 80, y: 330, w: 1760, h: 640 }) {
  const home = { x: box.x + hash01(i + 3) * box.w, y: box.y + hash01(i + 40) * box.h };
  const sway = (k, base, spread) => base + hash01(i + k) * spread;
  return {
    x: home.x + Math.sin(t * sway(0, 0.35, 0.45) + i) * sway(9, 40, 70),
    y: home.y + Math.cos(t * sway(5, 0.3, 0.4) + i * 2) * sway(11, 30, 55)
  };
}
