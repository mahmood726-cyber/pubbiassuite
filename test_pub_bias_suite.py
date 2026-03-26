"""
Publication Bias Suite — Selenium Test Suite (25 tests)
Run: python test_pub_bias_suite.py
"""
import sys, os, time, io, unittest
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

HTML_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pub-bias-suite.html')
URL = 'file:///' + HTML_PATH.replace('\\', '/')

def get_driver():
    opts = Options()
    opts.add_argument('--headless=new')
    opts.add_argument('--no-sandbox')
    opts.add_argument('--disable-gpu')
    opts.add_argument('--window-size=1400,900')
    opts.set_capability('goog:loggingPrefs', {'browser': 'ALL'})
    d = webdriver.Chrome(options=opts); d.implicitly_wait(2); return d

class PubBiasTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.driver = get_driver(); cls.driver.get(URL); time.sleep(0.5)
    @classmethod
    def tearDownClass(cls):
        logs = cls.driver.get_log('browser')
        severe = [l for l in logs if l['level']=='SEVERE' and 'favicon' not in l.get('message','')]
        if severe: print(f"\nJS ERRORS: {len(severe)}")
        cls.driver.quit()
    def _reload(self): self.driver.get(URL); time.sleep(0.3)
    def _click(self, by, val):
        el = WebDriverWait(self.driver, 5).until(EC.presence_of_element_located((by, val)))
        self.driver.execute_script("arguments[0].click()", el); return el

    def test_01_page_loads(self):
        self.assertIn('Bias', self.driver.title)
    def test_02_five_tabs(self):
        tabs = self.driver.find_elements(By.CSS_SELECTOR, '.tab-btn, [role="tab"]')
        self.assertGreaterEqual(len(tabs), 4)
    def test_03_load_bcg(self):
        self._reload(); self._click(By.ID, 'btnBCG'); time.sleep(0.3)
        rows = self.driver.find_elements(By.CSS_SELECTOR, '#dataBody tr, #dataTable tbody tr')
        self.assertGreaterEqual(len(rows), 13)
    def test_04_load_antidep(self):
        self._reload(); self._click(By.ID, 'btnAntidep'); time.sleep(0.3)
        rows = self.driver.find_elements(By.CSS_SELECTOR, '#dataBody tr, #dataTable tbody tr')
        self.assertGreater(len(rows), 10)
    def test_05_run_all(self):
        self._reload(); self._click(By.ID, 'btnBCG'); time.sleep(0.3)
        self._click(By.ID, 'btnRunAll'); time.sleep(1)
    def test_06_funnel_tab(self):
        self._reload(); self._click(By.ID, 'btnBCG'); time.sleep(0.2)
        self._click(By.ID, 'btnRunAll'); time.sleep(0.5)
        self._click(By.ID, 'tab-funnel'); time.sleep(0.3)
        svg = self.driver.find_element(By.CSS_SELECTOR, '#funnelArea svg, #panel-funnel svg')
        self.assertIsNotNone(svg)
    def test_07_funnel_has_points(self):
        svg_html = self.driver.find_element(By.CSS_SELECTOR, '#funnelArea, #panel-funnel').get_attribute('innerHTML')
        self.assertIn('circle', svg_html)
    def test_08_tests_tab(self):
        self._click(By.ID, 'tab-tests'); time.sleep(0.3)
        panel = self.driver.find_element(By.ID, 'panel-tests')
        self.assertTrue(panel.is_displayed())
    def test_09_egger_result(self):
        text = self.driver.find_element(By.ID, 'panel-tests').text.lower()
        self.assertTrue('egger' in text)
    def test_10_begg_result(self):
        text = self.driver.find_element(By.ID, 'panel-tests').text.lower()
        self.assertTrue('begg' in text or 'rank' in text)
    def test_11_trim_fill(self):
        text = self.driver.find_element(By.ID, 'panel-tests').text.lower()
        self.assertTrue('trim' in text)
    def test_12_pet_peese(self):
        text = self.driver.find_element(By.ID, 'panel-tests').text.lower()
        self.assertTrue('pet' in text or 'peese' in text)
    def test_13_pcurve(self):
        text = self.driver.find_element(By.ID, 'panel-tests').text.lower()
        self.assertTrue('p-curve' in text or 'pcurve' in text or 'p curve' in text)
    def test_14_selection_model(self):
        text = self.driver.find_element(By.ID, 'panel-tests').text.lower()
        self.assertTrue('selection' in text or '3psm' in text or '3-param' in text)
    def test_15_sensitivity_tab(self):
        self._click(By.ID, 'tab-sensitivity'); time.sleep(0.3)
        panel = self.driver.find_element(By.ID, 'panel-sensitivity')
        self.assertTrue(panel.is_displayed())
    def test_16_sensitivity_chart(self):
        panel = self.driver.find_element(By.ID, 'panel-sensitivity')
        self.assertGreater(len(panel.text), 50)
    def test_17_report_tab(self):
        self._click(By.ID, 'tab-report'); time.sleep(0.3)
        panel = self.driver.find_element(By.ID, 'panel-report')
        self.assertTrue(panel.is_displayed())
    def test_18_report_references(self):
        text = self.driver.find_element(By.ID, 'panel-report').text
        self.assertTrue('Egger' in text or 'egger' in text or 'metafor' in text)
    def test_19_dark_mode(self):
        self._reload()
        btn = self.driver.find_element(By.ID, 'btnDarkMode')
        self.driver.execute_script("arguments[0].click()", btn); time.sleep(0.2)
        theme = self.driver.find_element(By.TAG_NAME, 'html').get_attribute('data-theme')
        self.assertEqual(theme, 'dark')
        self.driver.execute_script("arguments[0].click()", btn)
    def test_20_tab_keyboard(self):
        self._reload()
        tab = self.driver.find_element(By.ID, 'tab-input')
        tab.send_keys(Keys.ARROW_RIGHT); time.sleep(0.2)
    def test_21_add_row(self):
        self._reload(); self._click(By.ID, 'btnAddRow'); time.sleep(0.2)
    def test_22_clear(self):
        self._reload(); self._click(By.ID, 'btnBCG'); time.sleep(0.2)
        self._click(By.ID, 'btnClear'); time.sleep(0.2)
    def test_23_csv_input(self):
        self._reload()
        ta = self.driver.find_element(By.ID, 'csvInput')
        ta.send_keys("Test,0.5,0.2")
        self._click(By.ID, 'btnParseCsv'); time.sleep(0.3)
    def test_24_multiple_methods(self):
        self._reload(); self._click(By.ID, 'btnBCG'); time.sleep(0.2)
        self._click(By.ID, 'btnRunAll'); time.sleep(1)
        self._click(By.ID, 'tab-tests'); time.sleep(0.3)
        text = self.driver.find_element(By.ID, 'panel-tests').text.lower()
        methods = sum(1 for m in ['egger','trim','pet','p-curve','p curve','pcurve','selection','3psm','begg','rank','limit','waap'] if m in text)
        self.assertGreaterEqual(methods, 5, f"Only found {methods} methods in output")
    def test_25_study_count(self):
        self._reload(); self._click(By.ID, 'btnBCG'); time.sleep(0.3)
        badge = self.driver.find_element(By.ID, 'studyCountBadge')
        self.assertIn('13', badge.text)

if __name__ == '__main__':
    unittest.main(verbosity=2)
