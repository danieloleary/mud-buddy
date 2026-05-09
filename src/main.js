import '@material/web/button/filled-button.js';
import '@material/web/button/filled-tonal-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import '@material/web/chips/assist-chip.js';
import '@material/web/dialog/dialog.js';
import '@material/web/divider/divider.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/progress/linear-progress.js';
import '@material/web/ripple/ripple.js';
import './styles.css';
import { parseEbmudCsv } from './ebmud-csv.js';
import { analyzeWaterUse } from './water-analysis.js';
import { renderBrowserReport } from './browser-report.js';

const MAX_CSV_BYTES = 5 * 1024 * 1024;
const MAX_CSV_ROWS = 5000;

const ebmudResources = [
  { icon: 'account_circle', title: 'Your account', href: 'https://www.ebmud.com/customers/account', text: 'Account access, My Water Report entry points, alerts, and official customer settings.' },
  { icon: 'query_stats', title: 'My Water Report', href: 'https://www.ebmud.com/water/conservation-and-rebates/my-water-report-program', text: 'EBMUD guidance for Track Usage, alerts, and gallons-per-day charts.' },
  { icon: 'plumbing', title: 'Leaks and high bills', href: 'https://www.ebmud.com/customers/billing-questions/leaks-and-high-bills', text: 'Official leak and high-bill guidance when a pattern is worth checking.' },
  { icon: 'water_drop', title: 'Conservation and rebates', href: 'https://www.ebmud.com/water/conservation-and-rebates', text: 'Official conservation services, rebates, landscape help, and efficiency programs.' },
  { icon: 'warning', title: 'Alerts and outages', href: 'https://www.ebmud.com/customers/alerts', text: 'Use EBMUD directly for outages, service alerts, pressure, and urgent issues.' },
  { icon: 'support_agent', title: 'Contact / emergency', href: 'https://www.ebmud.com/contact-us', text: 'Official support for account, emergency, billing, pressure, and water-quality issues.' }
];

const resourceCards = ebmudResources.map((item) => `
  <a class="resource-card material-card" href="${item.href}" target="_blank" rel="noreferrer">
    <md-ripple></md-ripple>
    <span class="icon-glyph" aria-hidden="true" data-icon="${item.icon}"></span>
    <strong>${item.title}</strong>
    <span>${item.text}</span>
  </a>
`).join('');

class MudBuddyApp extends HTMLElement {
  connectedCallback() {
    this.render();
    this.bind();
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
          <a href="#app">Report</a>
          <a href="#how">Get file</a>
          <a href="#resources">Official links</a>
          <a href="#privacy">Privacy</a>
        </nav>
        <md-filled-button id="topAnalyze">Create my report</md-filled-button>
      </header>

      <main id="top">
        <section class="hero shell" id="app">
          <div class="hero-copy reveal">
            <p class="overline">Private browser-local water report</p>
            <h1>Create a private EBMUD water report.</h1>
            <p class="lede">Upload the usage file from your EBMUD account. Mud Buddy reads it in your browser and shows what changed, what likely caused it, and what to check next.</p>
            <div class="hero-actions">
              <md-filled-button id="heroAnalyze">Create my report</md-filled-button>
              <md-filled-tonal-button id="heroSample">Try sample report</md-filled-tonal-button>
              <md-text-button href="#how">Get my usage file</md-text-button>
            </div>
            <div class="trust-row" aria-label="Trust promises">
              <md-assist-chip label="Runs in your browser"></md-assist-chip>
              <md-assist-chip label="No server upload"></md-assist-chip>
              <md-assist-chip label="No EBMUD login needed"></md-assist-chip>
            </div>
            <figure class="mascot-card material-card">
              <img src="assets/mud-buddy-kawaii-mascot.webp" alt="Cute Mud Buddy mascot holding a small water meter clipboard" />
              <figcaption>Mud Buddy reads the pattern. You choose what to check next.</figcaption>
            </figure>
          </div>

          <div class="upload-panel reveal delay-1" aria-label="Browser-local usage file analyzer">
            <div class="material-card upload-card">
              <div class="card-toolbar">
                <span>Create your water report</span>
                <md-icon-button aria-label="Open privacy boundary" id="openChecklist"><span class="icon-glyph" aria-hidden="true" data-icon="shield"></span></md-icon-button>
              </div>
              <md-divider></md-divider>
              <input id="csvInput" class="sr-only-file" type="file" accept=".csv,text/csv" />
              <button class="dropzone" id="dropzone" type="button">
                <span class="icon-glyph" aria-hidden="true" data-icon="upload_file"></span>
                <strong>Drop your EBMUD usage file here</strong>
                <span>or choose the file you downloaded from EBMUD</span>
              </button>
              <div class="upload-actions">
                <md-filled-button id="chooseCsv">Create my report</md-filled-button>
                <md-filled-tonal-button id="trySample">Try sample report</md-filled-tonal-button>
              </div>
              <div class="local-proof" id="privacy">
                <span class="icon-glyph" aria-hidden="true" data-icon="verified_user"></span>
                <p>Runs in this browser. Your usage file is not uploaded, stored, or added to the URL. Not affiliated with EBMUD.</p>
              </div>
              <md-linear-progress id="uploadProgress" value="0"></md-linear-progress>
              <p id="uploadStatus" class="upload-status" aria-live="polite">Waiting for your usage file. Nothing has been uploaded or stored.</p>
            </div>
          </div>
        </section>

        <section class="shell browser-result-section" id="browserReport" aria-live="polite"></section>

        <section class="shell support-grid" id="how">
          <article class="material-card helper-card">
            <p class="overline">Get your usage file</p>
            <h2>Download from EBMUD, then create your report.</h2>
            <p>Log into EBMUD yourself, open Track Usage or My Water Report, and download your billing usage file. It may be labeled CSV or export. Mud Buddy never needs your login, MFA code, or browser session.</p>
            <div class="mini-steps">
              <span><strong>1</strong> Log into EBMUD yourself</span>
              <span><strong>2</strong> Download your usage file</span>
              <span><strong>3</strong> Create your private report here</span>
            </div>
          </article>

          <article class="material-card helper-card compact-sample" id="example">
            <p class="overline">Sample</p>
            <h2>Try a sample report.</h2>
            <p>See the report flow before choosing your own file.</p>
            <div class="helper-actions">
              <md-filled-tonal-button id="exampleTrySample">Try sample report</md-filled-tonal-button>
              <md-outlined-button href="sample-report/index.html" target="_blank">Open sample report</md-outlined-button>
            </div>
          </article>
        </section>

        <section class="shell resource-strip" id="resources">
          <div class="section-head compact-head">
            <p class="overline">Official EBMUD resources</p>
            <h2>Use EBMUD directly when the next step is official.</h2>
            <p>Mud Buddy explains your usage file. EBMUD handles billing, emergencies, rebates, outages, pressure, assistance, and water quality.</p>
          </div>
          <div class="resource-grid" aria-label="Official EBMUD resources">${resourceCards}</div>
        </section>
      </main>

      <footer>
        <div class="shell footer-grid">
          <p><strong>Mud Buddy</strong><br />Private water-use reports for EBMUD customers.</p>
          <p>Not affiliated with EBMUD. Not a formal water audit, leak detector, plumbing inspection, billing tool, or official utility analysis.</p>
          <p>Built with love in Lafayette, CA. Goal: save millions of gallons, one home at a time. <a href="docs/methodology.md">Methodology</a> | <a href="docs/privacy.md">Privacy</a> | <a href="docs/browser-control-safety.md">Browser safety</a> | <a href="https://x.com/danieloleary" target="_blank" rel="noreferrer">X</a> | <a href="https://www.linkedin.com/in/danieloleary/" target="_blank" rel="noreferrer">LinkedIn</a></p>
        </div>
      </footer>

      <md-dialog id="checklistDialog" aria-label="Privacy boundary dialog">
        <div slot="headline">Your usage file stays in the browser</div>
        <form slot="content" method="dialog">
          <p>The analyzer reads the selected usage file with your browser's file picker. It does not post the file, store it in browser storage, put it in a URL, or show the filename in the report.</p>
        </form>
        <div slot="actions"><md-text-button formmethod="dialog">Close</md-text-button></div>
      </md-dialog>
    `;
  }

  bind() {
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
      this.setUploadState('That does not look like an EBMUD usage file. Please choose the billing usage export, usually a .csv file.', 0, true);
      return;
    }
    if (file.size > MAX_CSV_BYTES) {
      this.setUploadState('That usage file is too large for the browser demo. Please use an EBMUD billing usage export under 5 MB.', 0, true);
      return;
    }
    this.setUploadState('Reading the selected usage file locally in your browser...', 0.35);
    try {
      const text = await file.text();
      this.analyzeCsvText(text, { sample: false });
    } catch (error) {
      this.showUploadError(error);
    }
  }

  async loadSample() {
    this.setUploadState('Loading the synthetic sample report...', 0.3);
    try {
      const response = await fetch('examples/sample-ebmud-usage.csv', { cache: 'no-store' });
      if (!response.ok) throw new Error('Sample usage file was not available. Try the sample report instead.');
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
    this.setUploadState('Report ready. Your usage file was analyzed in this browser.', 1);
    this.querySelector('#browserReport').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  showUploadError(error) {
    this.querySelector('#browserReport').replaceChildren();
    this.classList.remove('has-browser-report');
    this.setUploadState(error instanceof Error ? error.message : 'Could not analyze that usage file.', 0, true);
  }
}

customElements.define('mud-buddy-app', MudBuddyApp);
