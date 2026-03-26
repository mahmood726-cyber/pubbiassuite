# PubBias Suite

Comprehensive publication bias assessment with 12 statistical methods and 3 funnel plot variants.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Overview

PubBias Suite implements 12 complementary publication bias detection and adjustment methods in a single browser-based tool, going well beyond what any single R package provides. It combines classical regression tests (Egger, Begg) with modern selection model approaches (3PSM, p-curve, p-uniform*), bias-adjusted estimators (PET-PEESE, WAAP-WLS, limit meta-analysis), and nonparametric corrections (trim-and-fill). Three funnel plot variants -- standard, contour-enhanced, and sunset -- provide visual assessment alongside the statistical tests.

## Features

- 12 publication bias methods run simultaneously on the same dataset
- Egger's regression test for funnel plot asymmetry
- Begg and Mazumdar rank correlation test
- Trim-and-fill (L0 and R0 estimators) with imputed studies shown on funnel plot
- PET (precision-effect test) regression
- PEESE (precision-effect estimate with standard error) regression
- PET-PEESE conditional estimator (automatic model selection)
- Three-parameter selection model (3PSM) with one-sided p-value weighting
- p-curve analysis (right-skewness and flatness tests)
- p-uniform* (conditional estimator with publication bias correction)
- WAAP-WLS (weighted average of adequately powered studies, with WLS fallback)
- Limit meta-analysis (Rucker et al.)
- Standard funnel plot with pseudo-95% confidence region
- Contour-enhanced funnel plot (significance contours at p = 0.01, 0.05, 0.10)
- Sunset funnel plot (statistical power regions)
- Support for multiple effect types: log-OR, log-RR, SMD, MD
- Per-method interpretation text with traffic-light verdict (bias detected / not detected)
- Dark mode toggle
- CSV data import and MAIF import/export for cross-tool data flow

## Quick Start

1. Download `pub-bias-suite.html`
2. Open in any modern browser
3. No installation, no dependencies, works offline

## Built-in Examples

- **BCG Vaccine**: 13 studies, log-RR (classic heterogeneous dataset)
- **Antidepressants (Turner 2008)**: 47 studies, SMD (Hedges' g from FDA comparison, known publication bias)

## Methods

| Method | Type | Reference |
|--------|------|-----------|
| Egger's test | Regression | Egger et al. BMJ 1997 |
| Begg's test | Rank correlation | Begg and Mazumdar, Biometrics 1994 |
| Trim-and-fill | Nonparametric | Duval and Tweedie, Biometrics 2000 |
| PET | Regression | Stanley and Doucouliagos, 2014 |
| PEESE | Regression | Stanley and Doucouliagos, 2014 |
| PET-PEESE | Conditional | Stanley and Doucouliagos, 2014 |
| 3PSM | Selection model | Vevea and Hedges, 1995 |
| p-curve | Evidential value | Simonsohn et al., 2014 |
| p-uniform* | Conditional | van Aert et al., 2016 |
| WAAP-WLS | Adequately powered | Ioannidis et al., 2017 |
| Limit MA | Small-study adjustment | Rucker et al., 2011 |

## Screenshots

> Screenshots can be added by opening the tool and using browser screenshot.

## Validation

- 25/25 Selenium tests pass
- Individual methods cross-validated against the R metafor, meta, and puniform packages

## Export

- CSV (study data and all method results)
- JSON (full analysis output)
- MAIF (Meta-Analysis Interchange Format) for cross-tool data flow

## Citation

If you use this tool, please cite:

> Ahmad M. PubBias Suite: A comprehensive browser-based publication bias assessment tool with 12 methods. 2026. Available at: https://github.com/mahmood726-cyber/pub-bias-suite

## Author

**Mahmood Ahmad**
Royal Free Hospital, London, United Kingdom
ORCID: [0009-0003-7781-4478](https://orcid.org/0009-0003-7781-4478)

## License

MIT
