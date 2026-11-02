/**
 * Pembangkit bilangan acak ber-seed (algoritma sfc32 dengan penebar seed splitmix32).
 * Seed yang sama selalu menghasilkan urutan yang sama, jadi setiap simulasi bisa diulang persis.
 */

function splitmix32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x9e3779b9) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 16), 0x21f0aaad);
    z = Math.imul(z ^ (z >>> 15), 0x735a2d97);
    return (z ^ (z >>> 15)) >>> 0;
  };
}

function seedToInt(seed) {
  if (typeof seed === 'number' && Number.isFinite(seed)) return Math.trunc(seed) >>> 0;
  let h = 0x811c9dc5;
  for (const ch of String(seed ?? '42')) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193);
  return h >>> 0;
}

export function createRandom(seed = 42) {
  const mix = splitmix32(seedToInt(seed));
  let a = mix();
  let b = mix();
  let c = mix();
  let d = mix();

  // sfc32 menghasilkan bilangan bulat 32 bit; dibagi 2^32 menjadi [0, 1)
  const next = () => {
    const t = (((a + b) >>> 0) + d) >>> 0;
    d = (d + 1) >>> 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) >>> 0;
    c = ((c << 21) | (c >>> 11)) >>> 0;
    c = (c + t) >>> 0;
    return t / 4294967296;
  };
  for (let i = 0; i < 12; i++) next(); // buang beberapa keluaran awal

  return {
    next,
    /** Bilangan real di [lo, hi). */
    range: (lo, hi) => lo + (hi - lo) * next(),
    /** Bilangan bulat di [lo, hi], keduanya termasuk. */
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1))
  };
}
