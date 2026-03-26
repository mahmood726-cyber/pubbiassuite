# PubBias Suite: A 12-Method Publication Bias Assessment Workbench

Mahmood Ahmad^1 | ^1 Royal Free Hospital, London, UK | mahmood.ahmad2@nhs.net | ORCID: 0009-0003-7781-4478

## Abstract

PubBias Suite is a single-file browser application (2,255 lines) that consolidates 12 publication bias detection methods into one interactive workbench. Methods include: (1) contour-enhanced funnel plot, (2) Egger's regression, (3) Begg's rank correlation, (4) trim-and-fill, (5) PET-PEESE, (6) p-curve, (7) z-curve, (8) Vevea-Hedges selection model, (9) 3-parameter selection model, (10) limit meta-analysis, (11) Copas selection model, and (12) R-index. The tool computes all 12 methods simultaneously on user-provided data, producing a concordance matrix showing which methods agree on the presence or absence of bias. This comparative approach addresses the well-known problem that different bias methods often disagree, leaving analysts uncertain about which to trust. Available at https://github.com/mahmood726-cyber/pub-bias-suite.

## Introduction

Publication bias is the most persistent threat to meta-analytic validity, yet no single detection method is adequate. Egger's test has low power for k<10, trim-and-fill assumes a symmetric funnel, and selection models require distributional assumptions. In practice, analysts run one or two methods and report the result, potentially cherry-picking the most favourable. PubBias Suite forces transparency by running all 12 methods simultaneously and reporting their concordance.

The 12-method approach is inspired by the Bias Forensics project, which found that method-specific blind spots are common across 307 Cochrane reviews: methods that detect bias in one review often miss it in another. PubBias Suite brings this multi-method philosophy to individual review analysis.

## Implementation

The workbench accepts effect sizes and standard errors (or can compute them from 2x2 tables). All 12 methods are implemented in self-contained JavaScript functions with no external dependencies beyond Plotly for visualization. The concordance matrix shows binary agreement (bias detected / not detected) across all method pairs, with an overall concordance score (0-12 methods detecting bias). Contour-enhanced funnel plots overlay significance regions (p < 0.01, 0.01-0.05, 0.05-0.10) to visually reveal differential clustering. P-curve and z-curve provide evidential value assessment complementing the bias detection methods.

## Availability

Single HTML file, MIT license. Source: https://github.com/mahmood726-cyber/pub-bias-suite

## Funding
None.

## References
1. Sterne JAC, et al. Recommendations for examining funnel plot asymmetry in meta-analyses of RCTs. BMJ. 2011;343:d4002.
2. Vevea JL, Hedges LV. A general linear model for estimating effect size in the presence of publication bias. Psychometrika. 1995;60:419-435.
3. Stanley TD, Doucouliagos H. Meta-regression approximations to reduce publication selection bias. Res Synth Methods. 2014;5:60-78.
4. Simonsohn U, Nelson LD, Simmons JP. P-curve: a key to the file-drawer. J Exp Psychol Gen. 2014;143:534-547.
5. Copas J. What works?: selectivity models and meta-analysis. J R Stat Soc A. 1999;162:95-109.
