import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const walk = (dir) =>
  fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]
  );

// Slide membutuhkan DOM saat mount saja, import modulnya aman di Node.
const { slides } = await import('../src/slides/index.js');

test('ada 20 slide dengan id unik dan semua bab terwakili', () => {
  assert.equal(slides.length, 20);
  const ids = slides.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  const chapters = new Set(slides.map((s) => s.chapter.id));
  for (const id of ['masalah', 'metaheuristik', 'firefly', 'bat', 'model', 'cloud', 'hasil', 'penutup']) {
    assert.ok(chapters.has(id), `bab ${id} tidak ada`);
  }
});

test('setiap slide punya judul, fungsi mount, dan catatan presenter', () => {
  for (const s of slides) {
    assert.ok(s.title, `${s.id} tanpa judul`);
    assert.equal(typeof s.mount, 'function', `${s.id} tanpa mount`);
    assert.ok(typeof s.notes === 'string' && s.notes.trim().length > 40, `${s.id} tanpa catatan`);
  }
});

test('index.html memuat elemen yang dibutuhkan navigasi', () => {
  const html = read('index.html');
  for (const id of ['frame', 'slides', 'spine', 'presenter-notes', 'overview', 'shortcuts-modal']) {
    assert.ok(html.includes(`id="${id}"`), `elemen ${id} hilang`);
  }
  assert.ok(html.includes('app.bundle.js'), 'jalur file:// ke app.bundle.js hilang');
  assert.ok(html.includes('src/main.js'), 'jalur http ke src/main.js hilang');
});

test('palet navy, biru, cyan, dan ungu ada di CSS', () => {
  const css = read('src/styles/tokens.css');
  for (const token of ['--cyan', '--violet', '--blue', '--bg-0']) assert.ok(css.includes(token), token);
});

test('tanpa CDN atau URL eksternal di kode dan CSS (jalan offline dan di GitHub Pages)', () => {
  const files = [...walk('src').filter((f) => /\.(js|css|html)$/.test(f) && !f.endsWith('fonts.css')), 'index.html'];
  for (const f of files) {
    const text = read(f).replace(/https?:\/\/(www\.)?(w3\.org|jatit\.org|ieeexplore\.ieee\.org)[^\s'"`)]*/g, '');
    assert.ok(!/(src|href)=["']https?:\/\//.test(text), `${f} memuat sumber eksternal`);
    assert.ok(!/@import\s+url\(["']?https?:/.test(text), `${f} mengimpor CSS eksternal`);
    assert.ok(!/fetch\(\s*["'`]https?:/.test(text), `${f} memanggil API eksternal`);
  }
});

test('src/algorithms murni logika: tidak menyentuh document, window, atau canvas', () => {
  for (const f of walk('src/algorithms')) {
    const code = read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert.ok(!/\b(document|window|HTMLElement|requestAnimationFrame)\b/.test(code), `${f} memakai API browser`);
  }
});

test('bundel untuk file:// dan folder dist tersedia', () => {
  assert.ok(fs.existsSync(path.join(root, 'public/app.bundle.js')), 'jalankan npm run build');
  assert.ok(fs.existsSync(path.join(root, 'dist/index.html')), 'dist/index.html hilang');
});
