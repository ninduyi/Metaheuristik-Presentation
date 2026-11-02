/**
 * Tiga lanskap uji dua dimensi untuk simulasi visual. Semuanya diminimalkan dan bernilai 0 di (0, 0).
 * Tiap lanskap menyimpan batas domain, nilai tertinggi yang ikut diwarnai, dan fungsi hitungnya.
 */

const TAU = Math.PI * 2;

function landscape(id, name, bounds, visualCeiling, evaluate) {
  return {
    id,
    name,
    min: -bounds,
    max: bounds,
    maxVisualValue: visualCeiling,
    optimum: { x: 0, y: 0, value: 0 },
    evaluate
  };
}

export const LANDSCAPES = {
  // Satu cekungan mulus: cocok untuk melihat konvergensi murni
  sphere: landscape('sphere', 'Sphere', 5.12, 52, (x, y) => x * x + y * y),

  // Kisi lembah lokal: ujian untuk kemampuan menjelajah
  rastrigin: landscape(
    'rastrigin',
    'Rastrigin',
    5.12,
    82,
    (x, y) => 20 + x * x + y * y - 10 * (Math.cos(TAU * x) + Math.cos(TAU * y))
  ),

  // Riak halus dengan lubang tajam di tengah
  ackley: landscape('ackley', 'Ackley', 5, 22.5, (x, y) => {
    const radial = Math.sqrt((x * x + y * y) / 2);
    const wave = (Math.cos(TAU * x) + Math.cos(TAU * y)) / 2;
    const value = 20 + Math.E - 20 * Math.exp(-0.2 * radial) - Math.exp(wave);
    return value < 1e-14 ? 0 : value;
  })
};

export function landscapeById(id) {
  return LANDSCAPES[id] ?? LANDSCAPES.sphere;
}
