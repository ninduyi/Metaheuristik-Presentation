/**
 * Bab Hasil: (1) adu FA vs BA di peta 2D dengan posisi awal identik,
 * (2) eksperimen sepuluh beban kerja cloud yang dihitung langsung di browser.
 */

import { landscapeById } from '../core/landscapes.js';
import { createRandom } from '../core/random.js';
import { StepTicker } from '../core/ticker.js';
import { renderConvergenceChart } from '../render/chart.js';
import { fitCanvas } from '../render/motion.js';
import { FARenderer, BARenderer } from '../render/mapRenderers.js';
import { COLORS, drawText, hexToRgba } from '../render/sprites.js';
import { FAEngine } from '../algorithms/firefly.js';
import { BAEngine } from '../algorithms/bat.js';
import { runWorkload, summarizeExperiment } from '../algorithms/cloudScheduling.js';
import { ICONS, dockButton, drawerHtml, wireDrawer, setPlayLabel, objectiveButtonsHtml, formatFitness } from './console.js';
import { CH, FA_COLOR, BA_COLOR, FA_LIGHT, BA_LIGHT } from './chapters.js';

/* ---------- Adu di peta 2D ---------- */

const ADU_PARAMS = [
  { key: 'populationSize', label: 'Populasi', min: 8, max: 40, step: 1, value: 20 },
  { key: 'maxIterations', label: 'Iterasi', min: 10, max: 60, step: 5, value: 30 }
];

const aduSlide = {
  id: 'adu',
  chapter: CH.hasil,
  title: 'Adu: Firefly vs Bat di peta yang sama',
  notes: `
    <p>Syarat perbandingan yang adil sudah dipenuhi: <b>fungsi sama, posisi awal sama persis, populasi sama, iterasi sama</b>. Anggaran evaluasi juga sama (satu per individu per iterasi), terlihat dari angka evaluasi di bawah skor.</p>
    <ul>
      <li>Kedua mesin berjalan serempak: tiga tahap per iterasi untuk masing-masing.</li>
      <li>Ganti fungsi (Rastrigin, Ackley, Sphere) untuk melihat karakter berbeda: Sphere cepat sekali, Rastrigin penuh jebakan.</li>
      <li>Ubah seed lewat tombol Parameter. Pemenang dapat berganti dari seed ke seed. Satu proses acak bukan kesimpulan.</li>
    </ul>
    <p>Itu sebabnya slide berikutnya memakai banyak beban kerja sekaligus.</p>`,
  mount(container, { reducedMotion, registerHooks }) {
    const id = 'adu';
    container.innerHTML = `
      <div class="versus">
        <header class="plate plate-compact">
          <span class="plate-tag"><i></i>9 · Perbandingan hasil</span>
          <h1 class="plate-title">Posisi awal sama, gerak beda</h1>
        </header>

        <div class="arena arena-fa">
          <canvas id="${id}-fa"></canvas>
          <div class="scoreboard"><b>Firefly</b><strong id="${id}-fa-score"></strong><em id="${id}-fa-eval"></em></div>
        </div>
        <div class="arena arena-ba">
          <canvas id="${id}-ba"></canvas>
          <div class="scoreboard"><b>Bat</b><strong id="${id}-ba-score"></strong><em id="${id}-ba-eval"></em></div>
        </div>
        <div class="versus-badge" aria-hidden="true">VS</div>

        <section class="strip-chart">
          <small>Konvergensi bersama</small>
          <canvas id="${id}-chart"></canvas>
          <span class="curve-iter" id="${id}-iter"></span>
        </section>

        <div class="dock">
          ${dockButton(`${id}-play`, ICONS.play, 'Mulai', 'dock-main')}
          ${dockButton(`${id}-step`, ICONS.step, 'Langkah')}
          ${dockButton(`${id}-reset`, ICONS.reset, 'Reset')}
          <i class="dock-sep"></i>
          <div class="seg" id="${id}-objectives">${objectiveButtonsHtml('rastrigin')}</div>
          <i class="dock-sep"></i>
          ${dockButton(`${id}-params-toggle`, ICONS.gear, 'Parameter')}
        </div>
        ${drawerHtml(id, ADU_PARAMS, 3)}
      </div>`;

    const $ = (s) => container.querySelector(s);
    const faCanvas = $(`#${id}-fa`);
    const baCanvas = $(`#${id}-ba`);
    const chartCanvas = $(`#${id}-chart`);
    const playBtn = $(`#${id}-play`);
    const seedInput = $(`#${id}-seed`);
    const speedInput = $(`#${id}-speed`);
    const paramInputs = [...container.querySelectorAll('[data-param]')];
    const objectiveBtns = [...container.querySelectorAll(`#${id}-objectives .seg-btn`)];
    wireDrawer(container, id);
    const faRenderer = new FARenderer();
    const baRenderer = new BARenderer();
    let objective = landscapeById('rastrigin');
    let speed = 3;
    let fa = null;
    let ba = null;

    function readConfig() {
      const cfg = { seed: Number(seedInput.value) || 42 };
      for (const input of paramInputs) cfg[input.dataset.param] = Number(input.value);
      return cfg;
    }

    function build() {
      const cfg = readConfig();
      const rng = createRandom(cfg.seed + 7);
      const initial = Array.from({ length: cfg.populationSize }, () => [
        rng.range(objective.min, objective.max),
        rng.range(objective.min, objective.max)
      ]);
      const common = {
        dim: 2,
        lo: objective.min,
        hi: objective.max,
        fitness: (x) => objective.evaluate(x[0], x[1]),
        populationSize: cfg.populationSize,
        maxIterations: cfg.maxIterations,
        seed: cfg.seed,
        initial
      };
      fa = new FAEngine(common);
      ba = new BAEngine(common);
    }

    function updateReadout() {
      const a = fa.getState();
      const b = ba.getState();
      $(`#${id}-fa-score`).textContent = formatFitness(a.best.fitness);
      $(`#${id}-ba-score`).textContent = formatFitness(b.best.fitness);
      $(`#${id}-fa-eval`).textContent = `${a.evaluations} evaluasi`;
      $(`#${id}-ba-eval`).textContent = `${b.evaluations} evaluasi`;
      $(`#${id}-iter`).textContent = `iterasi ${a.iteration}/${a.maxIterations}`;
      renderConvergenceChart(
        chartCanvas,
        [
          { label: 'Firefly', color: FA_COLOR, data: a.history },
          { label: 'Bat', color: BA_COLOR, data: b.history }
        ],
        { maxIterations: a.maxIterations, decimals: 3 }
      );
    }

    const ticker = new StepTicker({
      rate: speed,
      calm: reducedMotion,
      onTick: () => {
        const a = fa.step();
        const b = ba.step();
        updateReadout();
        return a.phase === 'DONE' && b.phase === 'DONE';
      },
      onFrame: (glide, now) => {
        const ts = reducedMotion ? 0 : now;
        faRenderer.render(faCanvas, fa.getState(), objective, { alpha: glide, timestamp: ts, padding: 0.04 });
        baRenderer.render(baCanvas, ba.getState(), objective, { alpha: glide, timestamp: ts, padding: 0.04 });
      }
    });
    ticker.onRunningChange = (on) => setPlayLabel(playBtn, on);

    const reset = () => {
      ticker.halt();
      build();
      updateReadout();
      ticker.settle();
      ticker.setRate(speed);
    };
    const togglePlay = () => {
      if (fa.done && ba.done) reset();
      ticker.setRate(speed);
      ticker.toggle();
    };
    const step = () => {
      if (fa.done && ba.done) return;
      ticker.single();
      ticker.setRate(speed);
    };

    playBtn.addEventListener('click', togglePlay);
    $(`#${id}-step`).addEventListener('click', step);
    $(`#${id}-reset`).addEventListener('click', reset);
    objectiveBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        objectiveBtns.forEach((b) => b.classList.toggle('active', b === btn));
        objective = landscapeById(btn.dataset.obj);
        reset();
      });
    });
    for (const input of paramInputs) {
      input.addEventListener('input', () => {
        $(`#${id}-v-${input.dataset.param}`).textContent = input.value;
        reset();
      });
    }
    seedInput.addEventListener('change', reset);
    speedInput.addEventListener('input', () => {
      speed = Number(speedInput.value);
      $(`#${id}-v-speed`).textContent = speedInput.value;
      ticker.setRate(speed);
    });

    registerHooks?.({ togglePlay, step, reset });
    build();
    updateReadout();
    const onResize = () => updateReadout();
    window.addEventListener('resize', onResize);
    ticker.attach();
    return () => {
      window.removeEventListener('resize', onResize);
      ticker.dispose();
    };
  }
};

/* ---------- Eksperimen 10 beban kerja ---------- */

const METHODS = [
  { key: 'rr', label: 'Round-Robin', color: COLORS.coral },
  { key: 'minmin', label: 'Min-Min', color: COLORS.blueLight },
  { key: 'fa', label: 'Firefly', color: FA_COLOR },
  { key: 'ba', label: 'Bat', color: BA_COLOR }
];

const EXP_W = 1660;
const EXP_H = 520;

function drawExperimentChart(canvas, rows, total) {
  const { ctx, width, height } = fitCanvas(canvas);
  ctx.scale(width / EXP_W, height / EXP_H);
  ctx.clearRect(0, 0, EXP_W, EXP_H);
  const padL = 84;
  const padR = 20;
  const padT = 56;
  const padB = 56;
  const pw = EXP_W - padL - padR;
  const ph = EXP_H - padT - padB;
  let maxRatio = 1.4;
  rows.forEach((r) => METHODS.forEach((m) => (maxRatio = Math.max(maxRatio, r[m.key] / r.ideal))));
  maxRatio = Math.ceil(maxRatio * 10) / 10 + 0.05;
  const y = (v) => padT + ph - ((v - 1) / (maxRatio - 1)) * ph;

  ctx.font = '600 21px "Red Hat Mono", "Manrope", monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let v = 1; v <= maxRatio + 1e-9; v += 0.2) {
    ctx.strokeStyle = Math.abs(v - 1) < 1e-9 ? hexToRgba(COLORS.lime, 0.8) : 'rgba(169,187,214,0.18)';
    ctx.lineWidth = Math.abs(v - 1) < 1e-9 ? 3 : 1.5;
    ctx.setLineDash(Math.abs(v - 1) < 1e-9 ? [4, 8] : []);
    ctx.beginPath();
    ctx.moveTo(padL, y(v));
    ctx.lineTo(padL + pw, y(v));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = Math.abs(v - 1) < 1e-9 ? COLORS.lime : COLORS.muted;
    ctx.fillText(`${v.toFixed(1)}×`, padL - 12, y(v));
  }

  // Legenda
  ctx.textAlign = 'left';
  ctx.font = '700 23px "Manrope", sans-serif';
  let lx = padL;
  METHODS.forEach((m) => {
    ctx.fillStyle = m.color;
    ctx.beginPath();
    ctx.roundRect(lx, 14, 22, 22, 6);
    ctx.fill();
    ctx.fillStyle = COLORS.ink;
    ctx.fillText(m.label, lx + 32, 26);
    lx += ctx.measureText(m.label).width + 72;
  });
  ctx.fillStyle = COLORS.lime;
  ctx.fillText('1.0× = batas bawah ideal', lx + 10, 26);

  const groupW = pw / total;
  const barW = Math.min(36, (groupW - 16) / METHODS.length);
  rows.forEach((r, gi) => {
    const gx = padL + gi * groupW + (groupW - barW * METHODS.length) / 2;
    METHODS.forEach((m, mi) => {
      const v = r[m.key] / r.ideal;
      const top = y(v);
      const grad = ctx.createLinearGradient(0, top, 0, y(1));
      grad.addColorStop(0, m.color);
      grad.addColorStop(1, hexToRgba(m.color, 0.35));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(gx + mi * barW, top, barW - 3, Math.max(2, y(1) - top), 6);
      ctx.fill();
    });
    drawText(ctx, `W${r.workload}`, padL + gi * groupW + groupW / 2, EXP_H - 26, { size: 22, color: COLORS.muted, align: 'center', mono: true, weight: 600 });
  });
}

function verdict(sum) {
  const faR = sum.ratio.fa;
  const baR = sum.ratio.ba;
  const diff = Math.abs(faR - baR) / Math.min(faR, baR);
  const lead = faR < baR ? 'Firefly' : 'Bat';
  if (diff < 0.01) {
    return `Selisih rata-rata Firefly dan Bat kurang dari 1% (${faR.toFixed(3)}× vs ${baR.toFixed(3)}×): praktis seimbang pada beban kerja ini.`;
  }
  return `${lead} rata-rata lebih rapat ke batas bawah (${faR.toFixed(3)}× vs ${baR.toFixed(3)}×), selisih ${(diff * 100).toFixed(1)}%. Lihat jumlah kemenangan sebelum menyimpulkan.`;
}

const eksperimenSlide = {
  id: 'eksperimen',
  chapter: CH.hasil,
  title: 'Eksperimen sepuluh beban kerja',
  notes: `
    <p>Satu proses acak tidak cukup untuk menyimpulkan. Di sini algoritma dijalankan pada sepuluh beban kerja berbeda (panjang tugas diacak dengan seed berbeda), semuanya dihitung langsung di browser Anda saat tombol ditekan.</p>
    <ul>
      <li>Sumbu tegak adalah <b>rasio terhadap batas bawah ideal</b>: 1,0× berarti sempurna (instruksi terbagi mulus sesuai kecepatan VM, yang hampir mustahil dicapai karena tugas tidak bisa dipecah).</li>
      <li>Round-Robin dan Min-Min adalah pembanding klasik. Min-Min mengikuti Braun dkk. (2001), baseline yang juga dipakai paper Firefly.</li>
      <li>Ubah jumlah tugas atau VM, lalu jalankan lagi. Tombol "Seed baru" mengulang eksperimen dengan populasi awal berbeda untuk melihat variasi.</li>
    </ul>
    <p>Baca hasil dengan jujur: bila selisih FA dan BA kecil dan kemenangan seimbang, kesimpulannya bukan "A lebih baik dari B". Ini simulasi sederhana: tugas independen, tanpa biaya komunikasi atau antrean.</p>`,
  mount(container, { registerHooks }) {
    const state = { n: 16, m: 4, seedBase: 42, rows: [], token: 0, timer: null };
    container.innerHTML = `
      <div class="trial">
        <header class="plate plate-compact">
          <span class="plate-tag"><i></i>9 · Perbandingan hasil</span>
          <h1 class="plate-title">Sepuluh beban kerja, empat penjadwal</h1>
        </header>
        <div class="scores" id="exp-cards"></div>
        <div class="trial-chart"><canvas id="exp-chart"></canvas></div>
        <p class="trial-verdict" id="exp-verdict"></p>
        <div class="dock dock-trial">
          ${dockButton('exp-run', ICONS.play, 'Jalankan', 'dock-main')}
          ${dockButton('exp-seed', ICONS.reset, 'Seed baru')}
          <i class="dock-sep"></i>
          <div class="seg" id="exp-n"><button type="button" class="seg-btn" data-n="8">8 tugas</button><button type="button" class="seg-btn active" data-n="16">16 tugas</button><button type="button" class="seg-btn" data-n="32">32 tugas</button></div>
          <i class="dock-sep"></i>
          <div class="seg" id="exp-m"><button type="button" class="seg-btn active" data-m="4">4 VM</button><button type="button" class="seg-btn" data-m="6">6 VM</button><button type="button" class="seg-btn" data-m="8">8 VM</button></div>
        </div>
      </div>`;

    const $ = (s) => container.querySelector(s);
    const canvas = $('#exp-chart');

    function renderSide() {
      const rows = state.rows;
      const cards = $('#exp-cards');
      if (!rows.length) {
        cards.innerHTML = METHODS.map((m) => `<div class="score-card idle" style="--c:${m.color}"><span>${m.label}</span><b>…</b><em>menunggu hitungan</em></div>`).join('');
        $('#exp-verdict').textContent = '';
        return;
      }
      const sum = summarizeExperiment(rows);
      cards.innerHTML = METHODS.map((m) => {
        const gain = (1 - sum.avg[m.key] / sum.avg.rr) * 100;
        return `<div class="score-card" style="--c:${m.color}">
          <span>${m.label}</span>
          <b>${sum.ratio[m.key].toFixed(3)}×</b>
          <em>${m.key === 'rr' ? 'pembanding dasar' : `${gain.toFixed(1)}% lebih cepat dari Round-Robin`}</em>
        </div>`;
      }).join('');
      const done = rows.length === 10;
      const wins = `Firefly menang ${sum.faWins}, Bat menang ${sum.baWins}${sum.ties ? `, seri ${sum.ties}` : ''} dari ${sum.count} beban kerja.`;
      $('#exp-verdict').textContent = done ? `${wins} ${verdict(sum)}` : `Menghitung beban kerja ${rows.length}/10 …`;
    }

    function draw() {
      drawExperimentChart(canvas, state.rows, 10);
    }

    function run() {
      state.token++;
      const token = state.token;
      clearTimeout(state.timer);
      state.rows = [];
      renderSide();
      draw();
      const next = (w) => {
        if (token !== state.token || w >= 10) return;
        state.rows.push(runWorkload(w, { n: state.n, m: state.m, seed: state.seedBase }));
        renderSide();
        draw();
        state.timer = setTimeout(() => next(w + 1), 170);
      };
      state.timer = setTimeout(() => next(0), 120);
    }

    $('#exp-run').addEventListener('click', run);
    $('#exp-seed').addEventListener('click', () => {
      state.seedBase += 101;
      run();
    });
    container.querySelectorAll('#exp-n .seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('#exp-n .seg-btn').forEach((b) => b.classList.toggle('active', b === btn));
        state.n = Number(btn.dataset.n);
        run();
      });
    });
    container.querySelectorAll('#exp-m .seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('#exp-m .seg-btn').forEach((b) => b.classList.toggle('active', b === btn));
        state.m = Number(btn.dataset.m);
        run();
      });
    });

    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    registerHooks?.({ togglePlay: run, reset: () => $('#exp-seed').click() });
    run();
    return () => {
      state.token++;
      clearTimeout(state.timer);
      window.removeEventListener('resize', onResize);
    };
  }
};

export const hasilSlides = [aduSlide, eksperimenSlide];
