// node --test truth-recovery/test-truth-recovery.mjs
// Measured invariants for the pubbiassuite truth-recovery yardstick. Seeded; no
// hand-entered numbers.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { generate, makeRng } from './dgp.mjs';
import { runCell } from './harness.mjs';

describe('selection DGP', () => {
  it('is reproducible for a fixed seed', () => {
    const a = generate(0.3, 0.05, 15, 'step_strong', makeRng(7));
    const b = generate(0.3, 0.05, 15, 'step_strong', makeRng(7));
    assert.deepEqual(a.yi, b.yi);
  });
});

describe('Truth-recovery (measured)', () => {
  it('3PSM does NOT over-correct when there is no bias (stays close to naive; trim-fill/PET-PEESE drift)', () => {
    const r = runCell(0.3, 0.05, 15, 'none', 500, makeRng(20260613)).correct;
    // Under no selection the naive RE is (near-)unbiased; a good corrector should not move away.
    assert.ok(r['3PSM'].absBias < r['trim-fill'].absBias,
      `3PSM ${r['3PSM'].absBias} not < trim-fill ${r['trim-fill'].absBias} under no bias`);
    assert.ok(r['3PSM'].absBias < r['PET-PEESE'].absBias,
      `3PSM ${r['3PSM'].absBias} not < PET-PEESE ${r['PET-PEESE'].absBias} under no bias`);
  });

  it('under strong selection 3PSM recovers the truth better than naive RE', () => {
    const r = runCell(0.3, 0.05, 15, 'step_strong', 500, makeRng(20260615)).correct;
    assert.ok(r['3PSM'].absBias < r['naive-RE'].absBias,
      `3PSM ${r['3PSM'].absBias} not better than naive ${r['naive-RE'].absBias} under selection`);
  });

  it("Egger's test is under-powered at k=15 (rejection under strong selection stays modest)", () => {
    const r = runCell(0.3, 0.05, 15, 'step_strong', 500, makeRng(3)).detect;
    // honest: even strong selection is detected well below 50% of the time here.
    assert.ok(r.Egger < 0.4, `Egger power under strong selection ${r.Egger} unexpectedly high`);
  });
});
