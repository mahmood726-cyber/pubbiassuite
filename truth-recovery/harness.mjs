// ============================================================
// harness.mjs -- Truth-recovery yardstick for pubbiassuite.
//
// Injects a known (mu, tau^2) plus a known PUBLICATION-SELECTION mechanism, then
// runs the app's OWN publication-bias tests and corrections (engine.mjs, verbatim)
// to measure two things against the truth:
//   (1) DETECTION: do Egger / Begg detect selection when present (power) and stay
//       calibrated when absent (type-I)?
//   (2) CORRECTION: which of naive RE / trim-and-fill / PET-PEESE / 3PSM best
//       RECOVERS the true mu (lowest |bias|) under selection?
//
// Truth-first: every number printed comes from seeded simulation here.
// Run:  node truth-recovery/harness.mjs --reps 600
// ============================================================

import { randomEffectsMA, runEgger, runBegg, runTrimFill, runPET, runPEESE, runPETPEESE, run3PSM }
  from './engine.mjs';
import { generate, makeRng, SCENARIOS } from './dgp.mjs';

const BASE_SEED = 20260613;

function detectP(name, y, se, v) {
  try {
    if (name === 'Egger') return runEgger(y, se).p;
    if (name === 'Begg') return runBegg(y, v).p;
  } catch { return null; }
  return null;
}
function correctMu(name, y, se, v, naive) {
  try {
    if (name === 'naive-RE') return naive;
    if (name === 'trim-fill') return runTrimFill(y, se).adjMuRE;
    if (name === 'PET-PEESE') return runPETPEESE(runPET(y, se, v), runPEESE(y, se, v)).adjEstimate;
    if (name === '3PSM') return run3PSM(y, se, v).adjMu;
  } catch { return null; }
  return null;
}

const TESTS = ['Egger', 'Begg'];
const CORR = ['naive-RE', 'trim-fill', 'PET-PEESE', '3PSM'];
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;

export function runCell(mu, tau2, k, scenario, reps, rng) {
  const det = {}; for (const t of TESTS) det[t] = { flag: 0, n: 0 };
  const cor = {}; for (const c of CORR) cor[c] = { absBiasSum: 0, biasSum: 0, n: 0 };
  for (let r = 0; r < reps; r++) {
    const { yi, vi } = generate(mu, tau2, k, scenario, rng);
    const se = vi.map(Math.sqrt);
    const naive = randomEffectsMA(yi, se).mu;
    for (const t of TESTS) {
      const p = detectP(t, yi, se, vi);
      if (p != null && isFinite(p)) { det[t].n++; if (p < 0.05) det[t].flag++; }
    }
    for (const c of CORR) {
      const est = correctMu(c, yi, se, vi, naive);
      if (est != null && isFinite(est)) { cor[c].n++; cor[c].absBiasSum += Math.abs(est - mu); cor[c].biasSum += est - mu; }
    }
  }
  const res = { detect: {}, correct: {} };
  for (const t of TESTS) res.detect[t] = det[t].n ? +(det[t].flag / det[t].n).toFixed(3) : null;
  for (const c of CORR) res.correct[c] = cor[c].n ? { absBias: +(cor[c].absBiasSum / cor[c].n).toFixed(4), bias: +(cor[c].biasSum / cor[c].n).toFixed(4) } : null;
  return res;
}

export function runGrid({ reps = 600, k = 15, mu = 0.3, tau2 = 0.05, scenarios = SCENARIOS } = {}) {
  const rng = makeRng(BASE_SEED);
  const grid = [];
  for (const scen of scenarios) grid.push({ scen, results: runCell(mu, tau2, k, scen, reps, rng) });
  return grid;
}

const isMain = process.argv[1]?.endsWith('harness.mjs');
if (isMain) {
  const i = process.argv.indexOf('--reps');
  const reps = i >= 0 ? Number(process.argv[i + 1]) : 600;
  const t0 = Date.now();
  const grid = runGrid({ reps });
  console.log(`\n# Truth-recovery yardstick -- pubbiassuite`);
  console.log(`reps=${reps}/cell  mu=0.3 tau2=0.05 k=15  seed=${BASE_SEED}\n`);
  console.log('## DETECTION -- rejection rate of bias tests (none=type-I should be ~0.05; selection=power)\n');
  console.log('scenario       Egger   Begg');
  for (const c of grid) console.log(c.scen.padEnd(14), String(c.results.detect.Egger).padStart(6), String(c.results.detect.Begg).padStart(6));
  console.log('\n## CORRECTION -- |bias| of each estimate vs true mu (lower = better truth-recovery)\n');
  console.log('scenario       naive-RE  trim-fill  PET-PEESE   3PSM');
  for (const c of grid) {
    const r = c.results.correct;
    console.log(c.scen.padEnd(14),
      String(r['naive-RE'].absBias).padStart(8), String(r['trim-fill'].absBias).padStart(10),
      String(r['PET-PEESE'].absBias).padStart(10), String(r['3PSM'].absBias).padStart(7));
  }
  console.log(`\n(${(Date.now() - t0) / 1000}s)`);
}
