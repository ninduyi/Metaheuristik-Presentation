/**
 * Penjadwalan tugas independen ke VM heterogen di komputasi awan.
 * Logika murni tanpa DOM. FA dan BA memakai beban kerja, populasi awal, dan fungsi objektif yang SAMA.
 *
 * Model:
 *   tugas i punya panjang MI_i (juta instruksi), VM j punya kecepatan MIPS_j
 *   waktu eksekusi t_ij = MI_i / MIPS_j
 *   posisi agen x ∈ [0, m)^n, tugas i dijalankan di VM ⌊x_i⌋
 *   makespan = max_j Σ_{i→j} t_ij, fitness = makespan + 0.001·σ(beban VM) (pemecah seri, tidak mengubah urutan makespan)
 */

import { createRandom } from '../core/random.js';
import { FAEngine } from './firefly.js';
import { BAEngine } from './bat.js';

export const TIE_BREAK = 0.001;

/** m VM dengan MIPS tersebar rata dari 85 sampai 175 (untuk m = 4: 85, 115, 145, 175). */
export function makeVMs(m = 4) {
  const names = ['Small', 'Medium', 'Large', 'X-Large'];
  return Array.from({ length: m }, (_, k) => ({
    id: k,
    name: `VM-${k + 1}`,
    tier: m === 4 ? names[k] : `${85 + Math.round((90 * k) / Math.max(1, m - 1))} MIPS`,
    mips: m === 1 ? 130 : Math.round(85 + (90 * k) / (m - 1))
  }));
}

export const DEFAULT_VMS = makeVMs(4);

export function generateTasks(count = 16, seed = 2026) {
  const rng = createRandom(seed);
  return Array.from({ length: count }, (_, idx) => ({
    id: idx + 1,
    name: `T${idx + 1}`,
    mi: rng.int(140, 620)
  }));
}

export function decodeSchedule(vector, vmCount) {
  const maxIdx = vmCount - 1;
  return vector.map((val) => {
    const idx = Math.floor(val);
    return idx < 0 ? 0 : idx > maxIdx ? maxIdx : idx;
  });
}

/** Susun jadwal dari penugasan eksplisit (indeks VM per tugas). */
export function evaluateAssignment(assignment, tasks, vms = DEFAULT_VMS) {
  const vmLoads = vms.map(() => 0);
  const vmTasks = vms.map(() => []);
  for (let i = 0; i < tasks.length; i++) {
    const j = assignment[i];
    const execSec = tasks[i].mi / vms[j].mips;
    vmTasks[j].push({ ...tasks[i], execSec, start: vmLoads[j] });
    vmLoads[j] += execSec;
  }
  let makespan = 0;
  let sum = 0;
  for (const l of vmLoads) {
    if (l > makespan) makespan = l;
    sum += l;
  }
  const mean = sum / vms.length;
  let variance = 0;
  for (const l of vmLoads) variance += (l - mean) * (l - mean);
  const imbalanceStd = Math.sqrt(variance / vms.length);
  return {
    assignment,
    vmLoads,
    vmTasks,
    makespan,
    imbalanceStd,
    fitness: makespan + TIE_BREAK * imbalanceStd
  };
}

export function evaluateSchedule(vector, tasks, vms = DEFAULT_VMS) {
  return evaluateAssignment(decodeSchedule(vector, vms.length), tasks, vms);
}

/** Batas bawah ideal: seluruh instruksi terbagi sempurna sesuai kecepatan VM. */
export function idealMakespan(tasks, vms = DEFAULT_VMS) {
  const totalMI = tasks.reduce((s, t) => s + t.mi, 0);
  const totalMips = vms.reduce((s, v) => s + v.mips, 0);
  return totalMI / totalMips;
}

export function roundRobin(tasks, vms = DEFAULT_VMS) {
  return evaluateAssignment(tasks.map((_, i) => i % vms.length), tasks, vms);
}

/** Min-Min (Braun dkk., 2001): ulangi, ambil tugas dengan waktu selesai minimum terkecil dan taruh di VM tersebut. */
export function minMin(tasks, vms = DEFAULT_VMS) {
  const ready = vms.map(() => 0);
  const assignment = new Array(tasks.length).fill(-1);
  let left = tasks.length;
  while (left > 0) {
    let bestTask = -1;
    let bestVm = -1;
    let bestCt = Infinity;
    for (let i = 0; i < tasks.length; i++) {
      if (assignment[i] >= 0) continue;
      let minCt = Infinity;
      let minVm = -1;
      for (let j = 0; j < vms.length; j++) {
        const ct = ready[j] + tasks[i].mi / vms[j].mips;
        if (ct < minCt) {
          minCt = ct;
          minVm = j;
        }
      }
      if (minCt < bestCt) {
        bestCt = minCt;
        bestTask = i;
        bestVm = minVm;
      }
    }
    assignment[bestTask] = bestVm;
    ready[bestVm] = bestCt;
    left--;
  }
  return evaluateAssignment(assignment, tasks, vms);
}

/** Populasi awal bersama untuk FA dan BA. */
export function sharedInitialPopulation(n, m, populationSize, seed) {
  const rng = createRandom(Number(seed));
  return Array.from({ length: populationSize }, () =>
    Array.from({ length: n }, () => rng.range(0, m - 1e-6))
  );
}

export const CLOUD_DEFAULTS = {
  n: 16,
  m: 4,
  populationSize: 28,
  maxIterations: 40,
  seed: 42,
  workloadSeed: 2026,
  fa: { beta0: 1.0, gamma: 2.0, alpha: 0.25, alphaDecay: 0.96 },
  ba: { fmin: 0, fmax: 1.5, loudness: 1.0, pulseRate: 0.5, alphaA: 0.9, gammaR: 0.9, localScale: 0.1 }
};

/** Menjalankan FA dan BA berdampingan pada masalah penjadwalan yang sama. */
export class CloudScheduleOptimizer {
  constructor(options = {}) {
    this.configure(options);
  }

  configure(options = {}) {
    const o = { ...CLOUD_DEFAULTS, ...options };
    this.n = o.n;
    this.m = o.m;
    this.vms = makeVMs(o.m);
    this.tasks = options.tasks || generateTasks(o.n, o.workloadSeed);
    this.populationSize = o.populationSize;
    this.maxIterations = o.maxIterations;
    this.seed = o.seed;
    this.faParams = { ...CLOUD_DEFAULTS.fa, ...(options.fa || {}) };
    this.baParams = { ...CLOUD_DEFAULTS.ba, ...(options.ba || {}) };
    this.reset();
  }

  reset() {
    const tasks = this.tasks;
    const vms = this.vms;
    const fitness = (x) => evaluateSchedule(x, tasks, vms).fitness;
    const common = {
      dim: tasks.length,
      lo: 0,
      hi: vms.length - 1e-6,
      fitness,
      populationSize: this.populationSize,
      maxIterations: this.maxIterations,
      seed: this.seed,
      initial: sharedInitialPopulation(tasks.length, vms.length, this.populationSize, this.seed)
    };
    this.fa = new FAEngine({ ...common, ...this.faParams });
    this.ba = new BAEngine({ ...common, ...this.baParams });
    this.baselineRR = roundRobin(tasks, vms);
    this.baselineMinMin = minMin(tasks, vms);
    this.ideal = idealMakespan(tasks, vms);
  }

  get done() {
    return this.fa.done && this.ba.done;
  }

  step() {
    this.fa.runIteration();
    this.ba.runIteration();
    return this.getState();
  }

  run() {
    while (!this.done) this.step();
    return this.getState();
  }

  getState() {
    const fa = this.fa.getState();
    const ba = this.ba.getState();
    return {
      iteration: Math.max(fa.iteration, ba.iteration),
      maxIterations: this.maxIterations,
      fa,
      ba,
      evalFa: evaluateSchedule(fa.best.x, this.tasks, this.vms),
      evalBa: evaluateSchedule(ba.best.x, this.tasks, this.vms),
      baselineRR: this.baselineRR,
      baselineMinMin: this.baselineMinMin,
      ideal: this.ideal,
      done: this.done
    };
  }
}

/** Satu beban kerja: panjang tugas diacak dari seed beban kerja, populasi awal dari seed algoritma. */
export function runWorkload(w, { n = 16, m = 4, populationSize = 28, maxIterations = 40, seed = 42 } = {}) {
  const tasks = generateTasks(n, 3000 + w * 17);
  const opt = new CloudScheduleOptimizer({ n, m, tasks, populationSize, maxIterations, seed: seed + w });
  const st = opt.run();
  return {
    workload: w + 1,
    ideal: opt.ideal,
    rr: opt.baselineRR.makespan,
    minmin: opt.baselineMinMin.makespan,
    fa: st.evalFa.makespan,
    ba: st.evalBa.makespan
  };
}

/** Eksperimen banyak beban kerja: kembalikan makespan tiap metode untuk tiap beban kerja. */
export function runExperiment({ workloads = 10, onWorkload, ...rest } = {}) {
  const results = [];
  for (let w = 0; w < workloads; w++) {
    const row = runWorkload(w, rest);
    results.push(row);
    if (onWorkload) onWorkload(row, results);
  }
  return results;
}

export function summarizeExperiment(rows) {
  const avg = (key) => rows.reduce((s, r) => s + r[key], 0) / rows.length;
  const ratio = (key) => rows.reduce((s, r) => s + r[key] / r.ideal, 0) / rows.length;
  let faWins = 0;
  let baWins = 0;
  let ties = 0;
  for (const r of rows) {
    if (Math.abs(r.fa - r.ba) < 1e-9) ties++;
    else if (r.fa < r.ba) faWins++;
    else baWins++;
  }
  return {
    count: rows.length,
    avg: { rr: avg('rr'), minmin: avg('minmin'), fa: avg('fa'), ba: avg('ba'), ideal: avg('ideal') },
    ratio: { rr: ratio('rr'), minmin: ratio('minmin'), fa: ratio('fa'), ba: ratio('ba') },
    faWins,
    baWins,
    ties,
    gainFaVsRR: (1 - avg('fa') / avg('rr')) * 100,
    gainBaVsRR: (1 - avg('ba') / avg('rr')) * 100
  };
}
