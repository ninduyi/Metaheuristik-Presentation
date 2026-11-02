import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CloudScheduleOptimizer,
  DEFAULT_VMS,
  decodeSchedule,
  evaluateAssignment,
  evaluateSchedule,
  generateTasks,
  idealMakespan,
  makeVMs,
  minMin,
  roundRobin,
  runExperiment,
  sharedInitialPopulation,
  summarizeExperiment
} from '../src/algorithms/cloudScheduling.js';

test('makeVMs: empat VM berkecepatan 85, 115, 145, 175 MIPS', () => {
  assert.deepEqual(makeVMs(4).map((v) => v.mips), [85, 115, 145, 175]);
});

test('generateTasks: deterministik dan panjang tugas dalam rentang', () => {
  const a = generateTasks(16, 2026);
  const b = generateTasks(16, 2026);
  assert.deepEqual(a, b);
  assert.ok(a.every((t) => t.mi >= 140 && t.mi <= 620));
});

test('decodeSchedule: lantai dan dijepit ke rentang VM', () => {
  assert.deepEqual(decodeSchedule([0.2, 1.99, 3.9999, -1, 9], 4), [0, 1, 3, 0, 3]);
});

test('evaluateAssignment: makespan = beban VM terbesar, waktu = MI / MIPS', () => {
  const tasks = [{ id: 1, name: 'T1', mi: 170 }, { id: 2, name: 'T2', mi: 170 }];
  const vms = [{ id: 0, name: 'A', mips: 85 }, { id: 1, name: 'B', mips: 170 }];
  const r = evaluateAssignment([0, 1], tasks, vms);
  assert.deepEqual(r.vmLoads, [2, 1]);
  assert.equal(r.makespan, 2);
  assert.ok(r.fitness >= r.makespan && r.fitness < r.makespan + 0.01);
});

test('batas bawah ideal tidak pernah dilampaui oleh jadwal apa pun', () => {
  const tasks = generateTasks(16, 2026);
  const ideal = idealMakespan(tasks, DEFAULT_VMS);
  assert.ok(roundRobin(tasks).makespan >= ideal - 1e-9);
  assert.ok(minMin(tasks).makespan >= ideal - 1e-9);
});

test('Min-Min lebih baik dari Round-Robin pada beban kerja contoh', () => {
  const tasks = generateTasks(16, 2026);
  assert.ok(minMin(tasks).makespan < roundRobin(tasks).makespan);
});

test('populasi awal bersama: deterministik dan di dalam [0, m)', () => {
  const a = sharedInitialPopulation(16, 4, 28, 42);
  const b = sharedInitialPopulation(16, 4, 28, 42);
  assert.deepEqual(a, b);
  assert.ok(a.flat().every((v) => v >= 0 && v < 4));
});

test('optimizer: FA dan BA mulai dari populasi yang sama dan dievaluasi sama banyak', () => {
  const opt = new CloudScheduleOptimizer({ n: 16, m: 4, populationSize: 20, maxIterations: 10, seed: 42 });
  const fa0 = opt.fa.getState().agents.map((a) => a.x);
  const ba0 = opt.ba.getState().agents.map((a) => a.x);
  assert.deepEqual(fa0, ba0);
  const st = opt.run();
  assert.equal(st.fa.evaluations, st.ba.evaluations);
  assert.ok(st.done);
});

test('optimizer: FA dan BA sama-sama mengalahkan Round-Robin dan tidak melewati batas ideal', () => {
  const opt = new CloudScheduleOptimizer({ n: 16, m: 4, maxIterations: 40, seed: 42 });
  const st = opt.run();
  assert.ok(st.evalFa.makespan < st.baselineRR.makespan);
  assert.ok(st.evalBa.makespan < st.baselineRR.makespan);
  assert.ok(st.evalFa.makespan >= st.ideal - 1e-9);
  assert.ok(st.evalBa.makespan >= st.ideal - 1e-9);
});

test('optimizer: riwayat konvergensi tidak pernah naik', () => {
  const st = new CloudScheduleOptimizer({ maxIterations: 20, seed: 9 }).run();
  for (const key of ['fa', 'ba']) {
    const h = st[key].history.map((p) => p.bestFitness);
    for (let i = 1; i < h.length; i++) assert.ok(h[i] <= h[i - 1] + 1e-12);
  }
});

test('eksperimen: ringkasan menghitung kemenangan dan rasio ke batas ideal dengan benar', () => {
  const rows = runExperiment({ workloads: 4, n: 12, m: 4, populationSize: 16, maxIterations: 15, seed: 5 });
  assert.equal(rows.length, 4);
  const s = summarizeExperiment(rows);
  assert.equal(s.faWins + s.baWins + s.ties, 4);
  assert.ok(s.ratio.fa >= 1 && s.ratio.ba >= 1);
  assert.ok(s.ratio.rr > s.ratio.fa);
});

test('evaluateSchedule konsisten dengan decode lalu evaluateAssignment', () => {
  const tasks = generateTasks(8, 1);
  const v = [0.1, 1.2, 2.3, 3.4, 0.5, 1.6, 2.7, 3.8];
  const a = evaluateSchedule(v, tasks, DEFAULT_VMS);
  const b = evaluateAssignment(decodeSchedule(v, 4), tasks, DEFAULT_VMS);
  assert.equal(a.fitness, b.fitness);
});
