"""
Selenium test suite for PubBias Suite v1.0
12 publication bias methods + 3 funnel plots.

Tests core statistics (via injected harness), UI interactions,
example dataset loading, full analysis workflow, funnel plots,
report generation, and export functions.
"""
import sys, io, os, unittest, time, math, json
if os.environ.get('PYTHONIOENCODING') is None and hasattr(sys.stdout, 'buffer'):
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    except Exception:
        pass
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

HTML = 'file:///' + os.path.abspath(r'C:\Models\PubBiasSuite\pub-bias-suite.html').replace('\\', '/')

# Inject standalone copies of pure-math functions onto window for testing.
INJECT_HARNESS = r"""
(function(){
  // ---- normalCDF (Abramowitz & Stegun via erf, same as in app) ----
  window._t_normalCDF = function(x) {
    if (!isFinite(x)) return x > 0 ? 1 : 0;
    var a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;
    var sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.SQRT2;
    var t=1.0/(1.0+p*x);
    var y=1.0-(((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);
    return 0.5*(1.0+sign*y);
  };
  // ---- normalQuantile ----
  window._t_normalQuantile = function(p) {
    if(p<=0)return -Infinity;if(p>=1)return Infinity;if(p===0.5)return 0;
    var a=[-3.969683028665376e+01,2.209460984245205e+02,-2.759285104469687e+02,1.383577518672690e+02,-3.066479806614716e+01,2.506628277459239e+00];
    var b=[-5.447609879822406e+01,1.615858368580409e+02,-1.556989798598866e+02,6.680131188771972e+01,-1.328068155288572e+01];
    var c=[-7.784894002430293e-03,-3.223964580411365e-01,-2.400758277161838e+00,-2.549732539343734e+00,4.374664141464968e+00,2.938163982698783e+00];
    var d=[7.784695709041462e-03,3.224671290700398e-01,2.445134137142996e+00,3.754408661907416e+00];
    var pLow=0.02425,pHigh=1-pLow;var q,r;
    if(p<pLow){q=Math.sqrt(-2*Math.log(p));return(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}
    else if(p<=pHigh){q=p-0.5;r=q*q;return(((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);}
    else{q=Math.sqrt(-2*Math.log(1-p));return-(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}
  };
  // ---- normalPDF ----
  window._t_normalPDF = function(x) { return Math.exp(-0.5*x*x)/Math.sqrt(2*Math.PI); };
  // ---- lnGamma ----
  window._t_lnGamma = function(x) {
    var g=7;var coef=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
    if(x<0.5){return Math.log(Math.PI/Math.sin(Math.PI*x))-window._t_lnGamma(1-x);}
    x-=1;var a=coef[0];var t=x+g+0.5;for(var i=1;i<coef.length;i++){a+=coef[i]/(x+i);}
    return 0.5*Math.log(2*Math.PI)+(x+0.5)*Math.log(t)-t+Math.log(a);
  };
  // ---- kendallTau ----
  window._t_kendallTau = function(x, y) {
    var n=x.length;var conc=0,disc=0,tX=0,tY=0;
    for(var i=0;i<n;i++)for(var j=i+1;j<n;j++){var dx=x[i]-x[j];var dy=y[i]-y[j];
    if(dx*dy>0)conc++;else if(dx*dy<0)disc++;else{if(dx===0)tX++;if(dy===0)tY++;}}
    var n0=n*(n-1)/2;var denom=Math.sqrt((n0-tX)*(n0-tY));
    if(denom===0)return{tau:0,z:0,p:1};
    var tau=(conc-disc)/denom;var v0=n*(n-1)*(2*n+5)/18;
    var z=(conc-disc)/Math.sqrt(v0);var p=2*(1-window._t_normalCDF(Math.abs(z)));
    return{tau:tau,z:z,p:p};
  };
  // ---- wlsRegression ----
  window._t_wlsRegression = function(y,x,w) {
    var n=y.length;var sW=0,sWX=0,sWY=0,sWX2=0,sWXY=0;
    for(var i=0;i<n;i++){sW+=w[i];sWX+=w[i]*x[i];sWY+=w[i]*y[i];sWX2+=w[i]*x[i]*x[i];sWXY+=w[i]*x[i]*y[i];}
    var denom=sW*sWX2-sWX*sWX;var b=(sW*sWXY-sWX*sWY)/denom;var a=(sWY-b*sWX)/sW;
    return {intercept:a,slope:b};
  };
  window._t_injected = true;
})();
"""


class TestPubBiasSuite(unittest.TestCase):
    """Comprehensive Selenium tests for PubBias Suite."""

    @classmethod
    def setUpClass(cls):
        opts = Options()
        opts.add_argument('--headless=new')
        opts.add_argument('--no-sandbox')
        opts.add_argument('--disable-gpu')
        opts.add_argument('--window-size=1400,900')
        cls.drv = webdriver.Chrome(options=opts)
        cls.drv.get(HTML)
        time.sleep(1.5)
        cls.drv.execute_script(INJECT_HARNESS)

    @classmethod
    def tearDownClass(cls):
        cls.drv.quit()

    def js(self, script):
        return self.drv.execute_script(script)

    def reload_app(self):
        self.drv.get(HTML)
        time.sleep(1)
        self.drv.execute_script(INJECT_HARNESS)

    def _load_bcg_and_run(self):
        """Helper: load BCG data and run full analysis"""
        self.reload_app()
        self.drv.find_element(By.ID, 'btnBCG').click()
        time.sleep(0.5)
        self.drv.find_element(By.ID, 'btnRunAll').click()
        time.sleep(2)

    # =================================================================
    # 1. PURE MATH: normalCDF
    # =================================================================

    def test_01_normalCDF_known(self):
        """normalCDF(0) = 0.5, normalCDF(1.96) ~ 0.975"""
        self.assertAlmostEqual(self.js("return window._t_normalCDF(0);"), 0.5, places=6)
        self.assertAlmostEqual(self.js("return window._t_normalCDF(1.96);"), 0.975, delta=0.002)
        self.assertAlmostEqual(self.js("return window._t_normalCDF(-1.96);"), 0.025, delta=0.002)

    def test_02_normalCDF_extreme(self):
        """Extreme values: CDF(-10) ~ 0, CDF(10) ~ 1"""
        self.assertAlmostEqual(self.js("return window._t_normalCDF(-10);"), 0.0, places=5)
        self.assertAlmostEqual(self.js("return window._t_normalCDF(10);"), 1.0, places=5)

    # =================================================================
    # 2. PURE MATH: normalQuantile
    # =================================================================

    def test_03_normalQuantile_inverse(self):
        """normalQuantile(0.975) ~ 1.96, normalQuantile(0.5) = 0"""
        q = self.js("return window._t_normalQuantile(0.975);")
        self.assertAlmostEqual(q, 1.96, delta=0.01)
        self.assertAlmostEqual(self.js("return window._t_normalQuantile(0.5);"), 0.0, places=5)

    def test_04_normalQuantile_roundtrip(self):
        """CDF(Quantile(p)) = p for various p"""
        for p in [0.05, 0.25, 0.5, 0.75, 0.95]:
            result = self.js(f"var q=window._t_normalQuantile({p});return window._t_normalCDF(q);")
            self.assertAlmostEqual(result, p, delta=0.003, msg=f"Roundtrip fail at p={p}")

    # =================================================================
    # 3. PURE MATH: normalPDF
    # =================================================================

    def test_05_normalPDF_peak(self):
        """PDF at 0 = 1/sqrt(2*pi) ~ 0.3989"""
        pdf0 = self.js("return window._t_normalPDF(0);")
        self.assertAlmostEqual(pdf0, 1 / math.sqrt(2 * math.pi), places=5)

    def test_06_normalPDF_symmetry(self):
        """PDF symmetric: f(x) = f(-x)"""
        pos = self.js("return window._t_normalPDF(1.5);")
        neg = self.js("return window._t_normalPDF(-1.5);")
        self.assertAlmostEqual(pos, neg, places=10)

    # =================================================================
    # 4. PURE MATH: lnGamma
    # =================================================================

    def test_07_lnGamma_known(self):
        """lnGamma(1) = 0, lnGamma(5) = ln(24)"""
        self.assertAlmostEqual(self.js("return window._t_lnGamma(1);"), 0.0, places=5)
        self.assertAlmostEqual(self.js("return window._t_lnGamma(5);"), math.log(24), delta=0.001)
        # lnGamma(0.5) = ln(sqrt(pi)) ~ 0.5724
        self.assertAlmostEqual(self.js("return window._t_lnGamma(0.5);"), math.lgamma(0.5), delta=0.001)

    # =================================================================
    # 5. PURE MATH: Kendall's tau
    # =================================================================

    def test_08_kendall_perfect_concordance(self):
        """Perfect positive concordance: tau = 1"""
        result = self.js("""
            return window._t_kendallTau([1,2,3,4,5], [10,20,30,40,50]);
        """)
        self.assertAlmostEqual(result['tau'], 1.0, places=5)

    def test_09_kendall_perfect_discordance(self):
        """Perfect negative concordance: tau = -1"""
        result = self.js("""
            return window._t_kendallTau([1,2,3,4,5], [50,40,30,20,10]);
        """)
        self.assertAlmostEqual(result['tau'], -1.0, places=5)

    def test_10_kendall_no_correlation(self):
        """No clear correlation: |tau| < 1"""
        result = self.js("""
            return window._t_kendallTau([1,2,3,4,5], [3,1,5,2,4]);
        """)
        self.assertTrue(-1 < result['tau'] < 1)

    # =================================================================
    # 6. PURE MATH: WLS regression
    # =================================================================

    def test_11_wls_regression_basic(self):
        """WLS recovers known slope and intercept"""
        result = self.js("""
            var y = [2, 4, 6, 8, 10];
            var x = [1, 2, 3, 4, 5];
            var w = [1, 1, 1, 1, 1];
            return window._t_wlsRegression(y, x, w);
        """)
        self.assertAlmostEqual(result['slope'], 2.0, places=5)
        self.assertAlmostEqual(result['intercept'], 0.0, places=5)

    # =================================================================
    # 7. EXAMPLE DATA LOADING
    # =================================================================

    def test_12_load_BCG_dataset(self):
        """Load BCG data: 13 studies, logRR effect type"""
        self.reload_app()
        self.drv.find_element(By.ID, 'btnBCG').click()
        time.sleep(0.5)
        count = self.js("return STATE.studies.length;")
        self.assertEqual(count, 13)
        eff = self.js("return STATE.effectType;")
        self.assertEqual(eff, 'logRR')

    def test_13_load_antidep_dataset(self):
        """Load Antidepressants data: 47 studies, SMD effect type"""
        self.reload_app()
        self.drv.find_element(By.ID, 'btnAntidep').click()
        time.sleep(0.5)
        count = self.js("return STATE.studies.length;")
        self.assertEqual(count, 47)
        eff = self.js("return STATE.effectType;")
        self.assertEqual(eff, 'SMD')

    # =================================================================
    # 8. FULL ANALYSIS WORKFLOW
    # =================================================================

    def test_14_run_analysis_BCG(self):
        """Run all 12 tests on BCG data, results stored in STATE"""
        self._load_bcg_and_run()
        has_results = self.js("return STATE.results !== null;")
        self.assertTrue(has_results, "STATE.results should be populated")

    def test_15_all_12_methods_present(self):
        """All 12 method results present in STATE.results"""
        self._load_bcg_and_run()
        keys = self.js("""
            var r = STATE.results;
            return {
                hasEgger: r.egger != null,
                hasBegg: r.begg != null,
                hasTFL0: r.trimfillL0 != null,
                hasTFR0: r.trimfillR0 != null,
                hasPET: r.pet != null,
                hasPEESE: r.peese != null,
                hasPP: r.petpeese != null,
                has3PSM: r.threepsm != null,
                hasPcurve: r.pcurve != null,
                hasPuniform: r.puniform != null,
                hasWAAP: r.waapwls != null,
                hasLimit: r.limit != null
            };
        """)
        for method, present in keys.items():
            self.assertTrue(present, f"{method} should be present in results")

    # =================================================================
    # 9. EGGER'S TEST
    # =================================================================

    def test_16_egger_has_numeric_results(self):
        """Egger test returns finite intercept, t-stat, and p-value"""
        self._load_bcg_and_run()
        result = self.js("""
            var e = STATE.results.egger;
            return {
                intercept: e.intercept,
                t: e.t,
                p: e.p,
                df: e.df
            };
        """)
        self.assertTrue(math.isfinite(result['intercept']))
        self.assertTrue(math.isfinite(result['t']))
        self.assertTrue(0 <= result['p'] <= 1)
        self.assertEqual(result['df'], 11)  # k=13, df = k-2

    # =================================================================
    # 10. BEGG'S TEST
    # =================================================================

    def test_17_begg_has_numeric_results(self):
        """Begg test returns tau and p-value"""
        self._load_bcg_and_run()
        result = self.js("""
            var b = STATE.results.begg;
            return {tau: b.tau, z: b.z, p: b.p};
        """)
        self.assertTrue(-1 <= result['tau'] <= 1)
        self.assertTrue(0 <= result['p'] <= 1)

    # =================================================================
    # 11. TRIM-AND-FILL
    # =================================================================

    def test_18_trimfill_L0_and_R0(self):
        """Trim-and-fill returns non-negative k0, adjusted estimates"""
        self._load_bcg_and_run()
        result = self.js("""
            var l0 = STATE.results.trimfillL0;
            var r0 = STATE.results.trimfillR0;
            return {
                k0_L0: l0.k0, adjMuRE_L0: l0.adjMuRE,
                k0_R0: r0.k0, adjMuRE_R0: r0.adjMuRE
            };
        """)
        self.assertGreaterEqual(result['k0_L0'], 0)
        self.assertGreaterEqual(result['k0_R0'], 0)
        self.assertTrue(math.isfinite(result['adjMuRE_L0']))
        self.assertTrue(math.isfinite(result['adjMuRE_R0']))

    # =================================================================
    # 12. PET / PEESE / PET-PEESE
    # =================================================================

    def test_19_pet_peese_results(self):
        """PET, PEESE, PET-PEESE all return adjusted estimates"""
        self._load_bcg_and_run()
        result = self.js("""
            var r = STATE.results;
            return {
                petEst: r.pet.adjEstimate,
                peeseEst: r.peese.adjEstimate,
                ppEst: r.petpeese.adjEstimate,
                ppMethod: r.petpeese.method
            };
        """)
        self.assertTrue(math.isfinite(result['petEst']))
        self.assertTrue(math.isfinite(result['peeseEst']))
        self.assertTrue(math.isfinite(result['ppEst']))
        self.assertIn(result['ppMethod'], ['PET', 'PEESE'])

    # =================================================================
    # 13. 3PSM
    # =================================================================

    def test_20_3psm_results(self):
        """3PSM returns delta (selection weight), adjusted mu"""
        self._load_bcg_and_run()
        result = self.js("""
            var t = STATE.results.threepsm;
            return {delta: t.delta, adjMu: t.adjMu, nSig: t.nSig, nNonSig: t.nNonSig};
        """)
        self.assertTrue(0 < result['delta'] <= 1, f"delta={result['delta']}")
        self.assertTrue(math.isfinite(result['adjMu']))
        self.assertEqual(result['nSig'] + result['nNonSig'], 13)

    # =================================================================
    # 14. P-CURVE
    # =================================================================

    def test_21_pcurve_results(self):
        """P-curve returns bins, Stouffer Z, and interpretation"""
        self._load_bcg_and_run()
        result = self.js("""
            var pc = STATE.results.pcurve;
            return {
                nSig: pc.nSig,
                insufficient: pc.insufficient,
                interp: pc.interpretation,
                bins: pc.bins
            };
        """)
        # BCG has some significant studies
        self.assertIsNotNone(result['interp'])
        self.assertTrue(len(result['interp']) > 0)

    # =================================================================
    # 15. P-UNIFORM*
    # =================================================================

    def test_22_puniform_results(self):
        """P-uniform* returns adjusted estimate or insufficient flag"""
        self._load_bcg_and_run()
        result = self.js("""
            var pu = STATE.results.puniform;
            return {insufficient: pu.insufficient, adjMu: pu.adjMu, nSig: pu.nSig};
        """)
        if not result['insufficient']:
            self.assertTrue(math.isfinite(result['adjMu']))
        self.assertGreaterEqual(result['nSig'], 0)

    # =================================================================
    # 16. WAAP-WLS
    # =================================================================

    def test_23_waapwls_results(self):
        """WAAP-WLS returns adjusted estimate and method tag"""
        self._load_bcg_and_run()
        result = self.js("""
            var w = STATE.results.waapwls;
            return {adjEst: w.adjEstimate, method: w.method, nAdequate: w.nAdequate};
        """)
        self.assertTrue(math.isfinite(result['adjEst']))
        self.assertIn(result['method'], ['WAAP', 'WLS (fallback)'])
        self.assertGreaterEqual(result['nAdequate'], 0)

    # =================================================================
    # 17. LIMIT META-ANALYSIS
    # =================================================================

    def test_24_limit_ma_results(self):
        """Limit MA returns adjusted estimate"""
        self._load_bcg_and_run()
        result = self.js("""
            var l = STATE.results.limit;
            return {adjEst: l.adjEstimate, slope: l.slope, p: l.p};
        """)
        self.assertTrue(math.isfinite(result['adjEst']))
        self.assertTrue(math.isfinite(result['slope']))
        self.assertTrue(0 <= result['p'] <= 1)

    # =================================================================
    # 18. RANDOM-EFFECTS MA BASELINE
    # =================================================================

    def test_25_re_ma_baseline(self):
        """Random-effects baseline: pooled mu, tau2, I2 present"""
        self._load_bcg_and_run()
        result = self.js("""
            var re = STATE.results.re;
            return {mu: re.mu, se: re.se, tau2: re.tau2, I2: re.I2, Q: re.Q};
        """)
        self.assertTrue(math.isfinite(result['mu']))
        self.assertGreater(result['se'], 0)
        self.assertGreaterEqual(result['tau2'], 0)
        self.assertTrue(0 <= result['I2'] <= 1)

    # =================================================================
    # 19. TAB SWITCHING
    # =================================================================

    def test_26_tab_switching(self):
        """All tab panels activate correctly"""
        self.reload_app()
        tabs = self.drv.find_elements(By.CSS_SELECTOR, '[role="tab"]')
        for tab in tabs:
            panel_id = tab.get_attribute('aria-controls')
            tab.click()
            time.sleep(0.2)
            is_active = self.js(f"return document.getElementById('{panel_id}').classList.contains('active');")
            self.assertTrue(is_active, f"Panel {panel_id} should be active")

    # =================================================================
    # 20. DARK MODE
    # =================================================================

    def test_27_dark_mode_toggle(self):
        """Dark mode toggles data-theme attribute"""
        self.reload_app()
        initial = self.js("return document.documentElement.getAttribute('data-theme');")
        self.drv.find_element(By.ID, 'btnDarkMode').click()
        time.sleep(0.3)
        toggled = self.js("return document.documentElement.getAttribute('data-theme');")
        self.assertNotEqual(initial, toggled)

    # =================================================================
    # 21. FUNNEL PLOT RENDERING
    # =================================================================

    def test_28_funnel_plot_standard(self):
        """Standard funnel plot renders SVG after analysis"""
        self._load_bcg_and_run()
        # Switch to funnel tab
        self.drv.find_element(By.ID, 'tab-funnel').click()
        time.sleep(0.5)
        svg_html = self.drv.find_element(By.ID, 'funnelArea').get_attribute('innerHTML')
        self.assertIn('<svg', svg_html.lower(), "Should contain SVG")

    def test_29_funnel_plot_contour(self):
        """Contour-enhanced funnel plot renders"""
        self._load_bcg_and_run()
        self.drv.find_element(By.ID, 'tab-funnel').click()
        time.sleep(0.3)
        # Click contour button
        contour_btn = self.drv.find_element(By.CSS_SELECTOR, '[data-funnel="contour"]')
        contour_btn.click()
        time.sleep(0.5)
        svg_html = self.drv.find_element(By.ID, 'funnelArea').get_attribute('innerHTML')
        self.assertIn('<svg', svg_html.lower())

    def test_30_funnel_plot_sunset(self):
        """Sunset funnel plot renders"""
        self._load_bcg_and_run()
        self.drv.find_element(By.ID, 'tab-funnel').click()
        time.sleep(0.3)
        sunset_btn = self.drv.find_element(By.CSS_SELECTOR, '[data-funnel="sunset"]')
        sunset_btn.click()
        time.sleep(0.5)
        svg_html = self.drv.find_element(By.ID, 'funnelArea').get_attribute('innerHTML')
        self.assertIn('<svg', svg_html.lower())

    # =================================================================
    # 22. REPORT GENERATION
    # =================================================================

    def test_31_report_methods_text(self):
        """Report tab shows publication bias methods description"""
        self._load_bcg_and_run()
        self.drv.find_element(By.ID, 'tab-report').click()
        time.sleep(0.3)
        methods_text = self.drv.find_element(By.ID, 'methodsText').text
        self.assertIn('publication bias', methods_text.lower())
        self.assertIn('Egger', methods_text)

    def test_32_report_R_code(self):
        """Report tab shows R code with metafor commands"""
        self._load_bcg_and_run()
        self.drv.find_element(By.ID, 'tab-report').click()
        time.sleep(0.3)
        r_code = self.drv.find_element(By.ID, 'rCode').text
        self.assertIn('library(metafor)', r_code)
        self.assertIn('regtest', r_code)
        self.assertIn('trimfill', r_code)

    # =================================================================
    # 23. TRAFFIC LIGHT SUMMARY
    # =================================================================

    def test_33_traffic_light_summary(self):
        """Traffic light summary generated with method names"""
        self._load_bcg_and_run()
        self.drv.find_element(By.ID, 'tab-sensitivity').click()
        time.sleep(0.3)
        traffic = self.drv.find_element(By.ID, 'trafficSummary').text
        self.assertIn('Egger', traffic)

    # =================================================================
    # 24. VERDICT TEXT
    # =================================================================

    def test_34_verdict_text(self):
        """Verdict text contains assessment words"""
        self._load_bcg_and_run()
        self.drv.find_element(By.ID, 'tab-sensitivity').click()
        time.sleep(0.3)
        verdict = self.drv.find_element(By.ID, 'verdictText').text
        self.assertTrue(len(verdict) > 20, "Verdict should be a meaningful sentence")
        # Should mention the pooled estimate or bias
        lv = verdict.lower()
        self.assertTrue('bias' in lv or 'estimate' in lv or 'evidence' in lv)

    # =================================================================
    # 25. CSV PASTE
    # =================================================================

    def test_35_csv_paste_parsing(self):
        """CSV paste parses custom data into STATE"""
        self.reload_app()
        csv_data = "Study,y,se\nA,0.5,0.1\nB,-0.3,0.2\nC,0.8,0.15\nD,-0.1,0.12"
        self.js("document.getElementById('csvInput').value = arguments[0];", csv_data)
        self.drv.find_element(By.ID, 'btnParseCsv').click()
        time.sleep(0.5)
        count = self.js("return STATE.studies.length;")
        self.assertEqual(count, 4)

    # =================================================================
    # 26. ADD / DELETE ROWS
    # =================================================================

    def test_36_add_row(self):
        """Add row increases study count"""
        self.reload_app()
        before = self.js("return STATE.studies.length;")
        self.drv.find_element(By.ID, 'btnAddRow').click()
        time.sleep(0.3)
        after = self.js("return STATE.studies.length;")
        self.assertEqual(after, before + 1)

    def test_37_delete_last_row(self):
        """Delete last row decreases study count"""
        self.reload_app()
        before = self.js("return STATE.studies.length;")
        self.drv.find_element(By.ID, 'btnDeleteLast').click()
        time.sleep(0.3)
        after = self.js("return STATE.studies.length;")
        self.assertEqual(after, before - 1)

    # =================================================================
    # 27. CLEAR ALL DATA
    # =================================================================

    def test_38_clear_data(self):
        """Clear button empties all studies"""
        self.reload_app()
        self.drv.find_element(By.ID, 'btnBCG').click()
        time.sleep(0.3)
        self.assertEqual(self.js("return STATE.studies.length;"), 13)
        self.drv.find_element(By.ID, 'btnClear').click()
        time.sleep(0.3)
        self.assertEqual(self.js("return STATE.studies.length;"), 0)

    # =================================================================
    # 28. MINIMUM STUDY VALIDATION
    # =================================================================

    def test_39_minimum_3_studies_required(self):
        """Running analysis with <3 studies shows alert"""
        self.reload_app()
        self.drv.find_element(By.ID, 'btnClear').click()
        time.sleep(0.3)
        # Add only 2 studies
        self.js("""
            STATE.studies = [{name:'A', y:0.5, se:0.1}, {name:'B', y:0.3, se:0.2}];
        """)
        # btnRunAll should not populate results (alert blocks, but in headless may not)
        # We just verify STATE.results stays null
        results_before = self.js("return STATE.results;")
        # Try to run (will attempt alert in headless)
        try:
            self.drv.find_element(By.ID, 'btnRunAll').click()
            time.sleep(0.5)
            # Accept alert if present
            try:
                self.drv.switch_to.alert.accept()
            except Exception:
                pass
        except Exception:
            pass
        # Results should still be null
        results_after = self.js("return STATE.results;")
        self.assertIsNone(results_after)

    # =================================================================
    # 29. ANTIDEPRESSANT FULL ANALYSIS
    # =================================================================

    def test_40_antidep_full_analysis(self):
        """Full analysis on 47-study antidepressant dataset"""
        self.reload_app()
        self.drv.find_element(By.ID, 'btnAntidep').click()
        time.sleep(0.5)
        self.drv.find_element(By.ID, 'btnRunAll').click()
        time.sleep(3)
        has_results = self.js("return STATE.results !== null;")
        self.assertTrue(has_results)
        k = self.js("return STATE.results.k;")
        self.assertEqual(k, 47)

    # =================================================================
    # 30. PAGE INITIAL STATE
    # =================================================================

    def test_41_initial_page_title(self):
        """Page title contains PubBias"""
        self.reload_app()
        title = self.drv.title
        self.assertIn('PubBias', title)

    def test_42_study_count_badge(self):
        """Study count badge updates after loading data"""
        self.reload_app()
        self.drv.find_element(By.ID, 'btnBCG').click()
        time.sleep(0.5)
        badge = self.drv.find_element(By.ID, 'studyCountBadge').text
        self.assertIn('13', badge)

    # =================================================================
    # 31. COMPARISON CHART
    # =================================================================

    def test_43_comparison_chart_rendered(self):
        """Comparison chart has SVG after analysis"""
        self._load_bcg_and_run()
        self.drv.find_element(By.ID, 'tab-sensitivity').click()
        time.sleep(0.3)
        chart_html = self.drv.find_element(By.ID, 'comparisonChart').get_attribute('innerHTML')
        self.assertIn('<svg', chart_html.lower())


if __name__ == '__main__':
    unittest.main(verbosity=2)
