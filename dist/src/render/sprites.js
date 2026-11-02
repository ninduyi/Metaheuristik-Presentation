/**
 * Gambar vektor Canvas 2D yang dipakai bersama oleh scene dan renderer:
 * kunang-kunang, kelelawar, gelombang gema, bintang optimum, panah, label, dan latar malam.
 */

export const COLORS = {
  ink: '#f2f7ff',
  muted: '#a9bbd6',
  night: '#050d26',
  navy: '#0b1a40',
  blue: '#3b82f6',
  blueLight: '#93c5fd',
  cyan: '#22d3ee',
  cyanLight: '#a5f3fc',
  purple: '#8b5cf6',
  purpleLight: '#c4b5fd',
  pink: '#f472b6',
  gold: '#fbbf24',
  lime: '#a3e635',
  coral: '#fb7185'
};

export const FONT_BODY = '"Manrope", "Sora", sans-serif';
export const FONT_MONO = '"Red Hat Mono", "Manrope", monospace';

export function drawText(ctx, text, x, y, options = {}) {
  const { size = 30, weight = 700, color = COLORS.ink, align = 'left', mono = false, alpha = 1, baseline = 'middle' } = options;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = `${weight} ${size}px ${mono ? FONT_MONO : FONT_BODY}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** Label di dalam kapsul berwarna; (x, y) adalah titik tengah kapsul. */
export function drawPill(ctx, text, x, y, options = {}) {
  const { size = 28, weight = 700, color = COLORS.night, fill = COLORS.gold, alpha = 1, mono = false } = options;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = `${weight} ${size}px ${mono ? FONT_MONO : FONT_BODY}`;
  const w = ctx.measureText(text).width + size * 1.2;
  const h = size * 1.75;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
  ctx.restore();
}

export function fillBackground(ctx, width, height, stops) {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  stops.forEach((color, i) => grad.addColorStop(i / Math.max(1, stops.length - 1), color));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

export function drawGlow(ctx, x, y, radius, color) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, color);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function pseudo(i) {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}

/**
 * Latar malam berwarna: gradien navy ke ungu, bola cahaya yang melayang, titik-titik grid, dan bintang berkedip.
 * `tint` memilih nuansa: 'cyan' (Firefly), 'purple' (Bat), 'blue' (netral).
 */
const TINTS = {
  blue: { top: '#071433', mid: '#0b1f55', bottom: '#0a1030', orbs: ['#2563eb', '#22d3ee', '#8b5cf6'] },
  cyan: { top: '#04142e', mid: '#062a4d', bottom: '#041a2e', orbs: ['#22d3ee', '#3b82f6', '#8b5cf6'] },
  purple: { top: '#0b0b2e', mid: '#1c1252', bottom: '#0a0a26', orbs: ['#8b5cf6', '#ec4899', '#3b82f6'] },
  gold: { top: '#0a1233', mid: '#17154a', bottom: '#080f2b', orbs: ['#f59e0b', '#8b5cf6', '#22d3ee'] }
};

export function drawBackdrop(ctx, t, tint = 'blue', W = 1920, H = 1080) {
  const p = TINTS[tint] || TINTS.blue;
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, p.top);
  grad.addColorStop(0.55, p.mid);
  grad.addColorStop(1, p.bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  p.orbs.forEach((color, i) => {
    const ox = W * (0.2 + 0.3 * i) + Math.sin(t * 0.13 + i * 2.1) * 140;
    const oy = H * (0.35 + 0.18 * Math.sin(i * 1.7)) + Math.cos(t * 0.11 + i) * 90;
    drawGlow(ctx, ox, oy, 560, hexToRgba(color, 0.2));
  });
  ctx.restore();

  ctx.fillStyle = 'rgba(165, 190, 255, 0.07)';
  for (let gx = 40; gx < W; gx += 80) {
    for (let gy = 40; gy < H; gy += 80) ctx.fillRect(gx, gy, 3, 3);
  }

  for (let i = 0; i < 70; i++) {
    const sx = pseudo(i + 1) * W;
    const sy = pseudo(i + 91) * H * 0.9;
    const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.5 + pseudo(i + 7)) + i));
    ctx.fillStyle = `rgba(220, 235, 255, ${(0.18 + 0.5 * pseudo(i + 33)) * tw})`;
    const s = 1.5 + pseudo(i + 55) * 2.4;
    ctx.fillRect(sx, sy, s, s);
  }
}

export function hexToRgba(hex, alpha = 1) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/**
 * Kunang-kunang: halo bercahaya, tubuh gelap kecil, sayap berkepak, dan perut menyala.
 * `glow` 0..1 mengatur kecerahan (0 hampir padam, 1 sangat terang).
 */
export function drawFirefly(ctx, x, y, size, options = {}) {
  const { glow = 1, color = COLORS.cyan, core = '#f4fdff', t = 0, angle = 0, alpha = 1, crown = false } = options;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.globalCompositeOperation = 'lighter';
  const g = Math.max(0.05, Math.min(1, glow));
  drawGlow(ctx, x, y, size * (1.2 + 3.6 * g), hexToRgba(color, 0.18 + 0.5 * g));
  ctx.restore();

  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);
  const flap = Math.sin(t * 38 + x * 0.1) * 0.35;
  ctx.fillStyle = 'rgba(200, 235, 255, 0.45)';
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.rotate(side * (0.7 + flap));
    ctx.beginPath();
    ctx.ellipse(side * size * 0.45, -size * 0.35, size * 0.55, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#10243f';
  ctx.beginPath();
  ctx.ellipse(0, -size * 0.2, size * 0.2, size * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hexToRgba(core, 0.35 + 0.65 * g);
  ctx.beginPath();
  ctx.ellipse(0, size * 0.28, size * 0.3, size * 0.44, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hexToRgba(color, 0.55 * g);
  ctx.beginPath();
  ctx.ellipse(0, size * 0.28, size * 0.2, size * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (crown) drawCrown(ctx, x, y - size * 0.95, size * 0.62);
}

export function drawCrown(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(-size, size * 0.5);
  ctx.lineTo(-size, -size * 0.4);
  ctx.lineTo(-size * 0.5, size * 0.05);
  ctx.lineTo(0, -size * 0.6);
  ctx.lineTo(size * 0.5, size * 0.05);
  ctx.lineTo(size, -size * 0.4);
  ctx.lineTo(size, size * 0.5);
  ctx.closePath();
  ctx.fillStyle = COLORS.gold;
  ctx.strokeStyle = COLORS.night;
  ctx.lineWidth = Math.max(1.5, size * 0.12);
  ctx.lineJoin = 'round';
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function batWing(ctx, side, s, f) {
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.1);
  ctx.quadraticCurveTo(side * s * 0.9, -s * (0.75 + 0.5 * f), side * s * 1.7, -s * (0.2 + 0.9 * f));
  ctx.quadraticCurveTo(side * s * 1.4, s * (0.05 - 0.2 * f), side * s * 1.2, s * (0.4 - 0.3 * f));
  ctx.quadraticCurveTo(side * s * 0.9, s * (0.1 - 0.1 * f), side * s * 0.62, s * 0.5);
  ctx.quadraticCurveTo(side * s * 0.34, s * 0.22, 0, s * 0.55);
  ctx.closePath();
}

/** Kelelawar tampak depan. `flap` adalah fase kepak (detik * kecepatan). */
export function drawBat(ctx, x, y, size, options = {}) {
  const { color = COLORS.purple, edge = COLORS.purpleLight, flap = 0, angle = 0, alpha = 1, crown = false, glow = 0 } = options;
  const f = Math.sin(flap);
  if (glow > 0) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    drawGlow(ctx, x, y, size * (2 + 2 * glow), hexToRgba(edge, 0.3 * glow));
    ctx.restore();
  }
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.strokeStyle = edge;
  ctx.lineWidth = Math.max(1.5, size * 0.07);
  ctx.lineJoin = 'round';
  for (const side of [-1, 1]) {
    batWing(ctx, side, size, f);
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(0, size * 0.1, size * 0.28, size * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -size * 0.4, size * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * size * 0.08, -size * 0.58);
    ctx.lineTo(side * size * 0.3, -size * 0.92);
    ctx.lineTo(side * size * 0.3, -size * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#fff';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(side * size * 0.1, -size * 0.43, size * 0.045, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  if (crown) drawCrown(ctx, x, y - size * 1.15, size * 0.55);
}

/** Gelombang gema yang membesar dari titik (x, y). progress 0..1, bisa diulang dengan modulo. */
export function drawEcho(ctx, x, y, progress, color = COLORS.purpleLight, maxRadius = 120, alpha = 1) {
  if (progress <= 0 || progress >= 1) return;
  ctx.save();
  ctx.strokeStyle = color;
  for (const delay of [0, 0.25, 0.5]) {
    const p = (progress - delay) / (1 - delay);
    if (p <= 0 || p >= 1) continue;
    ctx.globalAlpha = (1 - p) * 0.75 * alpha;
    ctx.lineWidth = Math.max(1.4, maxRadius * 0.035 * (1 - p));
    ctx.beginPath();
    ctx.arc(x, y, maxRadius * p, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawRipple(ctx, x, y, progress, color = '#bff5ea', maxRadius = 60) {
  if (progress <= 0 || progress >= 1) return;
  ctx.save();
  ctx.strokeStyle = color;
  for (const delay of [0, 0.22]) {
    const p = (progress - delay) / (1 - delay);
    if (p <= 0) continue;
    ctx.globalAlpha = (1 - p) * 0.85;
    ctx.lineWidth = Math.max(1.2, maxRadius * 0.05 * (1 - p));
    ctx.beginPath();
    ctx.arc(x, y, maxRadius * p, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawStar(ctx, x, y, size, options = {}) {
  const { glow = true, alpha = 1 } = options;
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (glow) drawGlow(ctx, x, y, size * 2.8, 'rgba(251, 191, 36, 0.62)');
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? size : size * 0.44;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fillStyle = COLORS.gold;
  ctx.strokeStyle = COLORS.night;
  ctx.lineWidth = Math.max(1, size * 0.14);
  ctx.lineJoin = 'round';
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function arcPoint(from, to, bend, p) {
  const cx = (from.x + to.x) / 2;
  const cy = (from.y + to.y) / 2 - bend;
  const q = 1 - p;
  return {
    x: q * q * from.x + 2 * q * p * cx + p * p * to.x,
    y: q * q * from.y + 2 * q * p * cy + p * p * to.y
  };
}

/** Panah melengkung yang tergambar bertahap sesuai `progress`. */
export function drawArrow(ctx, from, to, options = {}) {
  const { bend = 0, color = COLORS.ink, width = 4, progress = 1, dashed = false, alpha = 1, head = true } = options;
  if (progress <= 0) return;
  const tip = arcPoint(from, to, bend, progress);
  const before = arcPoint(from, to, bend, Math.max(0, progress - 0.03));
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  if (dashed) ctx.setLineDash([width * 3, width * 2.4]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  const steps = Math.max(2, Math.ceil(progress * 28));
  for (let i = 1; i <= steps; i++) {
    const pt = arcPoint(from, to, bend, (i / steps) * progress);
    ctx.lineTo(pt.x, pt.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  if (head) {
    const angle = Math.atan2(tip.y - before.y, tip.x - before.x);
    const len = width * 4;
    ctx.beginPath();
    ctx.moveTo(tip.x + Math.cos(angle) * len * 0.3, tip.y + Math.sin(angle) * len * 0.3);
    ctx.lineTo(tip.x - Math.cos(angle - 0.5) * len, tip.y - Math.sin(angle - 0.5) * len);
    ctx.lineTo(tip.x - Math.cos(angle + 0.5) * len, tip.y - Math.sin(angle + 0.5) * len);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function drawCross(ctx, x, y, size, color = COLORS.coral, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(3, size * 0.32);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - size, y - size);
  ctx.lineTo(x + size, y + size);
  ctx.moveTo(x + size, y - size);
  ctx.lineTo(x - size, y + size);
  ctx.stroke();
  ctx.restore();
}

export function drawCheck(ctx, x, y, size, color = COLORS.lime, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(3, size * 0.32);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x - size * 0.3, y + size * 0.7);
  ctx.lineTo(x + size, y - size * 0.7);
  ctx.stroke();
  ctx.restore();
}

/**
 * Teks matematika sederhana: `x_i`, `x_{ij}`, `r^2`, `e^{-γr^2}`. Mengembalikan lebar total.
 * Subskrip dan superskrip digambar dengan ukuran 62% dan digeser naik atau turun.
 */
export function drawMath(ctx, text, x, y, options = {}) {
  const { size = 34, color = COLORS.ink, weight = 600, alpha = 1, measureOnly = false } = options;
  const tokens = [];
  const re = /([_^])(\{[^}]*\}|.)|([^_^]+)/g;
  let m;
  while ((m = re.exec(text))) {
    if (m[3] !== undefined) tokens.push({ t: m[3], mode: 'n' });
    else tokens.push({ t: m[2].replace(/^\{|\}$/g, ''), mode: m[1] === '_' ? 'sub' : 'sup' });
  }
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let cx = x;
  for (const tok of tokens) {
    const small = tok.mode !== 'n';
    const s = small ? size * 0.62 : size;
    ctx.font = `${weight} ${s}px ${FONT_MONO}`;
    const dy = tok.mode === 'sub' ? size * 0.22 : tok.mode === 'sup' ? -size * 0.3 : 0;
    if (!measureOnly) ctx.fillText(tok.t, cx, y + dy);
    cx += ctx.measureText(tok.t).width;
  }
  ctx.restore();
  return cx - x;
}
