/**
 * Bat Algorithm (Yang, 2010). Logika murni tanpa DOM, dimensi bebas (2D untuk peta, n tugas untuk cloud).
 *
 * Satu iterasi dibagi tiga tahap:
 *   PULSE  : tiap kelelawar mengirim pulsa, frekuensi acak f_i, kecepatan menuju x* lalu posisi percobaan
 *   LOCAL  : jika rand > r_i, percobaan diganti jelajah lokal di sekitar x* (radius mengikuti kenyaringan rata-rata)
 *   ACCEPT : percobaan diterima bila rand < A_i dan lebih baik; A_i turun (α_A), r_i naik (r0·(1 − e^(−γ_r t)))
 *
 * Catatan tanda: Yang (2010) menulis v += (x_i − x*)·f_i. Di sini dipakai (x* − x_i)·f_i supaya kelelawar
 * bergerak mendekati solusi terbaik, sesuai penjelasan "terbang menuju x*". Beberapa implementasi memakai tanda lain.
 */

import { createRandom } from '../core/random.js';

export const BA_DEFAULTS = {
  populationSize: 20,
  maxIterations: 30,
  fmin: 0,
  fmax: 1.5,
  loudness: 1.0,
  pulseRate: 0.5,
  alphaA: 0.9,
  gammaR: 0.9,
  localScale: 0.1
};

export function loudnessAt(a0, alphaA, k) {
  return a0 * Math.pow(alphaA, k);
}

export function pulseRateAt(r0, gammaR, t) {
  return r0 * (1 - Math.exp(-gammaR * t));
}

export class BAEngine {
  constructor(config = {}) {
    this.configure(config);
  }

  configure(config = {}) {
    const c = { ...BA_DEFAULTS, ...config };
    this.dim = c.dim ?? 2;
    this.lo = c.lo ?? 0;
    this.hi = c.hi ?? 1;
    this.span = this.hi - this.lo;
    this.fitnessFn = c.fitness;
    this.populationSize = Math.max(2, Math.round(c.populationSize));
    this.maxIterations = Math.max(1, Math.round(c.maxIterations));
    this.fmin = c.fmin;
    this.fmax = c.fmax;
    this.A0 = c.loudness;
    this.r0 = c.pulseRate;
    this.alphaA = c.alphaA;
    this.gammaR = c.gammaR;
    this.localScale = c.localScale;
    this.seed = c.seed ?? 42;
    this.initial = c.initial || null;
    this.reset();
  }

  clamp(v) {
    return v < this.lo ? this.lo : v > this.hi ? this.hi : v;
  }

  reset() {
    this.rng = createRandom(Number(this.seed) + 101);
    this.iteration = 0;
    this.evaluations = 0;
    this.agents = [];
    for (let i = 0; i < this.populationSize; i++) {
      const x = this.initial && this.initial[i]
        ? this.initial[i].slice()
        : Array.from({ length: this.dim }, () => this.rng.range(this.lo, this.hi));
      this.agents.push({
        x,
        px: x.slice(),
        v: new Array(this.dim).fill(0),
        f: this.evalFitness(x),
        A: this.A0,
        r: 0,
        freq: 0,
        trial: null,
        trialPrev: null,
        trialF: null,
        mode: null,
        accepted: null
      });
    }
    this.bestEver = null;
    this.updateBest();
    this.history = [{ iteration: 0, bestFitness: this.bestEver.f }];
    this.phase = 'INIT';
    this.phaseLabel = 'Sebar kelelawar';
    this.phaseDetail = `Menyebar ${this.populationSize} kelelawar secara acak. Kenyaringan awal A = ${this.A0}.`;
    this.done = false;
    return this.getState();
  }

  evalFitness(x) {
    this.evaluations++;
    return this.fitnessFn(x);
  }

  updateBest() {
    for (const a of this.agents) {
      if (!this.bestEver || a.f < this.bestEver.f) this.bestEver = { x: a.x.slice(), f: a.f };
    }
  }

  meanLoudness() {
    return this.agents.reduce((s, a) => s + a.A, 0) / this.agents.length;
  }

  meanPulseRate() {
    return this.agents.reduce((s, a) => s + a.r, 0) / this.agents.length;
  }

  step() {
    if (this.done) return this.getState();
    for (const a of this.agents) {
      a.px = a.x.slice();
      a.trialPrev = a.trial ? a.trial.slice() : null;
    }

    if (this.phase === 'INIT' || this.phase === 'ACCEPT') {
      this.phase = 'PULSE';
      this.phaseLabel = 'Pulsa: terbang menuju x*';
      const best = this.bestEver.x;
      for (const a of this.agents) {
        a.freq = this.fmin + (this.fmax - this.fmin) * this.rng.next();
        a.mode = 'global';
        a.accepted = null;
        a.trialPrev = a.x.slice();
        const trial = new Array(this.dim);
        for (let d = 0; d < this.dim; d++) {
          a.v[d] += (best[d] - a.x[d]) * a.freq;
          const lim = 0.3 * this.span;
          if (a.v[d] > lim) a.v[d] = lim;
          if (a.v[d] < -lim) a.v[d] = -lim;
          trial[d] = this.clamp(a.x[d] + a.v[d]);
        }
        a.trial = trial;
        a.trialF = null;
      }
      this.phaseDetail = `Frekuensi acak f ∈ [${this.fmin}, ${this.fmax}]. Posisi percobaan = posisi + kecepatan.`;
      return this.getState();
    }

    if (this.phase === 'PULSE') {
      this.phase = 'LOCAL';
      this.phaseLabel = 'Jelajah lokal di dekat x*';
      const best = this.bestEver.x;
      const meanA = this.meanLoudness();
      let localCount = 0;
      for (const a of this.agents) {
        if (this.rng.next() > a.r) {
          const trial = new Array(this.dim);
          for (let d = 0; d < this.dim; d++) {
            const eps = this.rng.range(-1, 1);
            trial[d] = this.clamp(best[d] + eps * meanA * this.localScale * this.span);
          }
          a.trial = trial;
          a.mode = 'local';
          localCount++;
        }
      }
      for (const a of this.agents) a.trialF = this.evalFitness(a.trial);
      this.phaseDetail = `${localCount} dari ${this.agents.length} kelelawar menjelajah lokal (rand > r). Ā = ${meanA.toFixed(2)}, r̄ = ${this.meanPulseRate().toFixed(2)}.`;
      return this.getState();
    }

    // ACCEPT
    this.phase = 'ACCEPT';
    this.phaseLabel = 'Terima atau tolak';
    this.iteration++;
    let accepted = 0;
    for (const a of this.agents) {
      const ok = this.rng.next() < a.A && a.trialF < a.f;
      a.accepted = ok;
      if (ok) {
        a.x = a.trial.slice();
        a.f = a.trialF;
        a.A *= this.alphaA;
        a.r = pulseRateAt(this.r0, this.gammaR, this.iteration);
        accepted++;
      }
    }
    this.updateBest();
    this.history.push({ iteration: this.iteration, bestFitness: this.bestEver.f });
    this.phaseDetail = `${accepted} diterima, ${this.agents.length - accepted} ditolak. Terbaik f = ${this.bestEver.f.toFixed(3)}. Ā = ${this.meanLoudness().toFixed(2)}, r̄ = ${this.meanPulseRate().toFixed(2)}.`;
    if (this.iteration >= this.maxIterations) {
      this.phase = 'DONE';
      this.phaseLabel = 'Selesai';
      this.done = true;
      this.phaseDetail = `Selesai setelah ${this.iteration} iterasi dan ${this.evaluations} evaluasi. Terbaik f = ${this.bestEver.f.toFixed(4)}.`;
    }
    return this.getState();
  }

  runIteration() {
    const target = this.iteration + 1;
    let guard = 0;
    while (!this.done && this.iteration < target && guard++ < 10) this.step();
    return this.getState();
  }

  getState() {
    return {
      kind: 'BA',
      phase: this.phase,
      phaseLabel: this.phaseLabel,
      phaseDetail: this.phaseDetail,
      iteration: this.iteration,
      maxIterations: this.maxIterations,
      evaluations: this.evaluations,
      agents: this.agents,
      meanA: this.meanLoudness(),
      meanR: this.meanPulseRate(),
      best: this.bestEver ? { x: this.bestEver.x.slice(), fitness: this.bestEver.f } : null,
      history: this.history,
      done: this.done,
      params: {
        A0: this.A0,
        r0: this.r0,
        alphaA: this.alphaA,
        gammaR: this.gammaR,
        localRadius: this.meanLoudness() * this.localScale * this.span
      }
    };
  }
}
