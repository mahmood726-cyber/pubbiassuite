# Truth-recovery yardstick — pubbiassuite

**Verdict: VALIDATION with a method ranking + honest cautions. Among the suite's
bias *corrections*, the 3-parameter selection model (3PSM) recovers the true
effect best and is the only one that does not over-correct when there is no bias;
trim-and-fill and PET-PEESE over-correct under the null. The bias *tests* (Egger,
Begg) are poorly powered at realistic k and Egger over-rejects under
heterogeneity.**

## Method
Inject a known `(mu=0.3, tau2=0.05)` plus a known publication-selection mechanism
(step / Copas, weak / strong; the wave-1 selection DGP), then run the app's OWN
tests and corrections (engine.mjs, verbatim) and measure detection rates and the
|bias| of each correction vs the truth. k=15, 800 reps/cell.

## Results

### Detection — rejection rate (none = type-I, should be ~0.05; selection = power)
| scenario     | Egger | Begg |
|--------------|------:|-----:|
| none         | 0.096 | 0.018 |
| step_strong  | 0.135 | 0.168 |
| copas_strong | 0.116 | 0.063 |

Egger type-I vs heterogeneity (no selection): τ²=0 → 0.067, τ²=0.05 → 0.089,
τ²=0.10 → 0.097 (independent of μ).

### Correction — |bias| vs the true mu (lower = better truth-recovery)
| scenario     | naive-RE | trim-fill | PET-PEESE | 3PSM |
|--------------|---------:|----------:|----------:|-----:|
| none         | 0.072 | 0.117 | 0.130 | **0.076** |
| step_strong  | 0.187 | 0.158 | 0.151 | **0.120** |
| copas_strong | 0.111 | 0.104 | 0.156 | **0.094** |

## Findings (all measured)
1. **3PSM is the best truth-recoverer.** Under strong selection it has the lowest
   |bias| (0.120 step / 0.094 Copas, vs naive 0.187 / 0.111), and — crucially —
   under *no* selection it stays essentially at the naive RE (0.076 vs 0.072), so
   it does not over-correct a funnel that isn't biased. → **recommend 3PSM as the
   primary bias-correction.**
2. **trim-and-fill and PET-PEESE over-correct under the null.** With no bias they
   move *away* from the truth (trim-fill 0.117, PET-PEESE 0.130 vs naive 0.072).
   PET-PEESE is also unreliable under Copas selection (0.156 — *worse* than naive
   0.111). → treat both as **sensitivity analyses only**, never the primary
   estimate (matches the advanced-stats rules).
3. **Egger over-rejects under heterogeneity.** Its type-I climbs with τ² (0.067 →
   0.097), independent of the true effect — the documented limitation of the
   regression test, reproduced here. Not a code bug, but a caution: a "significant
   Egger" under heterogeneity is not reliable evidence of selection.
4. **Both bias tests are under-powered at k=15.** Even *strong* selection is
   flagged < 17% of the time (Egger 0.135, Begg 0.168 step; lower for Copas). → a
   non-significant Egger/Begg is **not** evidence of no publication bias at this k
   (matches "low power for k<10/k<15").

## Recommendation
Surface a method-choice note in the suite: prefer 3PSM for correction; label
trim-fill/PET-PEESE as sensitivity-only; warn that Egger/Begg are underpowered at
small k and Egger inflates under heterogeneity.

## What did NOT transfer / what DID
This is the publication-bias family the wave-1 selection DGP was built for, so the
known-truth selection harness transferred directly (the ubcma finding — joint
het+selection models win under selection — is the same conclusion 3PSM shows
here). No NPE/conformal needed; no runtime dependency added; engine unchanged.

## Reproduce
```
node truth-recovery/harness.mjs --reps 800
node --test truth-recovery/test-truth-recovery.mjs
```
