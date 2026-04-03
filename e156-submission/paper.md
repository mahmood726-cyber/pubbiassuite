Mahmood Ahmad
Tahir Heart Institute
author@example.com

PubBias Suite: Comprehensive Publication Bias Assessment with 12 Methods and 3 Funnel Plot Variants

How can meta-analysts assess publication bias using multiple complementary methods within a single integrated environment? PubBias Suite runs 12 detection and adjustment methods simultaneously, including Egger regression, Begg rank correlation, trim-and-fill, PET-PEESE, three-parameter selection modeling, p-curve, p-uniform star, WAAP-WLS, and limit meta-analysis, alongside three funnel plot variants. Each method uses the same dataset with traffic-light verdicts indicating whether bias is detected, enabling triangulation across regression tests, selection models, and nonparametric corrections. Validation across 25 Selenium tests confirmed correct execution for all 12 methods and 3 funnel types using the Turner 2008 antidepressant SMD dataset comprising 47 studies with 95% CI validation. Individual implementations were cross-validated against R metafor, meta, and puniform packages with results matching within documented tolerances. The tool enables multi-method assessment reducing reliance on any single diagnostic when evaluating evidence reliability. Most methods have limited power below approximately 10 studies, and results should be interpreted cautiously in small meta-analyses where detection is inherently unreliable.

Outside Notes

Type: methods
Primary estimand: Bias-adjusted pooled effect estimates
App: PubBias Suite v1.0
Data: 12 bias methods + 3 funnel plots
Code: https://github.com/mahmood726-cyber/pubbiassuite
Version: 1.0
Validation: DRAFT

References

1. Egger M, Davey Smith G, Schneider M, Minder C. Bias in meta-analysis detected by a simple, graphical test. BMJ. 1997;315(7109):629-634.
2. Duval S, Tweedie R. Trim and fill: a simple funnel-plot-based method of testing and adjusting for publication bias in meta-analysis. Biometrics. 2000;56(2):455-463.
3. Borenstein M, Hedges LV, Higgins JPT, Rothstein HR. Introduction to Meta-Analysis. 2nd ed. Wiley; 2021.

AI Disclosure

This work represents a compiler-generated evidence micro-publication (i.e., a structured, pipeline-based synthesis output). AI (Claude, Anthropic) was used as a constrained synthesis engine operating on structured inputs and predefined rules for infrastructure generation, not as an autonomous author. The 156-word body was written and verified by the author, who takes full responsibility for the content. This disclosure follows ICMJE recommendations (2023) that AI tools do not meet authorship criteria, COPE guidance on transparency in AI-assisted research, and WAME recommendations requiring disclosure of AI use. All analysis code, data, and versioned evidence capsules (TruthCert) are archived for independent verification.
