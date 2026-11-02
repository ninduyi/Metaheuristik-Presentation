import test from 'node:test';
import assert from 'node:assert/strict';
import { createRandom as createRng } from '../src/core/random.js';
import { landscapeById as getObjective } from '../src/core/landscapes.js';
import { FAEngine, attractiveness } from '../src/algorithms/firefly.js';
import { BAEngine, loudnessAt, pulseRateAt } from '../src/algorithms/bat.js';

const sphere = getObjective('sphere');
const rastrigin = getObjective('rastrigin');
const f2d = (obj) => (x) => obj.evaluate(x[0], x[1]);
const base = (obj) => ({ dim: 2, lo: obj.min, hi: obj.max, fitness: f2d(obj), populationSize: 20, maxIterations: 30, seed: 7 });

test('rng: seed yang sama menghasilkan urutan yang sama, seed beda berbeda', () => {
  const a = createRng(5);
  const b = createRng(5);
  const c = createRng(6);
  const sa = Array.from({ length: 5 }, () => a.next());
  const sb = Array.from({ length: 5 }, () => b.next());
  const sc = Array.from({ length: 5 }, () => c.next());
  assert.deepEqual(sa, sb);
  assert.notDeepEqual(sa, sc);
  assert.ok(sa.every((v) => v >= 0 && v < 1));
});

test('objektif: optimum global bernilai 0 di (0,0)', () => {
  for (const id of ['sphere', 'rastrigin', 'ackley']) {
    assert.ok(Math.abs(getObjective(id).evaluate(0, 0)) < 1e-9, id);
  }
});

test('FA: daya tarik menurun terhadap jarak dan sama dengan beta0 di jarak nol', () => {
  assert.equal(attractiveness(1, 2, 0), 1);
  assert.ok(attractiveness(1, 2, 0.5) > attractiveness(1, 2, 1));
  assert.ok(attractiveness(1, 5, 0.5) < attractiveness(1, 1, 0.5));
});

test('FA: urutan tahap EVAL, MOVE, WALK dan best tidak pernah memburuk', () => {
  const fa = new FAEngine(base(sphere));
  const phases = [];
  let prev = fa.getState().best.fitness;
  for (let i = 0; i < 9; i++) {
    const st = fa.step();
    phases.push(st.phase);
    assert.ok(st.best.fitness <= prev + 1e-12);
    prev = st.best.fitness;
  }
  assert.deepEqual(phases.slice(0, 6), ['EVAL', 'MOVE', 'WALK', 'EVAL', 'MOVE', 'WALK']);
});

test('FA: konvergen di Sphere dan berhenti di maxIterations', () => {
  const fa = new FAEngine({ ...base(sphere), maxIterations: 40 });
  const start = fa.getState().best.fitness;
  const end = fa.runIteration() && (() => { while (!fa.done) fa.runIteration(); return fa.getState(); })();
  assert.equal(end.iteration, 40);
  assert.ok(end.best.fitness < start * 0.2, `harus turun jauh: ${start} -> ${end.best.fitness}`);
});

test('FA: seed sama memberi hasil identik (reproducible)', () => {
  const run = () => {
    const fa = new FAEngine(base(rastrigin));
    while (!fa.done) fa.runIteration();
    return fa.getState().best.fitness;
  };
  assert.equal(run(), run());
});

test('BA: loudness turun dan pulse rate naik mengikuti rumus', () => {
  assert.ok(loudnessAt(1, 0.9, 5) < loudnessAt(1, 0.9, 1));
  assert.ok(pulseRateAt(0.5, 0.9, 5) > pulseRateAt(0.5, 0.9, 1));
  assert.ok(pulseRateAt(0.5, 0.9, 50) <= 0.5 + 1e-9);
});

test('BA: urutan tahap PULSE, LOCAL, ACCEPT dan best tidak pernah memburuk', () => {
  const ba = new BAEngine(base(sphere));
  const phases = [];
  let prev = ba.getState().best.fitness;
  for (let i = 0; i < 9; i++) {
    const st = ba.step();
    phases.push(st.phase);
    assert.ok(st.best.fitness <= prev + 1e-12);
    prev = st.best.fitness;
  }
  assert.deepEqual(phases.slice(0, 6), ['PULSE', 'LOCAL', 'ACCEPT', 'PULSE', 'LOCAL', 'ACCEPT']);
});

test('BA: posisi tetap berada dalam batas domain', () => {
  const ba = new BAEngine(base(rastrigin));
  while (!ba.done) ba.runIteration();
  for (const a of ba.getState().agents) {
    for (const v of a.x) assert.ok(v >= rastrigin.min && v <= rastrigin.max);
  }
});

test('FA dan BA: anggaran evaluasi per iterasi sama (N per iterasi)', () => {
  const cfg = { ...base(sphere), populationSize: 20, maxIterations: 10 };
  const fa = new FAEngine(cfg);
  const ba = new BAEngine(cfg);
  const fa0 = fa.getState().evaluations;
  const ba0 = ba.getState().evaluations;
  while (!fa.done) fa.runIteration();
  while (!ba.done) ba.runIteration();
  assert.equal(fa.getState().evaluations - fa0, 20 * 10);
  assert.equal(ba.getState().evaluations - ba0, 20 * 10);
});
