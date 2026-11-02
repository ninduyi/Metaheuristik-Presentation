// Membuat public/app.bundle.js (satu berkas biasa untuk dibuka lewat file://) dan folder dist/ yang siap diunggah.
// Pakai esbuild: npm install, lalu npm run build.
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const at = (...p) => path.join(root, ...p);

await build({
  entryPoints: [at('src/main.js')],
  outfile: at('public/app.bundle.js'),
  bundle: true,
  format: 'iife',
  target: 'es2020',
  legalComments: 'none',
  banner: { js: '/* Firefly vs Bat: bundel untuk file://. Dibuat oleh scripts/build.mjs, jangan diedit tangan. */' }
});

fs.rmSync(at('dist'), { recursive: true, force: true });
fs.mkdirSync(at('dist'), { recursive: true });
fs.copyFileSync(at('index.html'), at('dist/index.html'));
for (const dir of ['src', 'public']) fs.cpSync(at(dir), at('dist', dir), { recursive: true });
fs.writeFileSync(at('dist/.nojekyll'), '');

const kb = (fs.statSync(at('public/app.bundle.js')).size / 1024).toFixed(0);
console.log(`Build berhasil: public/app.bundle.js (${kb} KB) dan dist/ siap diunggah.`);
