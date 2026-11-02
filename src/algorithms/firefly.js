/**
 * Firefly Algorithm (Yang, 2009; dipakai Yousif dkk., 2011 untuk penjadwalan job).
 * Logika murni tanpa DOM. Satu kelas untuk peta 2D (dim = 2) dan penjadwalan cloud (dim = jumlah tugas).
 *
 * Satu iterasi dibagi tiga tahap supaya tombol Langkah punya arti:
 *   EVAL  : hitung kecerahan (kecerahan = kualitas, fitness lebih kecil berarti lebih terang)
 *   MOVE  : setiap kunang-kunang terbang ke semua yang lebih terang, daya tarik meredup oleh jarak
 *   WALK  : langkah acak kecil yang menyusut tiap iterasi, lalu evaluasi ulang
 *
 * Jarak r dinormalkan ke [0, 1] (akar rata-rata kuadrat selisih per dimensi dibagi lebar domain)
 * supaya γ bermakna sama di 2 dimensi maupun 40 dimensi.
 */

import { createRandom } from '../core/random.js';

export const FA_DEFAULTS = {
  populationSize: 20,
  maxIterations: 30,
  beta0: 1.0,
  gamma: 2.0,
  alpha: 0.25,
  alphaDecay: 0.96
};

export function attractiveness(beta0, gamma, r) {
  return beta0 * Math.exp(-gamma * r * r);
}

export class FAEngine {
  constructor(config = {}) {
    this.configure(config);
  }

  configure(config = {}) {
    const c = { ...FA_DEFAULTS, ...config };
    this.dim = c.dim ?? 2;
    this.lo = c.lo ?? 0;
    this.hi = c.hi ?? 1;
    this.span = this.hi - this.lo;
    this.fitnessFn = c.fitness;
    this.populationSize = Math.max(2, Math.round(c.populationSize));
    this.maxIterations = Math.max(1, Math.round(c.maxIterations));
    this.beta0 = c.beta0;
    this.gamma = c.gamma;
    this.alpha0 = c.alpha;
    this.alphaDecay = c.alphaDecay;
    this.seed = c.seed ?? 42;
    this.initial = c.initial || null; // posisi awal bersama agar perbandingan adil
    this.reset();
  }

  clamp(v) {
    return v < this.lo ? this.lo : v > this.hi ? this.hi : v;
  }

  reset() {
    this.rng = createRandom(Number(this.seed) + 202);
    this.iteration = 0;
    this.alpha = this.alpha0;
    this.evaluations = 0;
    this.agents = [];
    for (let i = 0; i < this.populationSize; i++) {
      const x = this.initial && this.initial[i]
        ? this.initial[i].slice()
        : Array.from({ length: this.dim }, () => this.rng.range(this.lo, this.hi));
      this.agents.push({
        x,
        px: x.slice(),
        f: this.evalFitness(x),
        glow: 0,
        attractor: -1,
        pull: 0,
        stepFrom: x.slice(),
        rank: 0
      });
    }
    this.bestEver = null;
    this.updateBest();
    this.rankAgents();
    this.history = [{ iteration: 0, bestFitness: this.bestEver.f }];
    this.phase = 'INIT';
    this.phaseLabel = 'Sebar kunang-kunang';
    this.phaseDetail = `Menyebar ${this.populationSize} kunang-kunang secara acak di ruang pencarian.`;
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

  /** Peringkat 0 = paling terang. Glow dinormalkan 0..1 dari peringkat agar kecerahan terlihat jelas. */
  rankAgents() {
    const order = this.agents.map((_, i) => i).sort((a, b) => this.agents[a].f - this.agents[b].f);
    order.forEach((idx, rank) => {
      this.agents[idx].rank = rank;
      this.agents[idx].glow = 1 - rank / Math.max(1, order.length - 1);
    });
    this.brightestIndex = order[0];
  }

  distance(a, b) {
    let s = 0;
    for (let d = 0; d < this.dim; d++) {
      const diff = (a[d] - b[d]) / this.span;
      s += diff * diff;
    }
    return Math.sqrt(s / this.dim);
  }

  step() {
    if (this.done) return this.getState();
    for (const a of this.agents) {
      a.px = a.x.slice();
      a.attractor = -1;
      a.pull = 0;
    }

    if (this.phase === 'INIT' || this.phase === 'WALK') {
      this.phase = 'EVAL';
      this.phaseLabel = 'Ukur kecerahan';
      this.rankAgents();
      const best = this.agents[this.brightestIndex];
      this.phaseDetail = `Kecerahan = kualitas solusi. Paling terang: f = ${best.f.toFixed(3)}.`;
      return this.getState();
    }

    if (this.phase === 'EVAL') {
      this.phase = 'MOVE';
      this.phaseLabel = 'Terbang ke yang lebih terang';
      const snapshot = this.agents.map((a) => ({ x: a.x.slice(), f: a.f }));
      let moves = 0;
      for (let i = 0; i < this.agents.length; i++) {
        const me = this.agents[i];
        let strongest = 0;
        for (let j = 0; j < snapshot.length; j++) {
          if (snapshot[j].f < me.f) {
            const r = this.distance(me.x, snapshot[j].x);
            const beta = attractiveness(this.beta0, this.gamma, r);
            for (let d = 0; d < this.dim; d++) me.x[d] += beta * (snapshot[j].x[d] - me.x[d]);
            moves++;
            if (beta > strongest) {
              strongest = beta;
              me.attractor = j;
            }
          }
        }
        me.pull = strongest;
      }
      this.phaseDetail = `${moves} tarikan terjadi. Makin jauh, makin lemah (β = β₀·e^(−γr²)).`;
      return this.getState();
    }

    // WALK: langkah acak lalu evaluasi ulang (N evaluasi per iterasi)
    this.phase = 'WALK';
    this.phaseLabel = 'Langkah acak kecil';
    const stepSize = this.alpha * this.span;
    for (const a of this.agents) {
      a.stepFrom = a.x.slice();
      for (let d = 0; d < this.dim; d++) {
        a.x[d] = this.clamp(a.x[d] + stepSize * (this.rng.next() - 0.5));
      }
      a.f = this.evalFitness(a.x);
    }
    this.updateBest();
    this.iteration++;
    this.alpha *= this.alphaDecay;
    this.history.push({ iteration: this.iteration, bestFitness: this.bestEver.f });
    this.phaseDetail = `Iterasi ${this.iteration}: terbaik f = ${this.bestEver.f.toFixed(3)}. Langkah acak menyusut ke α = ${this.alpha.toFixed(3)}.`;
    if (this.iteration >= this.maxIterations) {
      this.phase = 'DONE';
      this.phaseLabel = 'Selesai';
      this.done = true;
      this.phaseDetail = `Selesai setelah ${this.iteration} iterasi dan ${this.evaluations} evaluasi. Terbaik f = ${this.bestEver.f.toFixed(4)}.`;
    }
    return this.getState();
  }

  /** Jalankan tahap sampai satu iterasi penuh selesai (dipakai simulasi cloud). */
  runIteration() {
    const target = this.iteration + 1;
    let guard = 0;
    while (!this.done && this.iteration < target && guard++ < 10) this.step();
    return this.getState();
  }

  getState() {
    return {
      kind: 'FA',
      phase: this.phase,
      phaseLabel: this.phaseLabel,
      phaseDetail: this.phaseDetail,
      iteration: this.iteration,
      maxIterations: this.maxIterations,
      evaluations: this.evaluations,
      alpha: this.alpha,
      agents: this.agents,
      brightestIndex: this.brightestIndex,
      best: this.bestEver ? { x: this.bestEver.x.slice(), fitness: this.bestEver.f } : null,
      history: this.history,
      done: this.done,
      params: { beta0: this.beta0, gamma: this.gamma, alpha0: this.alpha0 }
    };
  }
}
