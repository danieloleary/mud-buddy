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
import { buildShareText, renderBrowserReport } from './browser-report.js';

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
  lastShareText = '';

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
          <a href="#home">Home</a>
          <a href="#analyze">Analyze</a>
          <a href="#how">Get file</a>
          <a href="#resources">Official links</a>
          <a href="#privacy">Privacy</a>
        </nav>
        <md-filled-button id="topAnalyze">Analyze usage</md-filled-button>
      </header>

      <main id="top">
        <section class="landing shell" id="home">
          <div class="landing-copy reveal">
            <p class="overline">Save money. Save water.</p>
            <h1>Learn where your water bill is leaking money.</h1>
            <p class="lede">Mud Buddy turns EBMUD usage data into a private, plain-English report: what changed, what to check first, and where savings may be hiding.</p>
            <div class="landing-actions">
              <md-filled-button id="heroAnalyze">Analyze my usage</md-filled-button>
              <md-filled-tonal-button id="heroSample">Try sample report</md-filled-tonal-button>
              <md-text-button data-file-guide="true">How to get the file</md-text-button>
            </div>
            <div class="trust-row" aria-label="Trust promises">
              <md-assist-chip label="Private in your browser"></md-assist-chip>
              <md-assist-chip label="No EBMUD login needed"></md-assist-chip>
              <md-assist-chip label="Built for homeowners"></md-assist-chip>
            </div>
          </div>

          <figure class="landing-visual material-card reveal delay-1">
            <div class="visual-frame">
              <img src="assets/mud-buddy-kawaii-mascot.webp" alt="Cute Mud Buddy mascot holding a small water meter clipboard" />
            </div>
            <figcaption>
              <strong>Save a ridiculous amount of water, one house at a time.</strong>
              <span>Built with love in Lafayette, CA.</span>
            </figcaption>
          </figure>
        </section>

        <section class="shell analyzer-section" id="analyze">
          <div class="analyzer-intro">
            <p class="overline">Private analyzer</p>
            <h2>Upload your EBMUD usage data.</h2>
            <p>Get beautiful analysis, practical recommendations, and a clear first thing to check. No server upload, no account changes, no nerd homework.</p>
          </div>

          <div class="analyzer-grid">
            <div class="upload-panel reveal delay-1" aria-label="Browser-local usage file analyzer">
            <div class="material-card upload-card">
              <div class="card-toolbar">
                <span>Find savings in 30 seconds</span>
                <md-icon-button aria-label="Open privacy boundary" id="openChecklist"><span class="icon-glyph" aria-hidden="true" data-icon="shield"></span></md-icon-button>
              </div>
              <md-divider></md-divider>
              <input id="csvInput" class="sr-only-file" type="file" accept=".csv,text/csv" />
              <button class="dropzone" id="dropzone" type="button">
                <span class="icon-glyph" aria-hidden="true" data-icon="upload_file"></span>
                <strong>Drop your EBMUD usage data here</strong>
                <span>or choose the file you downloaded from EBMUD</span>
              </button>
              <div class="upload-actions">
                <md-filled-button id="chooseCsv">Find savings in 30 seconds</md-filled-button>
                <md-filled-tonal-button id="trySample">Try sample report</md-filled-tonal-button>
                <md-text-button data-file-guide="true">Where do I get this file?</md-text-button>
              </div>
              <div class="local-proof" id="privacy">
                <span class="icon-glyph" aria-hidden="true" data-icon="verified_user"></span>
                <p>Runs in this browser. Your usage file is not uploaded, stored, or added to the URL. Not affiliated with EBMUD.</p>
              </div>
              <md-linear-progress id="uploadProgress" value="0"></md-linear-progress>
              <p id="uploadStatus" class="upload-status" aria-live="polite">Waiting for your usage file. Nothing has been uploaded or stored.</p>
            </div>
            </div>

            <aside class="material-card analyzer-helper">
              <p class="overline">What you get</p>
              <h3>Not a dashboard. A useful read.</h3>
              <ul>
                <li>What changed since your normal daily use.</li>
                <li>Whether outdoor watering is the obvious suspect.</li>
                <li>What to check this weekend before the next bill.</li>
                <li>When to use EBMUD directly instead of guessing.</li>
              </ul>
              <md-divider></md-divider>
              <p>Tip: if your plants are thirsty, this helps separate “needed irrigation” from “oops, the controller went feral.”</p>
            </aside>
          </div>
        </section>

        <section class="shell browser-result-section" id="browserReport" aria-live="polite"></section>

        <section class="shell get-file-section" id="how">
          <article class="material-card helper-card">
            <p class="overline">Get your usage file</p>
            <h2>Download from EBMUD, then create your report.</h2>
            <p>Getting the file usually takes about 3 minutes. Once you have it, Mud Buddy shows where to save in under 30 seconds. Log into EBMUD yourself, open Track Usage or My Water Report, and download your billing usage file. Look for a Download your data or Export button.</p>
            <p class="helper-reassurance">This will not change your EBMUD account. Mud Buddy never needs your login, MFA code, or browser session.</p>
            <div class="mini-steps">
              <span><strong>1</strong> Log into EBMUD yourself</span>
              <span><strong>2</strong> Open Track Usage or My Water Report</span>
              <span><strong>3</strong> Download your usage file</span>
              <span><strong>4</strong> Come back and create your private report</span>
            </div>
            <div class="helper-actions">
              <md-filled-tonal-button data-file-guide="true">Show me the steps</md-filled-tonal-button>
              <md-outlined-button href="https://www.ebmud.com/customers/account" target="_blank" rel="noreferrer">Open EBMUD account page</md-outlined-button>
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
          <p>Built with love in Lafayette, CA. Goal: help neighbors save money and millions of gallons, one home at a time. <a href="docs/methodology.md">Methodology</a> | <a href="docs/privacy.md">Privacy</a> | <a href="docs/browser-control-safety.md">Browser safety</a> | <a href="https://x.com/danieloleary" target="_blank" rel="noreferrer">X</a> | <a href="https://www.linkedin.com/in/danieloleary/" target="_blank" rel="noreferrer">LinkedIn</a></p>
        </div>
      </footer>

      <md-dialog id="checklistDialog" aria-label="Privacy boundary dialog">
        <div slot="headline">Your usage file stays in the browser</div>
        <form slot="content" method="dialog">
          <p>The analyzer reads the selected usage file with your browser's file picker. It does not post the file, store it in browser storage, put it in a URL, or show the filename in the report.</p>
        </form>
        <div slot="actions"><md-text-button id="closeChecklist">Close</md-text-button></div>
      </md-dialog>

      <md-dialog id="usageFileDialog" aria-label="How to get your EBMUD usage file">
        <div slot="headline">How to get your EBMUD usage file</div>
        <form slot="content" method="dialog">
          <p class="dialog-lede">You do not need to understand the file. Just download it from EBMUD and drop it into Mud Buddy.</p>
          <ol class="dialog-steps">
            <li>Log into your EBMUD account yourself.</li>
            <li>Open Track Usage or My Water Report.</li>
            <li>Look for Download your data or Export.</li>
            <li>Save the usage file, then come back here and choose Find savings in 30 seconds.</li>
          </ol>
          <p class="dialog-note">Mud Buddy does not change your EBMUD account and never needs your password, MFA code, cookies, or browser session.</p>
        </form>
        <div slot="actions">
          <md-text-button id="closeUsageFileGuide">Close</md-text-button>
          <md-filled-tonal-button href="https://www.ebmud.com/customers/account" target="_blank" rel="noreferrer">Open EBMUD</md-filled-tonal-button>
        </div>
      </md-dialog>
    `;
  }

  bind() {
    this.querySelector('#openChecklist').addEventListener('click', () => this.querySelector('#checklistDialog').show());
    this.querySelector('#closeChecklist').addEventListener('click', () => this.querySelector('#checklistDialog').close());
    this.querySelector('#closeUsageFileGuide').addEventListener('click', () => this.querySelector('#usageFileDialog').close());
    this.querySelectorAll('[data-file-guide="true"]').forEach((node) => {
      node.addEventListener('click', (event) => {
        event.preventDefault();
        this.querySelector('#usageFileDialog').show();
      });
    });

    const input = this.querySelector('#csvInput');
    const openPicker = () => input.click();
    const moveToAnalyzer = () => this.showAnalyzer(true);
    this.querySelector('#topAnalyze').addEventListener('click', moveToAnalyzer);
    this.querySelector('#heroAnalyze').addEventListener('click', moveToAnalyzer);
    this.querySelector('#chooseCsv').addEventListener('click', openPicker);
    this.querySelector('#dropzone').addEventListener('click', openPicker);
    this.querySelector('#trySample').addEventListener('click', () => this.loadSample());
    this.querySelector('#heroSample').addEventListener('click', () => {
      this.showAnalyzer(false);
      this.loadSample();
    });
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

  showAnalyzer(focusAction = false) {
    this.classList.add('has-opened-analyzer');
    this.querySelector('#analyze').scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (focusAction) {
      window.setTimeout(() => this.querySelector('#chooseCsv')?.focus(), 320);
    }
  }

  setUploadState(status, progress = 0, isError = false) {
    const statusNode = this.querySelector('#uploadStatus');
    statusNode.textContent = status;
    statusNode.classList.toggle('is-error', isError);
    this.querySelector('#uploadProgress').value = progress;
  }

  async analyzeFile(file) {
    if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') {
      this.setUploadState('That does not look like an EBMUD usage file. Please choose the billing usage export, from EBMUD.', 0, true);
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
    this.showAnalyzer(false);
    this.setUploadState('Analyzing water-use patterns locally...', 0.72);
    const parsed = parseEbmudCsv(text, { maxRows: MAX_CSV_ROWS + 1 });
    const analysis = analyzeWaterUse(parsed.rows, parsed.invalidRows, parsed.warnings);
    this.lastShareText = buildShareText(analysis);
    renderBrowserReport(this.querySelector('#browserReport'), analysis, options);
    this.classList.add('has-browser-report');
    this.querySelector('#analyzeAnother')?.addEventListener('click', () => this.querySelector('#csvInput').click());
    this.querySelector('#printReport')?.addEventListener('click', () => window.print());
    this.querySelectorAll('[data-share-report="true"]').forEach((node) => {
      node.addEventListener('click', () => this.shareReport());
    });
    this.querySelectorAll('[data-copy-summary="true"]').forEach((node) => {
      node.addEventListener('click', () => this.copyShareSummary());
    });
    this.setUploadState('Report ready. Your usage file was analyzed in this browser.', 1);
    this.querySelector('#browserReport').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async shareReport() {
    const text = this.lastShareText || 'Mud Buddy helped me turn EBMUD usage data into practical water-saving checks. Runs locally in the browser. Not affiliated with EBMUD.';
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Mud Buddy water-saving hunt',
          text,
          url: window.location.href
        });
        this.setUploadState('Share sheet opened. Public-safe summary only.', 1);
        return;
      }
      await this.copyShareSummary('Share text copied. Public-safe summary only.');
    } catch (error) {
      if (error?.name === 'AbortError') return;
      await this.copyShareSummary('Share was not available, so the summary was copied instead.');
    }
  }

  async copyShareSummary(message = 'Share text copied. Public-safe summary only.') {
    const text = this.lastShareText || 'Mud Buddy helped me turn EBMUD usage data into practical water-saving checks. Runs locally in the browser. Not affiliated with EBMUD.';
    try {
      await navigator.clipboard.writeText(text);
      this.setUploadState(message, 1);
    } catch {
      this.setUploadState('Copy was blocked by the browser. You can still print or save the report as a PDF.', 1, true);
    }
  }

  showUploadError(error) {
    this.querySelector('#browserReport').replaceChildren();
    this.classList.remove('has-browser-report');
    this.setUploadState(error instanceof Error ? error.message : 'Could not analyze that usage file.', 0, true);
  }
}

customElements.define('mud-buddy-app', MudBuddyApp);
