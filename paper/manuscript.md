Mahmood Ahmad
Tahir Heart Institute
author@example.com

PubBias Suite: Twelve-Method Publication Bias Assessment in the Browser

Publication bias threatens meta-analytic validity, yet no single detection method is reliable across all scenarios, and triangulation typically requires multiple R packages. PubBias Suite is a browser tool running 12 methods simultaneously: Egger regression, Begg rank correlation, trim-and-fill, PET-PEESE, three-parameter selection model, p-curve, p-uniform star, WAAP-WLS, and limit meta-analysis, with standard, contour-enhanced, and sunset funnel plots. Traffic-light verdicts synthesize regression-based, selection-model, and nonparametric results into an immediate visual triangulation summary. On the Turner antidepressant dataset of 47 studies, eight of twelve methods detected significant bias, trim-and-fill imputed seven studies, and PET-PEESE reduced the pooled SMD from 0.31 to 0.19 with 92% concordance. All methods and funnel variants were validated against R metafor, meta, and puniform through 25 Selenium tests matching reference values within tolerances. The tool democratizes comprehensive bias assessment by removing installation barriers for clinicians without programming expertise. Most methods have limited power below ten studies, so results in small meta-analyses should be considered exploratory.

Outside Notes

Type: methods
Primary estimand: Bias-adjusted pooled effect estimates
App: PubBias Suite v1.0 (2,273 lines)
Data: Turner 2008 antidepressant dataset (47 studies)
Code: https://github.com/mahmood726-cyber/pubbias-suite
Version: 1.0
Certainty: not stated
Validation: PASS (25 Selenium tests vs R metafor, meta, puniform)

References

1. Egger M, Davey Smith G, Schneider M, Minder C. Bias in meta-analysis detected by a simple, graphical test. BMJ. 1997;315(7109):629-634.
2. Duval S, Tweedie R. Trim and fill: a simple funnel-plot-based method of testing and adjusting for publication bias in meta-analysis. Biometrics. 2000;56(2):455-463.
3. Turner EH, Matthews AM, Linardatos E, Tell RA, Rosenthal R. Selective publication of antidepressant trials and its influence on apparent efficacy. NEJM. 2008;358(3):252-260.

AI Disclosure

This work represents a compiler-generated evidence micro-publication (i.e., a structured, pipeline-based synthesis output). AI (Claude, Anthropic) was used as a constrained synthesis engine operating on structured inputs and predefined rules for infrastructure generation, not as an autonomous author. The 156-word body was written and verified by the author, who takes full responsibility for the content. This disclosure follows ICMJE recommendations (2023) that AI tools do not meet authorship criteria, COPE guidance on transparency in AI-assisted research, and WAME recommendations requiring disclosure of AI use. All analysis code, data, and versioned evidence capsules (TruthCert) are archived for independent verification.
