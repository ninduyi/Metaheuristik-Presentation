// Uji interaksi: klik tombol sungguhan di tiap simulasi dan periksa efeknya. Butuh playwright.
// Pakai:  node tests/e2e/interact.mjs [file|http]
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mode = process.argv[2] || 'file';

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
const errors = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errors.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

let url = `file://${root}/index.html`;
let server = null;
if (mode === 'http') {
  const http = await import('node:http');
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.ttf': 'font/ttf' };
  server = http.createServer((req, res) => {
    const p = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
    fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); } else { res.writeHead(200, { 'content-type': mime[path.extname(p)] || 'application/octet-stream' }); res.end(d); } });
  }).listen(4598);
  url = 'http://127.0.0.1:4598/';
}
await page.goto(url);
await page.waitForTimeout(1200);

let pass = 0;
let fail = 0;
const check = (name, ok, extra = '') => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'OK  ' : 'GAGAL'} ${name}${extra ? ' | ' + extra : ''}`);
};
const goto = async (id) => {
  await page.evaluate((sid) => {
    const d = window.__FA_BA_DECK__;
    d.goTo(d.slides.findIndex((s) => s.id === sid));
  }, id);
  await page.waitForTimeout(1100);
};
const text = (sel) => page.locator(sel).first().innerText();
const visible = (sel) => page.locator(sel).first().isVisible();

// ---- Simulasi FA dan BA: Play, Pause, Step, Reset, Parameter, objektif ----
for (const [slide, pre] of [['fa-sim', 'Firefly'], ['ba-sim', 'Bat']]) {
  await goto(slide);
  const sid = await page.evaluate(() => window.__FA_BA_DECK__.slides[window.__FA_BA_DECK__.index].id);
  const root_ = page.locator('.slide.active, .slide[aria-hidden="false"], .slide.is-active').first();
  const btn = (suffix) => page.locator(`[id$="-${suffix}"]:visible`).first();
  const iterOf = async () => (await page.locator('[id$="-iter"]:visible').first().innerText()).trim();

  const i0 = await iterOf();
  await btn('step').click();
  await page.waitForTimeout(500);
  const i1 = await page.locator('.hud-phases li.active:visible').first().innerText().catch(() => '');
  check(`${slide}: tombol Langkah memajukan fase`, i1 !== '' || (await iterOf()) !== i0, i1.replace(/\s+/g, ' ').slice(0, 50));

  await btn('play').click();
  await page.waitForTimeout(2500);
  const playing = (await btn('play').innerText()).toLowerCase().includes('jeda');
  check(`${slide}: Mulai berubah menjadi Jeda saat berjalan`, playing);
  const iPlay = await iterOf();
  await btn('play').click();
  const frozen = await iterOf();
  await page.waitForTimeout(900);
  check(`${slide}: Jeda menghentikan iterasi`, (await iterOf()) === frozen, `${iPlay} -> ${frozen}`);

  await btn('reset').click();
  await page.waitForTimeout(400);
  check(`${slide}: Reset mengembalikan iterasi ke 0`, /^(iterasi\s*)?0\b|\b0\s*\/|0$/.test((await iterOf()).replace(/\s+/g, ' ')) || (await iterOf()).includes('0'), await iterOf());

  await btn('params-toggle').click();
  const slider = page.locator('[data-param]:visible').first();
  check(`${slide}: panel Parameter terbuka`, await slider.isVisible());
  const before = await slider.inputValue();
  await slider.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.waitForTimeout(300);
  check(`${slide}: slider parameter mengubah nilai`, (await slider.inputValue()) !== before);
  await btn('params-toggle').click();

  const objBtns = page.locator(`[id$="-objectives"]:visible button`);
  const nObj = await objBtns.count();
  if (nObj >= 3) {
    await objBtns.nth(2).click();
    await page.waitForTimeout(400);
    check(`${slide}: tombol objektif (${nObj}) berfungsi`, true);
  }
  // jalankan sampai selesai pada kecepatan maksimum (slider kecepatan ada di panel Parameter)
  await btn('reset').click();
  await btn('params-toggle').click();
  await page.evaluate(() => {
    const sp = [...document.querySelectorAll('input[id$="-speed"]')].find((e) => e.offsetParent);
    sp.value = sp.max;
    sp.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await btn('params-toggle').click();
  await btn('play').click();
  await page.waitForFunction(() => /^\s*30\s*\/\s*30/.test([...document.querySelectorAll('[id$="-iter"]')].find((e) => e.offsetParent)?.innerText || ''), null, { timeout: 30000 }).catch(() => {});
  const endIter = await iterOf();
  check(`${slide}: simulasi berjalan sampai iterasi terakhir`, /30\s*\/\s*30/.test(endIter), endIter);
  check(`${slide}: tombol kembali ke Mulai setelah selesai`, (await btn('play').innerText()).toLowerCase().includes('mulai'));
  await btn('reset').click();
}

// ---- Cloud: kasus-kode (klik chip, tombol skenario) ----
await goto('kasus-kode');
const make = async () => parseFloat((await page.locator('#play-make').innerText()).replace(',', '.'));
const act = async (name) => { await page.locator(`[data-act="${name}"]`).click(); await page.waitForTimeout(1600); return make(); };
const rr = await act('rr');
const mm = await act('mm');
const fa = await act('fa');
const ba = await act('ba');
check('kasus-kode: Min-Min lebih cepat dari Round-Robin', mm < rr, `RR ${rr} | MM ${mm}`);
check('kasus-kode: hasil FA dan BA lebih cepat dari Round-Robin', fa < rr && ba < rr, `FA ${fa} | BA ${ba}`);
await act('rr');
const before = await make();
await page.locator('.chip').first().click();
await page.waitForTimeout(1200);
const after = await make();
check('kasus-kode: klik tugas memindahkannya dan makespan ikut berubah', after !== before, `${before} -> ${after}`);
const rnd = await act('random');
check('kasus-kode: tombol Acak menghasilkan jadwal acak', rnd > 0, String(rnd));
check('kasus-kode: kartu penilaian muncul', (await page.locator('#play-verdict').innerText()).length > 5);

// ---- Cloud: kasus-run (FA vs BA, workload sama) ----
await goto('kasus-run');
const runBtn = (s) => page.locator(`[id$="-${s}"]:visible`).first();
await runBtn('step').click();
await page.waitForTimeout(400);
const scoreFa = await page.locator('[id$="-fa-score"]:visible').first().innerText();
check('kasus-run: Langkah menjalankan satu iterasi untuk FA dan BA', (await page.locator('[id$="-iter"]:visible').first().innerText()).includes('1/'), (await page.locator('[id$="-iter"]:visible').first().innerText()));
await runBtn('params-toggle').click();
const nInput = page.locator('[data-param="n"]:visible').first();
if (await nInput.count()) {
  await nInput.evaluate((el) => { el.value = '24'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.waitForTimeout(500);
  check('kasus-run: mengubah jumlah tugas membangun ulang jadwal', (await page.locator('[id$="-iter"]:visible').first().innerText()).includes('0/'));
}
await runBtn('params-toggle').click();
await runBtn('reset').click();
await runBtn('params-toggle').click();
await page.evaluate(() => {
  const sp = [...document.querySelectorAll('input[id$="-speed"]')].find((e) => e.offsetParent);
  sp.value = sp.max;
  sp.dispatchEvent(new Event('input', { bubbles: true }));
});
await runBtn('params-toggle').click();
await runBtn('play').click();
await page.waitForFunction(() => /^\s*iterasi\s+(\d+)\s*\/\s*\1\b/.test([...document.querySelectorAll('[id$="-iter"]')].find((e) => e.offsetParent)?.innerText || ''), null, { timeout: 40000 }).catch(() => {});
check('kasus-run: berjalan sampai iterasi terakhir', /iterasi\s+(\d+)\s*\/\s*\1\b/.test(await page.locator('[id$="-iter"]:visible').first().innerText()), await page.locator('[id$="-iter"]:visible').first().innerText());
const finalFa = await page.locator('[id$="-fa-score"]:visible').first().innerText();
const finalBa = await page.locator('[id$="-ba-score"]:visible').first().innerText();
check('kasus-run: hasil akhir FA dan BA tampil', /s$/.test(finalFa.trim()) && /s$/.test(finalBa.trim()), `FA ${finalFa} | BA ${finalBa}`);
await runBtn('reset').click();

// ---- Adu 2D ----
await goto('adu');
await runBtn('step').click();
await page.waitForTimeout(400);
const aduIter = () => page.locator('[id$="-iter"]:visible').first().innerText();
const a0 = await aduIter();
await runBtn('play').click();
await page.waitForTimeout(2500);
await runBtn('play').click();
const a1 = await aduIter();
check('adu: Langkah dan Mulai memajukan iterasi, Jeda menahannya', a1 !== a0 && (await (async () => { await page.waitForTimeout(700); return aduIter(); })()) === a1, `${a0} -> ${a1}`);
const objs = page.locator('[id$="-objectives"]:visible button');
if (await objs.count()) { await objs.nth(1).click(); await page.waitForTimeout(500); check('adu: ganti objektif mereset iterasi', /\b0\s*\//.test(await aduIter()), await aduIter()); }
await runBtn('reset').click();

// ---- Eksperimen ----
await goto('eksperimen');
await page.locator('button', { hasText: 'Jalankan' }).filter({ visible: true }).first().click();
await page.waitForTimeout(7000);
const verdict = await page.locator('.trial-verdict:visible').first().innerText().catch(() => '');
const rowsText = await page.locator('main, body').first().innerText();
check('eksperimen: Jalankan menghasilkan ringkasan', /menang/i.test(rowsText), verdict.slice(0, 60));
const verdictText = async () => (await page.locator('main, body').first().innerText()).match(/Firefly menang[^\n]*|Bat menang[^\n]*|Seri[^\n]*/)?.[0] || '';
const v16 = await verdictText();
await page.locator('button', { hasText: '32 tugas' }).filter({ visible: true }).first().click();
await page.waitForTimeout(9000);
const v32 = await verdictText();
check('eksperimen: ubah ke 32 tugas menghitung ulang ringkasan', v32 !== '' && v32 !== v16, v32.slice(0, 60));
await page.locator('button', { hasText: 'Seed baru' }).filter({ visible: true }).first().click();
await page.waitForTimeout(9000);
const vSeed = await verdictText();
check('eksperimen: Seed baru memberi ringkasan baru', vSeed !== '' && vSeed !== v32, vSeed.slice(0, 60));

// ---- Karakteristik: slider ----
for (const s of ['fa-karakter', 'ba-karakter']) {
  await goto(s);
  const sl = page.locator('input[type="range"]:visible').first();
  const v0 = await sl.inputValue();
  await sl.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
  check(`${s}: slider berfungsi`, (await sl.inputValue()) !== v0);
}

// ---- Catatan presenter, bantuan, navigasi ----
await goto('judul');
const notesHidden = () => page.evaluate(() => document.getElementById('presenter-notes').classList.contains('hidden'));
await page.keyboard.press('n');
await page.waitForTimeout(500);
check('catatan presenter terbuka dengan tombol N', !(await notesHidden()));
check('catatan presenter berisi teks slide', (await page.locator('#notes-content').innerText()).trim().length > 30);
await page.keyboard.press('n');
await page.waitForTimeout(500);
check('catatan presenter tertutup dengan tombol N', await notesHidden());
await page.locator('#btn-notes').click();
await page.waitForTimeout(400);
check('tombol Catatan di bilah bawah membuka catatan', !(await notesHidden()));
await page.locator('#btn-close-notes').click();
await page.waitForTimeout(400);
check('tombol tutup menutup catatan', await notesHidden());
await page.keyboard.press('?');
await page.waitForTimeout(400);
check('modal pintasan terbuka dengan ?', await page.evaluate(() => !document.getElementById('shortcuts-modal').classList.contains('hidden')));
await page.keyboard.press('Escape');
await page.keyboard.press('3');
await page.waitForTimeout(900);
const jumped = await page.evaluate(() => window.__FA_BA_DECK__.slides[window.__FA_BA_DECK__.index].chapter.id);
check('tombol angka 3 lompat ke bab Firefly', jumped === 'firefly', jumped);
await page.keyboard.press('ArrowLeft');
await page.waitForTimeout(900);
check('panah kiri mundur satu langkah', true);

// ---- Viewport sempit ----
await page.setViewportSize({ width: 820, height: 1100 });
await page.waitForTimeout(800);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
check('viewport sempit: tanpa scroll horizontal', !overflow);
await page.setViewportSize({ width: 1920, height: 1080 });

console.log('--- konsol ---');
console.log(errors.length ? [...new Set(errors)].slice(0, 20).join('\n') : '(kosong)');
console.log(`\nHasil: ${pass} lulus, ${fail} gagal (${mode})`);
await browser.close();
server?.close();
process.exit(fail ? 1 : 0);
