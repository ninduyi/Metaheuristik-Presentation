// Mengubah berkas woff2 di public/fonts menjadi src/styles/fonts.css (base64) agar font ikut dibawa
// tanpa permintaan jaringan dan tetap jalan lewat file://. Jalankan ulang bila font diganti:  node scripts/generate-fonts-css.mjs
// Sumber font: paket @fontsource (Sora, Manrope, Red Hat Mono), semuanya berlisensi SIL OFL.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'public', 'fonts');

const FACES = [
  { family: 'Sora', file: 'sora-latin-600-normal.woff2', weight: 600, set: 'latin' },
  { family: 'Sora', file: 'sora-latin-800-normal.woff2', weight: 800, set: 'latin' },
  { family: 'Manrope', file: 'manrope-latin-500-normal.woff2', weight: 500, set: 'latin' },
  { family: 'Manrope', file: 'manrope-latin-700-normal.woff2', weight: 700, set: 'latin' },
  { family: 'Manrope', file: 'manrope-greek-500-normal.woff2', weight: 500, set: 'greek' },
  { family: 'Manrope', file: 'manrope-greek-700-normal.woff2', weight: 700, set: 'greek' },
  { family: 'Red Hat Mono', file: 'red-hat-mono-latin-500-normal.woff2', weight: 500, set: 'latin' },
  { family: 'Red Hat Mono', file: 'red-hat-mono-latin-600-normal.woff2', weight: 600, set: 'latin' }
];

const RANGE = {
  latin: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
  greek: 'U+0370-03FF'
};

let css = '/* Dibuat oleh scripts/generate-fonts-css.mjs. Jangan diedit tangan. */\n';
for (const f of FACES) {
  const b64 = fs.readFileSync(path.join(dir, f.file)).toString('base64');
  css += `@font-face {
  font-family: '${f.family}';
  font-style: normal;
  font-weight: ${f.weight};
  font-display: block;
  src: url(data:font/woff2;base64,${b64}) format('woff2');
  unicode-range: ${RANGE[f.set]};
}
`;
}
fs.writeFileSync(path.join(root, 'src', 'styles', 'fonts.css'), css);
console.log(`fonts.css ditulis (${(css.length / 1024).toFixed(0)} KB)`);
