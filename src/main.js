import '@material/web/button/filled-button.js';
import '@material/web/button/filled-tonal-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import '@material/web/chips/assist-chip.js';
import '@material/web/dialog/dialog.js';
import '@material/web/divider/divider.js';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/progress/circular-progress.js';
import '@material/web/progress/linear-progress.js';
import '@material/web/ripple/ripple.js';
import '@material/web/tabs/primary-tab.js';
import '@material/web/tabs/tabs.js';
import './styles.css';
import { parseEbmudCsv } from './ebmud-csv.js';
import { analyzeWaterUse } from './water-analysis.js';
import { renderBrowserReport } from './browser-report.js';

const MAX_CSV_BYTES = 5 * 1024 * 1024;
const MAX_CSV_ROWS = 5000;

const sampleModes = {
  normal: {
    label: 'Steady household use',
    title: 'Your baseline looks explainable.',
    metric: '148 gallons/day',
    helper: 'Example pattern: steady indoor use, mild garden lift, and no obvious continuous-use clue.',
    bars: [48, 50, 55, 52, 57, 60, 62, 59, 54, 51, 49, 48],
    insight: 'Good first check: compare winter/spring baseline before judging summer watering.'
  },
  irrigation: {
    label: 'Irrigation season',
    title: 'Pattern suggests outdoor watering is driving the lift.',
    metric: '236 gallons/day',
    helper: 'Example pattern: summer and fall lift rise far above indoor baseline, then cool back down.',
    bars: [45, 47, 54, 67, 74, 88, 96, 94, 84, 70, 55, 47],
    insight: 'Best next move: audit controller zones and leaks before ripping out plants.'
  },
  leak: {
    label: 'Possible leak clue',
    title: 'A rising baseline is worth a simple fixture check.',
    metric: '192 gallons/day',
    helper: 'Example pattern: winter usage stays higher than expected, which can point to fixtures or toilets.',
    bars: [62, 64, 66, 69, 70, 76, 78, 77, 75, 73, 71, 70],
    insight: 'Not a diagnosis: it is a pattern worth checking with the meter and toilet dye tests.'
  }
};


const ebmudResources = [
  { icon: 'home', title: 'Customers hub', href: 'https://www.ebmud.com/customers', text: 'Start with official customer topics, account help, conservation, alerts, water quality, and assistance.' },
  { icon: 'account_circle', title: 'Your account', href: 'https://www.ebmud.com/customers/account', text: 'Official account access, setup, paperless billing, alert subscriptions, and My Water Report entry points.' },
  { icon: 'query_stats', title: 'My Water Report', href: 'https://www.ebmud.com/water/conservation-and-rebates/my-water-report-program', text: 'EBMUD guidance for Track Usage, high-use alerts, leak alerts, and reading gallons-per-day charts.' },
  { icon: 'receipt_long', title: 'Billing questions', href: 'https://www.ebmud.com/customers/billing-questions', text: 'Use EBMUD directly for bill interpretation, payment questions, rates, extensions, and account updates.' },
  { icon: 'plumbing', title: 'Leaks and high bills', href: 'https://www.ebmud.com/customers/billing-questions/leaks-and-high-bills', text: 'Official leak and high-bill guidance when Mud Buddy shows a pattern worth checking.' },
  { icon: 'water_drop', title: 'Conservation and rebates', href: 'https://www.ebmud.com/water/conservation-and-rebates', text: 'Official conservation services, rebate programs, WaterSmart Center resources, and efficiency help.' },
  { icon: 'yard', title: 'WaterSmart gardener', href: 'https://www.ebmud.com/water/conservation-and-rebates/watersmart-gardener', text: 'Landscape planning, water-wise plants, irrigation tips, mulch, garden resources, and rebate ideas.' },
  { icon: 'warning', title: 'Alerts and outages', href: 'https://www.ebmud.com/customers/alerts', text: 'Official place for outage, construction, service-alert, and water-quality alert information.' },
  { icon: 'science', title: 'Water quality', href: 'https://www.ebmud.com/water/about-your-water/water-quality', text: 'Official water-quality reports, FAQs, data, treatment, lead, PFAS, and safety information.' },
  { icon: 'volunteer_activism', title: 'Customer assistance', href: 'https://www.ebmud.com/customers/customer-assistance-program', text: 'Official Customer Assistance Program information for qualified bill support.' },
  { icon: 'support_agent', title: 'Contact / emergency', href: 'https://www.ebmud.com/contact-us', text: 'For urgent, billing, pressure, outage, water-quality, account, or emergency issues, go to EBMUD.' }
];

const resourceCards = ebmudResources.map((item) => `
  <a class="resource-card material-card" href="${item.href}" target="_blank" rel="noreferrer">
    <md-ripple></md-ripple>
    <span class="icon-glyph" aria-hidden="true" data-icon="${item.icon}"></span>
    <span>${item.title}</span>
    <p>${item.text}</p>
  </a>
`).join('');

class MudBuddyApp extends HTMLElement {
  connectedCallback() {
    this.render();
    this.bind();
    this.updateMode('normal');
  }

  render() {
    this.innerHTML = `
      <header class="topbar">
        <a class="brand" href="#top" aria-label="Mud Buddy home">
          <span class="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 48 48" role="img" focusable="false">
              <path d="M24 5C17.2 13.1 11 21.4 11 29.1 11 37.2 16.7 43 24 43s13-5.8 13-13.9C37 21.4 30.8 13.1 24 5Z" />
              <path d="M18.3 31.2c1.2 3.4 3.7 5.2 7.4 5.2" />
            </svg>
          </span>
          <span><strong>Mud Buddy</strong><small>for EBMUD customers</small></span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#app">Upload</a>
          <a href="#how">Get CSV</a>
          <a href="#example">Sample</a>
          <a href="#mission">Mission</a>
        </nav>
        <md-filled-button id="topAnalyze">Upload my usage data</md-filled-button>
      </header>

      <main id="top">
        <section class="hero shell" id="app">
          <div class="hero-copy reveal">
            <h1>Upload your EBMUD usage data. Get beautiful analysis, recommendations, and more.</h1>
            <p class="lede">Mud Buddy turns your EBMUD CSV into a private, browser-local report that explains what changed, what likely drove the change, and what to check first around the house.</p>
            <div class="hero-actions">
              <md-filled-button id="heroAnalyze">Upload my usage data</md-filled-button>
              <md-filled-tonal-button id="heroSample">Try sample data</md-filled-tonal-button>
              <md-text-button href="#how">How to get the CSV</md-text-button>
            </div>
            <div class="trust-row" aria-label="Trust promises">
              <span><span class="icon-glyph" aria-hidden="true" data-icon="computer"></span>Runs in your browser</span>
              <span><span class="icon-glyph" aria-hidden="true" data-icon="cloud_off"></span>No server upload</span>
              <span><span class="icon-glyph" aria-hidden="true" data-icon="key_off"></span>No EBMUD password needed</span>
            </div>
            <p class="hero-note">Built for high bills, irrigation surprises, fixture checks, family changes, and smarter next steps.</p>
            <figure class="homeowner-scene">
              <img src="assets/hero-civic-water.webp" alt="Synthetic browser-local water report on a patio with a garden hose" />
              <figcaption>Designed for homeowners who want a clear read before they start guessing.</figcaption>
            </figure>
          </div>

          <div class="upload-panel reveal delay-1" aria-label="Browser-local CSV upload analyzer">
            <div class="material-card upload-card">
              <div class="card-toolbar">
                <span>Browser-local CSV analyzer</span>
                <md-icon-button aria-label="Open privacy boundary" id="openChecklist"><span class="icon-glyph" aria-hidden="true" data-icon="shield"></span></md-icon-button>
              </div>
              <md-divider></md-divider>
              <input id="csvInput" class="sr-only-file" type="file" accept=".csv,text/csv" />
              <button class="dropzone" id="dropzone" type="button">
                <span class="icon-glyph" aria-hidden="true" data-icon="upload_file"></span>
                <strong>Drop your EBMUD usage CSV here</strong>
                <span>or click to choose the billing usage export</span>
              </button>
              <div class="upload-actions">
                <md-filled-button id="chooseCsv">Upload my usage data</md-filled-button>
                <md-filled-tonal-button id="trySample">Try sample data</md-filled-tonal-button>
              </div>
              <div class="local-proof">
                <span class="icon-glyph" aria-hidden="true" data-icon="verified_user"></span>
                <p>Runs in this browser. Your CSV is not uploaded. Not affiliated with EBMUD.</p>
              </div>
              <md-linear-progress id="uploadProgress" value="0"></md-linear-progress>
              <p id="uploadStatus" class="upload-status" aria-live="polite">Waiting for your CSV. Nothing has been uploaded or stored.</p>
              <div class="upload-mini-steps">
                <article><strong>1</strong><span>Download CSV from EBMUD Track Usage.</span></article>
                <article><strong>2</strong><span>Upload it here for browser-local analysis.</span></article>
                <article><strong>3</strong><span>Review what changed and what to check first.</span></article>
              </div>
            </div>
          </div>
        </section>

        <section class="shell browser-result-section" id="browserReport" aria-live="polite"></section>

        <section class="river-band" id="how">
          <div class="shell split">
            <div>
              <h2>How to get your EBMUD CSV.</h2>
              <p>Log into EBMUD yourself, open Track Usage or My Water Report, and download the official billing usage CSV. Then come back here and upload it to Mud Buddy. The file is read in your browser, not sent to a Mud Buddy server.</p>
              <p class="official-line">Mud Buddy helps interpret your exported CSV; official account, billing, emergency, rebate, and conservation actions happen on EBMUD's site.</p>
            </div>
            <div class="workflow-panel material-card">
              <img class="workflow-art visual-asset" src="assets/hero-civic-water.webp" alt="Synthetic browser-local CSV analysis workspace" loading="lazy" />
              <img class="workflow-art visual-asset" src="assets/privacy-local-first.webp" alt="Synthetic privacy boundary showing a CSV staying local" loading="lazy" />
              <div class="steps">
                <article><span class="icon-glyph" aria-hidden="true" data-icon="login"></span><span>You log in</span><p>Mud Buddy never asks for your EBMUD username, password, MFA, cookies, or browser session material.</p></article>
                <article><span class="icon-glyph" aria-hidden="true" data-icon="download"></span><span>You download</span><p>Use EBMUD's official CSV export from the usage/report area.</p></article>
                <article><span class="icon-glyph" aria-hidden="true" data-icon="analytics"></span><span>You analyze</span><p>Upload the CSV here for local browser analysis and plain-English next checks.</p></article>
              </div>
            </div>
          </div>
        </section>

        <section class="shell sample-section" id="example">
          <div class="section-head">
            <h2>Try the example, then use your own file.</h2>
            <p>The sample report uses synthetic public-safe data. The live analyzer above is the homeowner path for your own downloaded EBMUD CSV.</p>
          </div>
          <div class="sample-layout">
            <div class="material-card product-card" aria-label="Interactive sample analysis preview">
              <div class="card-toolbar"><span>Synthetic pattern examples</span></div>
              <md-divider></md-divider>
              <md-tabs id="modeTabs" aria-label="Sample usage modes">
                <md-primary-tab active data-mode="normal">Steady</md-primary-tab>
                <md-primary-tab data-mode="irrigation">Irrigation</md-primary-tab>
                <md-primary-tab data-mode="leak">Leak clue</md-primary-tab>
              </md-tabs>
              <div class="mode-card" aria-live="polite">
                <div>
                  <p class="overline" id="modeLabel">Steady household use</p>
                  <h2 id="modeTitle">Your baseline looks explainable.</h2>
                  <p id="modeHelper"></p>
                </div>
                <div class="metric-pill"><strong id="modeMetric">148 gallons/day</strong><span>GPD = gallons/day</span></div>
              </div>
              <div class="chart" id="chart" aria-label="Synthetic monthly water usage chart"></div>
              <div class="insight-strip">
                <md-circular-progress value="0.72"></md-circular-progress>
                <p id="modeInsight"></p>
              </div>
            </div>
            <div>
              <img class="report-preview-art visual-asset" src="assets/report-preview-redacted.webp" alt="Synthetic redacted report preview" loading="lazy" />
              <div class="frame-actions compact-actions">
                <md-filled-button href="sample-report/index.html" target="_blank">Open sample report</md-filled-button>
                <md-outlined-button id="exampleTrySample">Try sample data</md-outlined-button>
              </div>
            </div>
          </div>
        </section>

        <section class="shell savings-section" id="savings">
          <div class="section-head">
            <h2>What to check next.</h2>
            <p>Mud Buddy does not diagnose leaks or certify savings. It helps households notice patterns that are worth checking before wasted water quietly becomes normal.</p>
          </div>
          <div class="savings-grid">
            <article class="material-card"><img src="assets/irrigation-season-story.webp" alt="Synthetic irrigation story" loading="lazy" /><h3>Irrigation walk-through</h3><p>Check controller schedules, stuck zones, runoff, overwatering, and thirsty planting areas.</p></article>
            <article class="material-card"><img src="assets/leak-check-next-steps.webp" alt="Synthetic leak check next steps" loading="lazy" /><h3>Simple fixture checks</h3><p>Use normal use that slowly rises as a prompt for a toilet dye test, meter test, and fixture walk-through.</p></article>
            <article class="material-card"><img src="assets/ebmud-resource-directory.webp" alt="Synthetic official resource directory signposts" loading="lazy" /><h3>Official next steps</h3><p>Use EBMUD directly for billing, outage, pressure, water-quality, rebate, assistance, or emergency questions.</p></article>
          </div>
        </section>


        <section class="resource-band" id="resources">
          <div class="shell resource-layout">
            <div class="resource-copy">
              <h2>Official EBMUD resources, right where the questions show up.</h2>
              <p>Mud Buddy is a private interpretation layer. When the next step is official, urgent, billing-related, pressure/outage-related, water-quality-related, rebate, or assistance related, use EBMUD's public customer resources.</p>
              <img class="resource-art visual-asset" src="assets/ebmud-resource-directory.webp" alt="Synthetic official EBMUD resource directory illustration" loading="lazy" />
            </div>
            <div class="resource-grid" aria-label="Official EBMUD resources">${resourceCards}</div>
          </div>
        </section>

        <section class="mission-band" id="mission">
          <div class="shell mission-layout">
            <div>
              <h2>Save millions of gallons, one home at a time.</h2>
              <p>Mud Buddy helps East Bay households catch waste earlier: overwatering, stuck irrigation schedules, running toilets, rising normal use, and confusing bill-period changes.</p>
              <p class="official-line">Savings are estimates and prompts for action, not certified EBMUD conservation totals.</p>
              <p class="official-line">EBMUD serves about 1.4 million people in a 332-square-mile water service area. One EBMUD billing unit, or CCF, is 748 gallons.</p>
            </div>
            <div class="mission-grid" aria-label="One million gallon goal math">
              <article class="material-card"><md-ripple></md-ripple><strong>Millions</strong><span>of gallons worth noticing sooner</span></article>
              <article class="material-card"><md-ripple></md-ripple><strong>One CSV</strong><span>private analysis in your browser</span></article>
              <article class="material-card"><md-ripple></md-ripple><strong>One home</strong><span>clear next checks before panic</span></article>
              <article class="material-card"><md-ripple></md-ripple><strong>East Bay</strong><span>built with local context</span></article>
            </div>
          </div>
        </section>

        <section class="review-band" id="review">
          <div class="shell review-layout">
            <div>
              <p class="overline">For EBMUD review</p>
              <h2>Independent today. Feedback-ready if EBMUD wants to review it.</h2>
              <p>Mud Buddy is a working browser-local prototype for EBMUD customers. It is designed to help people understand their own exported usage data while routing official billing, emergency, rebate, assistance, outage, pressure, and water-quality questions back to EBMUD.</p>
              <p class="official-line">No EBMUD logo, partnership, endorsement, approval, or official status is claimed unless EBMUD explicitly authorizes it.</p>
            </div>
            <div class="review-cards">
              <a class="material-card review-card" href="docs/ebmud-review-brief.md">
                <md-ripple></md-ripple>
                <span class="icon-glyph" aria-hidden="true" data-icon="fact_check"></span>
                <strong>Review brief</strong>
                <p>Purpose, customer benefit, privacy model, methodology limits, and feedback ask.</p>
              </a>
              <a class="material-card review-card" href="docs/browser-local-proof.md">
                <md-ripple></md-ripple>
                <span class="icon-glyph" aria-hidden="true" data-icon="lock"></span>
                <strong>Browser-local proof</strong>
                <p>Static-site boundary, no backend CSV upload, no storage writes, and test evidence.</p>
              </a>
              <a class="material-card review-card" href="docs/co-release-proposal.md">
                <md-ripple></md-ripple>
                <span class="icon-glyph" aria-hidden="true" data-icon="handshake"></span>
                <strong>Collaboration options</strong>
                <p>Low-risk review, pilot, educational use, or conservation-partner paths.</p>
              </a>
            </div>
          </div>
        </section>


        <section class="privacy-band" id="privacy">
          <div class="shell split reverse">
            <div>
              <img class="privacy-art visual-asset" src="assets/privacy-local-first.webp" alt="Synthetic local-first privacy illustration" loading="lazy" />
              <h2>Private by default, careful by design.</h2>
              <p>Your CSV is read in this browser and is not uploaded. Credentials, MFA, cookies, browser storage, session tokens, and billing settings are outside the tool boundary.</p>
              <div class="doc-actions">
                <md-outlined-button href="docs/privacy.md">Privacy notes</md-outlined-button>
                <md-outlined-button href="docs/security-review.md">Security review</md-outlined-button>
                <md-outlined-button href="docs/public-sharing-checklist.md">Sharing checklist</md-outlined-button>
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer>
        <div class="shell footer-grid">
          <p><strong>Mud Buddy</strong><br />A private browser-local water-use helper for EBMUD customers.</p>
          <p>Not affiliated with EBMUD. Not a formal water audit, leak detector, plumbing inspection, billing tool, or official utility analysis.</p>
          <p>Built with love in Lafayette, CA. <a href="docs/methodology.md">Methodology</a> | <a href="docs/browser-control-safety.md">Browser safety</a> | <a href="https://x.com/danieloleary" target="_blank" rel="noreferrer">X</a> | <a href="https://www.linkedin.com/in/danieloleary/" target="_blank" rel="noreferrer">LinkedIn</a></p>
        </div>
      </footer>

      <md-dialog id="checklistDialog" aria-label="Privacy boundary dialog">
        <div slot="headline">Your CSV stays in the browser</div>
        <form slot="content" method="dialog">
          <p>The upload analyzer reads the selected CSV with your browser's file picker. It does not post the file, store it in browser storage, put it in a URL, or show the filename in the report.</p>
        </form>
        <div slot="actions"><md-text-button formmethod="dialog">Close</md-text-button></div>
      </md-dialog>
    `;
  }

  bind() {
    this.querySelectorAll('md-primary-tab').forEach((tab) => tab.addEventListener('click', () => this.updateMode(tab.dataset.mode)));
    this.querySelector('#openChecklist').addEventListener('click', () => this.querySelector('#checklistDialog').show());

    const input = this.querySelector('#csvInput');
    const openPicker = () => input.click();
    this.querySelector('#topAnalyze').addEventListener('click', openPicker);
    this.querySelector('#heroAnalyze').addEventListener('click', openPicker);
    this.querySelector('#chooseCsv').addEventListener('click', openPicker);
    this.querySelector('#dropzone').addEventListener('click', openPicker);
    this.querySelector('#trySample').addEventListener('click', () => this.loadSample());
    this.querySelector('#heroSample').addEventListener('click', () => this.loadSample());
    this.querySelector('#exampleTrySample')?.addEventListener('click', () => this.loadSample());
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (file) await this.analyzeFile(file);
      input.value = '';
    });

    const dropzone = this.querySelector('#dropzone');
    dropzone.addEventListener('dragover', (event) => {
      event.preventDefault();
      dropzone.classList.add('is-dragging');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-dragging'));
    dropzone.addEventListener('drop', async (event) => {
      event.preventDefault();
      dropzone.classList.remove('is-dragging');
      const file = event.dataTransfer?.files?.[0];
      if (file) await this.analyzeFile(file);
    });
  }

  setUploadState(status, progress = 0, isError = false) {
    const statusNode = this.querySelector('#uploadStatus');
    statusNode.textContent = status;
    statusNode.classList.toggle('is-error', isError);
    this.querySelector('#uploadProgress').value = progress;
  }

  async analyzeFile(file) {
    if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') {
      this.setUploadState('That does not look like a CSV. Please choose the EBMUD billing usage export.', 0, true);
      return;
    }
    if (file.size > MAX_CSV_BYTES) {
      this.setUploadState('That CSV is too large for the browser demo. Please use an EBMUD billing usage export under 5 MB.', 0, true);
      return;
    }
    this.setUploadState('Reading the selected CSV locally in your browser...', 0.35);
    try {
      const text = await file.text();
      this.analyzeCsvText(text, { sample: false });
    } catch (error) {
      this.showUploadError(error);
    }
  }

  async loadSample() {
    this.setUploadState('Loading the synthetic sample CSV...', 0.3);
    try {
      const response = await fetch('examples/sample-ebmud-usage.csv', { cache: 'no-store' });
      if (!response.ok) throw new Error('Sample CSV was not available. Try the sample report instead.');
      const text = await response.text();
      this.analyzeCsvText(text, { sample: true });
    } catch (error) {
      this.showUploadError(error);
    }
  }

  analyzeCsvText(text, options) {
    this.setUploadState('Analyzing water-use patterns locally...', 0.72);
    const parsed = parseEbmudCsv(text, { maxRows: MAX_CSV_ROWS + 1 });
    const analysis = analyzeWaterUse(parsed.rows, parsed.invalidRows, parsed.warnings);
    renderBrowserReport(this.querySelector('#browserReport'), analysis, options);
    this.classList.add('has-browser-report');
    this.querySelector('#analyzeAnother')?.addEventListener('click', () => this.querySelector('#csvInput').click());
    this.querySelector('#printReport')?.addEventListener('click', () => window.print());
    this.setUploadState('Report ready. The CSV was analyzed in this browser.', 1);
    this.querySelector('#browserReport').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  showUploadError(error) {
    this.querySelector('#browserReport').replaceChildren();
    this.classList.remove('has-browser-report');
    this.setUploadState(error instanceof Error ? error.message : 'Could not analyze that CSV.', 0, true);
  }

  updateMode(mode) {
    const data = sampleModes[mode];
    this.querySelector('#modeLabel').textContent = data.label;
    this.querySelector('#modeTitle').textContent = data.title;
    this.querySelector('#modeMetric').textContent = data.metric;
    this.querySelector('#modeHelper').textContent = data.helper;
    this.querySelector('#modeInsight').textContent = data.insight;
    this.querySelectorAll('md-primary-tab').forEach((tab) => { tab.active = tab.dataset.mode === mode; });
    const max = Math.max(...data.bars);
    const chart = this.querySelector('#chart');
    chart.replaceChildren();
    data.bars.forEach((value, index) => {
      const bar = document.createElement('span');
      bar.style.setProperty('--h', `${Math.max(18, (value / max) * 100)}%`);
      bar.title = `Month ${index + 1}: ${value} synthetic GPD`;
      chart.append(bar);
    });
  }
}

customElements.define('mud-buddy-app', MudBuddyApp);
