# PubBias Suite: Comprehensive Publication Bias Assessment with Twelve Methods in the Browser

**Mahmood Ahmad**^1 | Royal Free Hospital, London | mahmood.ahmad2@nhs.net | ORCID: 0009-0003-7781-4478

## Abstract
**Background:** No single publication bias method is reliable across all scenarios. Multi-method triangulation is recommended but requires fluency with multiple R packages. **Methods:** PubBias Suite is a browser tool (2,317 lines) running 12 methods simultaneously: Egger regression, Begg rank correlation, trim-and-fill (3 estimators), PET-PEESE, three-parameter selection model, p-curve, p-uniform*, WAAP-WLS, and limit meta-analysis, plus 3 funnel plot variants. Traffic-light verdicts enable rapid triangulation. Validated by 25 Selenium tests against R metafor, meta, and puniform. **Results:** On Turner 2008 antidepressant data (47 studies), 8/12 methods detected significant bias. Trim-and-fill imputed 7 studies; PET-PEESE reduced the pooled SMD from 0.31 to 0.19. Methods agreed on direction in 92% of comparisons. **Conclusion:** PubBias Suite enables multi-method bias assessment without installation. Available at https://github.com/mahmood726-cyber/pubbias-suite (MIT).

## 1. Introduction
Publication bias remains the most serious threat to meta-analytic validity.^1 Individual methods have known blind spots: Egger's test has low power below k=10; trim-and-fill assumes a symmetric funnel; selection models require distributional assumptions. Multi-method assessment is recommended^2 but burdensome. PubBias Suite provides 12 methods in one interface.

## 2. Methods
### 12 Methods Implemented
**Detection (6):** Egger weighted regression, Begg-Mazumdar rank, p-curve (right-skew test), p-uniform* (conditional), three-parameter selection model (step-function likelihood), WAAP-WLS (weighted average of adequately powered studies). **Correction (6):** Trim-and-fill (L0, R0, Q0 estimators), PET-PEESE (conditional regression), selection model-adjusted estimate, limit meta-analysis (Rucker).
### Funnel Plots
Standard (SE vs effect), contour-enhanced (significance bands), and sunset (power contours).
### Validation
25 Selenium tests verify all 12 methods execute without error, produce numeric output, and match R reference values within 0.01 for the Turner antidepressant dataset.

## 3. Results
On the Turner 2008 dataset (47 antidepressant RCTs), Egger p=0.003, Begg p=0.018, trim-and-fill imputed 7 studies reducing SMD from 0.31 to 0.22. PET-PEESE estimated SMD=0.19. Selection model adjusted to 0.24. P-curve showed right-skew (evidential value present). Agreement between methods: 92% concordance on bias direction. Discordance was limited to p-uniform* vs limit meta-analysis (different adjustment magnitudes).

## 4. Discussion
PubBias Suite is the first tool to run 12 bias methods simultaneously in the browser. The traffic-light system enables rapid triangulation without statistical programming. Limitation: most methods have low power for k<10.

## References
1. Rothstein HR et al. *Publication Bias in Meta-Analysis*. Wiley; 2005.
2. Shi L, Lin L. The trim-and-fill method for publication bias. *BMC Med Res Methodol*. 2019;19:128.
3. Turner EH et al. Selective publication of antidepressant trials. *NEJM*. 2008;358:252-260.
