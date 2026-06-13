// engine.mjs -- pure publication-bias engine EXTRACTED VERBATIM from
// pub-bias-suite.html: stat helpers + MA (371-844) and the bias tests +
// corrections (1055-1376: Egger/Peters/Begg/TrimFill/PET/PEESE/PET-PEESE/3PSM).
// DOM-coupled state code (845-1054) is skipped. SAME math the app ships.

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function csvSafe(s) {
  if (s == null) return '';
  s = String(s);
  if (/^[=+@\t\r]/.test(s)) s = "'" + s;
  if (s.indexOf(',') >= 0 || s.indexOf('"') >= 0 || s.indexOf('\n') >= 0) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

/** Standard normal CDF (Abramowitz & Stegun approximation, max error ~1.5e-7) */
function normalCDF(x) {
  if (!isFinite(x)) return x > 0 ? 1 : 0;
  var a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  var a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  var sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.SQRT2;
  var t = 1.0 / (1.0 + p * x);
  var y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t * Math.exp(-x*x);
  return 0.5 * (1.0 + sign * y);
}

/** Standard normal quantile (Beasley-Springer-Moro) */
function normalQuantile(p) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;
  // Rational approximation
  var a = [
    -3.969683028665376e+01, 2.209460984245205e+02,
    -2.759285104469687e+02, 1.383577518672690e+02,
    -3.066479806614716e+01, 2.506628277459239e+00
  ];
  var b = [
    -5.447609879822406e+01, 1.615858368580409e+02,
    -1.556989798598866e+02, 6.680131188771972e+01,
    -1.328068155288572e+01
  ];
  var c = [
    -7.784894002430293e-03, -3.223964580411365e-01,
    -2.400758277161838e+00, -2.549732539343734e+00,
     4.374664141464968e+00, 2.938163982698783e+00
  ];
  var d = [
    7.784695709041462e-03, 3.224671290700398e-01,
    2.445134137142996e+00, 3.754408661907416e+00
  ];
  var pLow = 0.02425, pHigh = 1 - pLow;
  var q, r;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
           ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (p <= pHigh) {
    q = p - 0.5; r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
           (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
            ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
}

/** Normal PDF */
function normalPDF(x) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/** Student t CDF approximation (Hill, 1970) — adequate for df>=2 */
function tCDF(t, df) {
  if (df <= 0) return NaN;
  // Use normal approx for large df
  if (df > 200) return normalCDF(t);
  var x = df / (df + t * t);
  var a = df / 2;
  var b = 0.5;
  var ibeta = regularizedBeta(x, a, b);
  if (t >= 0) return 1 - 0.5 * ibeta;
  return 0.5 * ibeta;
}

/** Regularized incomplete beta function (continued fraction, Lentz) */
function regularizedBeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  // Use Lentz continued fraction
  var lbeta = lnBeta(a, b);
  var front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta) / a;
  var f = 1, c = 1, d = 0;
  for (var i = 0; i <= 200; i++) {
    var m = Math.floor(i / 2);
    var numerator;
    if (i === 0) {
      numerator = 1;
    } else if (i % 2 === 0) {
      numerator = (m * (b - m) * x) / ((a + 2*m - 1) * (a + 2*m));
    } else {
      numerator = -((a + m) * (a + b + m) * x) / ((a + 2*m) * (a + 2*m + 1));
    }
    d = 1 + numerator * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    d = 1 / d;
    c = 1 + numerator / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    f *= c * d;
    if (Math.abs(c * d - 1) < 1e-10) break;
  }
  return front * (f - 1);
}

function lnBeta(a, b) {
  return lnGamma(a) + lnGamma(b) - lnGamma(a + b);
}

/** Log-gamma (Stirling series) */
function lnGamma(x) {
  if (x <= 0) return Infinity;
  // Lanczos approximation
  var g = 7;
  var coef = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
  ];
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x);
  }
  x -= 1;
  var a = coef[0];
  var t = x + g + 0.5;
  for (var i = 1; i < coef.length; i++) {
    a += coef[i] / (x + i);
  }
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/* ── _core helpers from meta-stats-core (inlined for single-file use) ── */

/** Log-gamma via Lanczos approximation (_core) */
function lnGamma_core(x) {
  var g = 7;
  var c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
           771.32342877765313, -176.61502916214059, 12.507343278686905,
           -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma_core(1 - x);
  x -= 1;
  var a = c[0];
  var t = x + g + 0.5;
  for (var i = 1; i < c.length; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/** Regularized incomplete beta via continued fraction (_core) */
function betaCF_core(x, a, b) {
  var f = 1, c2 = 1, d = 1 - (a+b)*x/(a+1);
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1/d; f = d;
  for (var m = 1; m <= 200; m++) {
    var num = m * (b - m) * x / ((a + 2*m - 1) * (a + 2*m));
    d = 1 + num * d; if (Math.abs(d) < 1e-30) d = 1e-30; d = 1/d;
    c2 = 1 + num / c2; if (Math.abs(c2) < 1e-30) c2 = 1e-30;
    f *= d * c2;
    num = -(a + m) * (a + b + m) * x / ((a + 2*m) * (a + 2*m + 1));
    d = 1 + num * d; if (Math.abs(d) < 1e-30) d = 1e-30; d = 1/d;
    c2 = 1 + num / c2; if (Math.abs(c2) < 1e-30) c2 = 1e-30;
    var delta = d * c2;
    f *= delta;
    if (Math.abs(delta - 1) < 1e-12) break;
  }
  return f;
}

function regBetaI_core(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  var lnBeta = lnGamma_core(a) + lnGamma_core(b) - lnGamma_core(a + b);
  var front = Math.exp(Math.log(x)*a + Math.log(1-x)*b - lnBeta) / a;
  return front * betaCF_core(x, a, b);
}

/** Regularized incomplete gamma (_core) */
function regGammaP_core(a, x) {
  if (x < 0) return 0;
  if (x === 0) return 0;
  if (x > a + 1) return 1 - regGammaQ_core(a, x);
  var sum = 1/a, term = 1/a;
  for (var n = 1; n < 300; n++) {
    term *= x / (a + n);
    sum += term;
    if (Math.abs(term) < 1e-14 * Math.abs(sum)) break;
  }
  return Math.exp(-x + a * Math.log(x) - lnGamma_core(a)) * sum;
}

function regGammaQ_core(a, x) {
  var f = x - a + 1 + 1e-30;
  var c2 = f, d = 0, delta;
  for (var m = 1; m <= 300; m++) {
    var an1 = m * (a - m);
    var an2 = x - a + 2*m + 1;
    d = an2 + an1 * d; if (Math.abs(d) < 1e-30) d = 1e-30; d = 1/d;
    c2 = an2 + an1 / c2; if (Math.abs(c2) < 1e-30) c2 = 1e-30;
    delta = c2 * d; f *= delta;
    if (Math.abs(delta - 1) < 1e-12) break;
  }
  return Math.exp(-x + a * Math.log(x) - lnGamma_core(a)) / f;
}

/** t-distribution PDF and CDF (_core) */
function tPDF_core(t, df) {
  return Math.exp(lnGamma_core((df+1)/2) - lnGamma_core(df/2) - 0.5*Math.log(df*Math.PI)
         - ((df+1)/2) * Math.log(1 + t*t/df));
}

function tCDF_core(t, df) {
  var x = df / (df + t * t);
  var ib = regBetaI_core(x, df/2, 0.5);
  return t < 0 ? 0.5 * ib : 1 - 0.5 * ib;
}

/** Normal quantile (_core) — Beasley-Springer-Moro */
function normalQuantile_core(p) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;
  var a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
           1.383577518672690e2, -3.066479806614716e1, 2.506628277459239e0];
  var b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
           6.680131188771972e1, -1.328068155288572e1];
  var c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0,
           -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0];
  var d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0, 3.754408661907416e0];
  var pLow = 0.02425, pHigh = 1 - pLow;
  var q, r;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
           ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (p <= pHigh) {
    q = p - 0.5; r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
           (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
            ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
}

/** t-distribution quantile — Cornish-Fisher + Newton-Raphson (_core) */
function tQuantile_core(p, df) {
  if (df <= 0) return NaN;
  if (df === 1) return Math.tan(Math.PI * (p - 0.5));
  if (df === 2) return (2 * p - 1) / Math.sqrt(2 * p * (1 - p));
  var zp = normalQuantile_core(p);
  var g1 = (zp * zp * zp + zp) / (4 * df);
  var g2 = (5 * Math.pow(zp, 5) + 16 * zp * zp * zp + 3 * zp) / (96 * df * df);
  var g3 = (3 * Math.pow(zp, 7) + 19 * Math.pow(zp, 5) + 17 * zp * zp * zp - 15 * zp) / (384 * Math.pow(df, 3));
  var t = zp + g1 + g2 + g3;
  for (var i = 0; i < 3; i++) {
    var cdf = tCDF_core(t, df);
    var pdf = tPDF_core(t, df);
    if (pdf < 1e-15) break;
    t -= (cdf - p) / pdf;
  }
  return t;
}

/** Chi-squared CDF and quantile (_core) */
function chi2CDF_core(x, df) {
  if (x <= 0) return 0;
  return regGammaP_core(df / 2, x / 2);
}

function chi2Quantile_core(p, df) {
  var x = df * Math.pow(1 - 2/(9*df) + normalQuantile_core(p) * Math.sqrt(2/(9*df)), 3);
  if (x < 0.01) x = 0.01;
  for (var i = 0; i < 20; i++) {
    var cdf = chi2CDF_core(x, df);
    var pdf = Math.exp((df/2-1)*Math.log(x/2) - x/2 - lnGamma_core(df/2) - Math.log(2));
    if (pdf < 1e-15) break;
    var dx = (cdf - p) / pdf;
    x = Math.max(1e-10, x - dx);
    if (Math.abs(dx) < 1e-10) break;
  }
  return x;
}

/** Two-sided p-value from t statistic and df */
function tPvalue(t, df) {
  var p = tCDF(Math.abs(t), df);
  return 2 * (1 - p);
}

/** Weighted mean */
function weightedMean(vals, weights) {
  var sumW = 0, sumWY = 0;
  for (var i = 0; i < vals.length; i++) {
    sumW += weights[i];
    sumWY += weights[i] * vals[i];
  }
  return sumWY / sumW;
}

/** Fixed-effect meta-analysis (inverse variance) */
function fixedEffectMA(y, se) {
  var w = se.map(function(s) { return 1 / (s * s); });
  var mu = weightedMean(y, w);
  var sumW = w.reduce(function(a,b) { return a+b; }, 0);
  var seMu = Math.sqrt(1 / sumW);
  return { mu: mu, se: seMu, w: w };
}

/** REML tau2 estimator (Fisher scoring) */
function remlTau2(y, se) {
  var k = y.length;
  var vi = se.map(function(s) { return s * s; });
  // DL initial estimate
  var w = vi.map(function(v) { return 1/v; });
  var sumW = w.reduce(function(a,b) { return a+b; }, 0);
  var theta0 = w.reduce(function(a,b,i) { return a + b*y[i]; }, 0) / sumW;
  var Q = w.reduce(function(a,b,i) { return a + b * Math.pow(y[i]-theta0, 2); }, 0);
  var sumW2 = w.reduce(function(a,ww) { return a + ww*ww; }, 0);
  var C = sumW - sumW2/sumW;
  var tau2 = Math.max(0, (Q - (k-1)) / C);
  // Fisher scoring iterations
  for (var iter = 0; iter < 100; iter++) {
    var ws = vi.map(function(v) { return 1/(v + tau2); });
    var sW = ws.reduce(function(a,b) { return a+b; }, 0);
    var th = ws.reduce(function(a,b,i) { return a + b*y[i]; }, 0) / sW;
    var sW2 = ws.reduce(function(a,ww) { return a + ww*ww; }, 0);
    var sW3 = ws.reduce(function(a,ww) { return a + Math.pow(ww,3); }, 0);
    var sW2r2 = ws.reduce(function(a,ww,i) { return a + ww*ww*Math.pow(y[i]-th,2); }, 0);
    var score = -0.5*sW + 0.5*sW2/sW + 0.5*sW2r2;
    var info = 0.5*(sW2 - 2*sW3/sW + sW2*sW2/(sW*sW));
    if (info < 1e-15) break;
    var tau2New = Math.max(0, tau2 + score/info);
    if (Math.abs(tau2New - tau2) < 1e-10) { tau2 = tau2New; break; }
    tau2 = tau2New;
  }
  return tau2;
}

/** Random-effects meta-analysis (REML + HKSJ CI + Prediction Interval) */
function randomEffectsMA(y, se) {
  var k = y.length;
  var vi = se.map(function(s) { return s * s; });
  var tau2 = remlTau2(y, se);
  var wStar = vi.map(function(v) { return 1/(v + tau2); });
  var sumWStar = wStar.reduce(function(a,b) { return a+b; }, 0);
  var muStar = wStar.reduce(function(a,b,i) { return a + b*y[i]; }, 0) / sumWStar;
  var seMuStar = Math.sqrt(1/sumWStar);
  // Cochran's Q from fixed-effect weights
  var w0 = vi.map(function(v) { return 1/v; });
  var sumW0 = w0.reduce(function(a,b) { return a+b; }, 0);
  var mu0 = w0.reduce(function(a,b,i) { return a + b*y[i]; }, 0) / sumW0;
  var Q = w0.reduce(function(a,b,i) { return a + b * Math.pow(y[i]-mu0, 2); }, 0);
  var I2 = Q > 0 ? Math.max(0, (Q - (k-1)) / Q) : 0;
  // HKSJ CI: t_{k-1}, with floor correction
  var Qs = wStar.reduce(function(a,b,i) { return a + b * Math.pow(y[i]-muStar, 2); }, 0);
  var hksjVar = Qs / ((k-1) * sumWStar);
  var waldVar = 1 / sumWStar;
  hksjVar = Math.max(hksjVar, waldVar); // floor: prevent HKSJ narrowing below Wald when Q* < k-1
  var seHKSJ = Math.sqrt(hksjVar);
  var tcrit = Math.abs(tQuantile_core(0.025, k - 1));
  var ci_hksj = [muStar - tcrit * seHKSJ, muStar + tcrit * seHKSJ];
  // Wald CI (z-based) — kept for comparison
  var ci_wald = [muStar - 1.959964 * seMuStar, muStar + 1.959964 * seMuStar];
  // Prediction interval (t_{k-2}, undefined for k<3)
  var pi = [NaN, NaN];
  if (k >= 3) {
    var tcritPI = Math.abs(tQuantile_core(0.025, k - 2));
    var piSe = Math.sqrt(tau2 + seMuStar * seMuStar);
    pi = [muStar - tcritPI * piSe, muStar + tcritPI * piSe];
  }
  // Q-profile CI for I^2 (Viechtbauer 2007)
  var I2_lower = 0, I2_upper = 100;
  if (k >= 3) {
    var Q_upper = chi2Quantile_core(0.025, k-1);
    var Q_lower = chi2Quantile_core(0.975, k-1);
    I2_lower = Math.max(0, 100 * (Q - Q_lower) / Q);
    I2_upper = Math.min(100, 100 * (Q - Q_upper) / Q);
    if (I2_upper < 0) I2_upper = 0;
  }
  return {
    mu: muStar, se: seMuStar, tau2: tau2, Q: Q, w: wStar, I2: I2,
    ci_hksj: ci_hksj, ci_wald: ci_wald, pi: pi, method: 'REML',
    I2_lower: I2_lower, I2_upper: I2_upper
  };
}

/** Kendall's tau-b */
function kendallTau(x, y) {
  var n = x.length;
  var concordant = 0, discordant = 0, tiedX = 0, tiedY = 0;
  for (var i = 0; i < n; i++) {
    for (var j = i + 1; j < n; j++) {
      var dx = x[i] - x[j];
      var dy = y[i] - y[j];
      if (dx * dy > 0) concordant++;
      else if (dx * dy < 0) discordant++;
      else {
        if (dx === 0) tiedX++;
        if (dy === 0) tiedY++;
      }
    }
  }
  var n0 = n * (n - 1) / 2;
  var denom = Math.sqrt((n0 - tiedX) * (n0 - tiedY));
  if (denom === 0) return { tau: 0, z: 0, p: 1 };
  var tau = (concordant - discordant) / denom;
  // Variance under H0
  var v0 = n * (n - 1) * (2 * n + 5) / 18;
  var z = (concordant - discordant) / Math.sqrt(v0);
  var p = 2 * (1 - normalCDF(Math.abs(z)));
  return { tau: tau, z: z, p: p };
}

/** Weighted least squares regression: y = a + b*x, weighted by w
 *  Returns { intercept, slope, seIntercept, seSlope, tIntercept, pIntercept, tSlope, pSlope, df }
 */
function wlsRegression(y, x, w) {
  var n = y.length;
  var sumW = 0, sumWX = 0, sumWY = 0, sumWX2 = 0, sumWXY = 0;
  for (var i = 0; i < n; i++) {
    sumW += w[i];
    sumWX += w[i] * x[i];
    sumWY += w[i] * y[i];
    sumWX2 += w[i] * x[i] * x[i];
    sumWXY += w[i] * x[i] * y[i];
  }
  var denom = sumW * sumWX2 - sumWX * sumWX;
  var b = (sumW * sumWXY - sumWX * sumWY) / denom;
  var a = (sumWY - b * sumWX) / sumW;
  // Residuals for sigma^2
  var ssr = 0;
  for (var i = 0; i < n; i++) {
    var r = y[i] - a - b * x[i];
    ssr += w[i] * r * r;
  }
  var df = n - 2;
  var sigma2 = ssr / df;
  var seA = Math.sqrt(sigma2 * sumWX2 / denom);
  var seB = Math.sqrt(sigma2 * sumW / denom);
  var tA = a / seA;
  var tB = b / seB;
  return {
    intercept: a, slope: b, seIntercept: seA, seSlope: seB,
    tIntercept: tA, tSlope: tB,
    pIntercept: tPvalue(tA, df), pSlope: tPvalue(tB, df), df: df
  };
}

function fmt(x, d) {
  if (x == null || isNaN(x)) return 'N/A';
  d = d != null ? d : 4;
  return Number(x).toFixed(d);
}

function fmtP(p) {
  if (p == null || isNaN(p)) return 'N/A';
  if (p < 0.001) return '< 0.001';
  return p.toFixed(4);
}

/* ═══════════════════════════════════════════════════════════════════════════
   GLOBAL STATE
   ═══════════════════════════════════════════════════════════════════════════ */


function runEgger(y, se, w) {
  var k = y.length;
  // Radial Egger: regress y_i/se_i on 1/se_i, weighted by 1/v_i
  var v = se.map(function(s) { return s * s; });
  var xVals = se.map(function(s) { return 1/s; });       // precision
  var yVals = y.map(function(yi,i) { return yi/se[i]; }); // standardised effect
  var wVals = v.map(function(vi) { return 1/vi; });
  var reg = wlsRegression(yVals, xVals, wVals);
  var lowPowerWarning = k < 10;
  return {
    intercept: reg.intercept, seIntercept: reg.seIntercept,
    slope: reg.slope, t: reg.tIntercept, p: reg.pIntercept, df: reg.df,
    lowPowerWarning: lowPowerWarning,
    method: 'radialEgger'
  };
}

/* ── 1b. Peters' test (for binary outcomes, regress on 1/n) ── */
function runPeters(y, se, ni) {
  var v = se.map(function(s) { return s * s; });
  var xVals = ni.map(function(n) { return 1/n; });
  var wVals = v.map(function(vi) { return 1/vi; });
  var reg = wlsRegression(y, xVals, wVals);
  return {
    intercept: reg.intercept, slope: reg.slope,
    seIntercept: reg.seIntercept,
    t: reg.tIntercept, p: reg.pIntercept, df: reg.df,
    method: 'Peters'
  };
}

/* ── 2. Begg's rank correlation (standardized residuals vs variance) ── */
function runBegg(y, v) {
  // Proper Begg-Mazumdar: correlate standardized residuals with variances
  var k = y.length;
  if (k < 3) return { tau: 0, z: 0, p: 1, n: k };
  // Compute FE pooled estimate
  var sumW = 0, sumWY = 0;
  for (var i = 0; i < k; i++) { var w = v[i] > 0 ? 1/v[i] : 0; sumW += w; sumWY += w * y[i]; }
  var thetaFE = sumW > 0 ? sumWY / sumW : 0;
  // Standardized residuals
  var resid = [];
  for (var i = 0; i < k; i++) resid[i] = (y[i] - thetaFE) / Math.sqrt(v[i]);
  return kendallTau(resid, v);
}

/* ── 3 & 4. Trim-and-fill ── */
function runTrimFill(y, se, estimator) {
  var k = y.length;
  // Use FE pooled as center
  var fe = fixedEffectMA(y, se);
  var center = fe.mu;

  // Sort by effect size
  var idx = [];
  for (var i = 0; i < k; i++) idx.push(i);
  idx.sort(function(a,b) { return y[a] - y[b]; });

  var sorted_y = idx.map(function(i) { return y[i]; });
  var sorted_se = idx.map(function(i) { return se[i]; });

  // Iterative trim-and-fill
  var k0 = 0;
  var maxIter = 20;

  for (var iter = 0; iter < maxIter; iter++) {
    // Re-estimate center from trimmed data
    var trim_y = [], trim_se = [];
    // If k0 > 0, trim k0 studies from the side with excess
    // Determine direction: if center is to the right of median, trim from right (and vice versa)
    var median_idx = Math.floor(sorted_y.length / 2);
    var median_y = sorted_y[median_idx];

    if (k0 > 0) {
      // Determine which side has excess — trim from right if positive asymmetry, left if negative
      var rightCount = 0, leftCount = 0;
      for (var i = 0; i < sorted_y.length; i++) {
        if (sorted_y[i] > center) rightCount++;
        else leftCount++;
      }
      if (rightCount > leftCount) {
        // Trim from right
        trim_y = sorted_y.slice(0, sorted_y.length - k0);
        trim_se = sorted_se.slice(0, sorted_se.length - k0);
      } else {
        // Trim from left
        trim_y = sorted_y.slice(k0);
        trim_se = sorted_se.slice(k0);
      }
    } else {
      trim_y = sorted_y.slice();
      trim_se = sorted_se.slice();
    }

    if (trim_y.length < 2) break;

    var trimFE = fixedEffectMA(trim_y, trim_se);
    center = trimFE.mu;

    // Compute deviations from center
    var deviations = sorted_y.map(function(yi) { return yi - center; });

    // Rank of absolute deviations
    var absDevs = deviations.map(function(d) { return Math.abs(d); });
    var rankIdx = [];
    for (var i = 0; i < absDevs.length; i++) rankIdx.push(i);
    rankIdx.sort(function(a,b) { return absDevs[a] - absDevs[b]; });
    var ranks = new Array(absDevs.length);
    for (var i = 0; i < rankIdx.length; i++) ranks[rankIdx[i]] = i + 1;

    // Count studies on the positive side of center (or use signs of deviations)
    // S = sum of ranks of studies on positive side
    // Determine the "right" side (side with potentially fewer studies = filled side)
    var Sn = 0;
    var positiveCount = 0;
    for (var i = 0; i < deviations.length; i++) {
      if (deviations[i] > 0) {
        Sn += ranks[i];
        positiveCount++;
      }
    }
    // Also compute for negative side
    var Sn_neg = 0;
    var negativeCount = 0;
    for (var i = 0; i < deviations.length; i++) {
      if (deviations[i] < 0) {
        Sn_neg += ranks[i];
        negativeCount++;
      }
    }

    // Use whichever side has fewer studies
    var S, nSide;
    if (positiveCount <= negativeCount) {
      S = Sn; nSide = positiveCount;
    } else {
      S = Sn_neg; nSide = negativeCount;
    }

    var n_total = sorted_y.length;
    var newK0;
    if (estimator === 'L0') {
      // L0 (Duval & Tweedie 2000): k0 = (4*S - n) / (2*n - 1)
      newK0 = Math.max(0, Math.round((4 * S - n_total) / (2 * n_total - 1)));
    } else {
      // R0: k0 = (4*S - n) / (2*n + 3) — more conservative
      newK0 = Math.max(0, Math.round((4 * S - n_total) / (2 * n_total + 3)));
    }

    if (newK0 === k0) break;
    k0 = newK0;
    if (k0 >= k) { k0 = k - 1; break; }
  }

  // Impute k0 mirror studies
  var imputed_y = sorted_y.slice();
  var imputed_se = sorted_se.slice();

  if (k0 > 0) {
    // Determine direction again
    var rightCount = 0;
    for (var i = 0; i < sorted_y.length; i++) {
      if (sorted_y[i] > center) rightCount++;
    }
    var fromRight = rightCount > (sorted_y.length - rightCount);
    for (var j = 0; j < k0; j++) {
      var srcIdx = fromRight ? (sorted_y.length - 1 - j) : j;
      if (srcIdx < 0 || srcIdx >= sorted_y.length) break;
      var mirrored = 2 * center - sorted_y[srcIdx];
      imputed_y.push(mirrored);
      imputed_se.push(sorted_se[srcIdx]);
    }
  }

  var adjFE = fixedEffectMA(imputed_y, imputed_se);
  var adjRE = randomEffectsMA(imputed_y, imputed_se);

  return {
    k0: k0, estimator: estimator,
    adjMuFE: adjFE.mu, adjSeFE: adjFE.se,
    adjMuRE: adjRE.mu, adjSeRE: adjRE.se,
    imputed_y: imputed_y, imputed_se: imputed_se,
    center: center
  };
}

/* ── 5. PET ── */
function runPET(y, se, v) {
  // y_i = beta0 + beta1 * se_i + e_i, weighted by 1/v_i
  var w = v.map(function(vi) { return 1 / vi; });
  var reg = wlsRegression(y, se, w);
  return {
    adjEstimate: reg.intercept, seAdj: reg.seIntercept,
    slope: reg.slope, seSlope: reg.seSlope,
    t: reg.tIntercept, p: reg.pIntercept, df: reg.df
  };
}

/* ── 6. PEESE ── */
function runPEESE(y, se, v) {
  // y_i = beta0 + beta1 * se_i^2 + e_i, weighted by 1/v_i
  var w = v.map(function(vi) { return 1 / vi; });
  var reg = wlsRegression(y, v, w); // x = v = se^2
  return {
    adjEstimate: reg.intercept, seAdj: reg.seIntercept,
    slope: reg.slope, seSlope: reg.seSlope,
    t: reg.tIntercept, p: reg.pIntercept, df: reg.df
  };
}

/* ── 7. PET-PEESE conditional ── */
function runPETPEESE(pet, peese) {
  // If PET intercept p < 0.10, use PEESE; else use PET
  var usePEESE = pet.p < 0.10;
  return {
    usePEESE: usePEESE,
    adjEstimate: usePEESE ? peese.adjEstimate : pet.adjEstimate,
    seAdj: usePEESE ? peese.seAdj : pet.seAdj,
    method: usePEESE ? 'PEESE' : 'PET',
    pet: pet, peese: peese
  };
}

/* ── 8. 3-Parameter Selection Model ── */
function run3PSM(y, se, v) {
  var k = y.length;
  // Two-sided p-values
  var pvals = [];
  for (var i = 0; i < k; i++) {
    pvals.push(2 * (1 - normalCDF(Math.abs(y[i] / se[i]))));
  }

  // Identify significant studies
  var sig = pvals.map(function(p) { return p < 0.05; });
  var nSig = sig.filter(Boolean).length;
  var nNonSig = k - nSig;

  // Initial RE estimate
  var re = randomEffectsMA(y, se);
  var mu = re.mu;
  var tau2 = re.tau2;

  // Optimize by grid search + refinement for delta (selection weight for non-significant)
  // Log-likelihood: sum_i [ log f(y_i|mu,tau2+v_i) + log w(p_i) ] - k*log(integral)
  function logLik(mu, tau2, delta) {
    var ll = 0;
    for (var i = 0; i < k; i++) {
      var totalVar = tau2 + v[i];
      var logf = -0.5 * Math.log(2 * Math.PI * totalVar) - 0.5 * Math.pow(y[i] - mu, 2) / totalVar;
      var logw = sig[i] ? 0 : Math.log(Math.max(delta, 1e-10));
      ll += logf + logw;
    }
    // Normalizing constant: integral of w(p) * f(y|mu,tau2,v) over y
    // For each study, the probability of being selected:
    // P(selected) = P(p<0.05|mu,tau2,v) + delta * P(p>=0.05|mu,tau2,v)
    for (var i = 0; i < k; i++) {
      var totalVar = tau2 + v[i];
      var totalSE = Math.sqrt(totalVar);
      // P(|y/se| > 1.96) = P(y > 1.96*se) + P(y < -1.96*se) under model
      var zHi = (1.96 * se[i] - mu) / totalSE;
      var zLo = (-1.96 * se[i] - mu) / totalSE;
      var pSig = 1 - normalCDF(zHi) + normalCDF(zLo);
      var pNonSig = 1 - pSig;
      var selectProb = pSig + delta * pNonSig;
      ll -= Math.log(Math.max(selectProb, 1e-10));
    }
    return ll;
  }

  // Grid search for delta from 0.01 to 1.0
  var bestLL = -Infinity, bestMu = mu, bestTau2 = tau2, bestDelta = 1;

  // Coarse grid
  for (var dg = 1; dg <= 100; dg++) {
    var delta = dg / 100;
    // For each delta, optimize mu and tau2 by simple gradient steps
    var mTry = mu, t2Try = tau2;
    for (var step = 0; step < 20; step++) {
      var ll0 = logLik(mTry, t2Try, delta);
      // Numerical gradients
      var eps = 0.001;
      var dmu = (logLik(mTry + eps, t2Try, delta) - ll0) / eps;
      var dt2 = (logLik(mTry, Math.max(0, t2Try + eps), delta) - ll0) / eps;
      mTry += 0.01 * dmu;
      t2Try = Math.max(0, t2Try + 0.005 * dt2);
    }
    var ll = logLik(mTry, t2Try, delta);
    if (ll > bestLL) {
      bestLL = ll; bestMu = mTry; bestTau2 = t2Try; bestDelta = delta;
    }
  }

  // Fine refinement around best delta
  for (var dg = Math.max(1, Math.round(bestDelta * 100) - 10);
       dg <= Math.min(100, Math.round(bestDelta * 100) + 10); dg++) {
    var delta = dg / 100;
    var mTry = bestMu, t2Try = bestTau2;
    for (var step = 0; step < 50; step++) {
      var ll0 = logLik(mTry, t2Try, delta);
      var eps = 0.0005;
      var dmu = (logLik(mTry + eps, t2Try, delta) - ll0) / eps;
      var dt2 = (logLik(mTry, Math.max(0, t2Try + eps), delta) - ll0) / eps;
      mTry += 0.005 * dmu;
      t2Try = Math.max(0, t2Try + 0.002 * dt2);
    }
    var ll = logLik(mTry, t2Try, delta);
    if (ll > bestLL) {
      bestLL = ll; bestMu = mTry; bestTau2 = t2Try; bestDelta = delta;
    }
  }

  // LR test vs model with delta=1
  var llNull = logLik(re.mu, re.tau2, 1.0);
  var LR = 2 * (bestLL - llNull);
  var pLR = LR > 0 ? (1 - normalCDF(Math.sqrt(LR))) : 1; // 50:50 mixture chi-sq

  return {
    adjMu: bestMu, tau2: bestTau2, delta: bestDelta,
    nSig: nSig, nNonSig: nNonSig,
    LR: LR, p: pLR
  };
}

export { randomEffectsMA, fixedEffectMA, remlTau2, runEgger, runPeters, runBegg, runTrimFill, runPET, runPEESE, runPETPEESE, run3PSM };
