// Uji E2E opsional (butuh playwright): buka tiap slide, majukan beat, ambil screenshot, laporkan error konsol.
// Pakai:  node tests/e2e/walk.mjs [file|http] [folderKeluaran]
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mode = process.argv[2] || 'file';
const out = process.argv[3] || '/tmp/shots';
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
const errors = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errors.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));

let url = `file://${root}/index.html`;
let server = null;
if (mode === 'http') {
  const http = await import('node:http');
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.ttf': 'font/ttf' };
  server = http.createServer((req, res) => {
    const p = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
    fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); } else { res.writeHead(200, { 'content-type': mime[path.extname(p)] || 'application/octet-stream' }); res.end(d); } });
  }).listen(4599);
  url = 'http://127.0.0.1:4599/';
}
await page.goto(url);
await page.waitForTimeout(1500);
const total = await page.evaluate(() => window.__FA_BA_DECK__.slides.length);
console.log('mode', mode, 'slides', total);

for (let i = 0; i < total; i++) {
  await page.evaluate((k) => window.__FA_BA_DECK__.goTo(k), i);
  await page.waitForTimeout(900);
  const info = await page.evaluate(() => {
    const d = window.__FA_BA_DECK__;
    return { id: d.slides[d.index].id, beats: d.slides[d.index].beats || 1 };
  });
  for (let b = 0; b < info.beats; b++) {
    if (b > 0) { await page.keyboard.press('ArrowRight'); }
    await page.waitForTimeout(info.id === 'masalah' && b === 1 ? 7500 : info.id === 'lanskap' ? 4200 : 2600);
    await page.screenshot({ path: path.join(out, `${String(i + 1).padStart(2, '0')}-${info.id}-b${b}.png`) });
  }
}
console.log('--- konsol ---');
console.log(errors.length ? [...new Set(errors)].slice(0, 20).join('\n') : '(kosong)');
await browser.close();
server?.close();
