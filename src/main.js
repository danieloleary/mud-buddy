import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import '@material/web/chips/assist-chip.js';
import '@material/web/checkbox/checkbox.js';
import '@material/web/dialog/dialog.js';
import '@material/web/divider/divider.js';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/progress/circular-progress.js';
import '@material/web/progress/linear-progress.js';
import '@material/web/tabs/primary-tab.js';
import '@material/web/tabs/tabs.js';
import './styles.css';

const modes = {
  normal: {
    label: 'Normal household',
    title: 'Baseline looks honest, not wasteful.',
    metric: '148 GPD',
    helper: 'Synthetic sample: steady indoor use, mild garden lift, no obvious continuous-use clue.',
    bars: [48, 50, 55, 52, 57, 60, 62, 59, 54, 51, 49, 48],
    insight: 'Good first check: compare winter/spring baseline before judging summer watering.'
  },
  irrigation: {
    label: 'Irrigation season',
    title: 'The yard is doing most of the talking.',
    metric: '236 GPD',
    helper: 'Synthetic sample: summer/fall lift rises far above indoor baseline, then cools back down.',
    bars: [45, 47, 54, 67, 74, 88, 96, 94, 84, 70, 55, 47],
    insight: 'Best next move: audit controller zones and leaks before ripping out plants.'
  },
  leak: {
    label: 'Possible leak clue',
    title: 'A quiet baseline creep deserves a dye test.',
    metric: '192 GPD',
    helper: 'Synthetic sample: winter usage stays higher than expected, which can point to fixtures or toilets.',
    bars: [62, 64, 66, 69, 70, 76, 78, 77, 75, 73, 71, 70],
    insight: 'Not a diagnosis: it is a pattern worth checking with the meter and toilet dye tests.'
  }
};

const checklist = [
  'No name or service address',
  'No account number or meter ID',
  'No raw CSV rows or local file paths',
  'No exact vacation or absence pattern',
  'Footer says not affiliated with EBMUD'
];

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
          <span class="brand-mark"><md-icon>water_drop</md-icon></span>
          <span><strong>Mud Buddy</strong><small>by Danno</small></span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#how">How it works</a>
          <a href="#privacy">Privacy</a>
          <a href="#install">Install</a>
        </nav>
        <md-filled-button href="#try">Try sample</md-filled-button>
      </header>

      <main id="top">
        <section class="hero shell">
          <div class="hero-copy reveal">
            <h1>Understand your EBMUD water use in minutes.</h1>
            <p class="lede">Export your EBMUD usage CSV manually or with agent assist after login, provide it intentionally to Mud Buddy, and get a plain-English report showing gallons-per-day trends, seasonal irrigation lift, possible leak clues, and practical checks.</p>
            <div class="hero-actions">
              <md-filled-button href="sample-report/index.html" target="_blank">See sample report</md-filled-button>
              <md-outlined-button href="mud-buddy-by-danno.zip">Generate a local report</md-outlined-button>
              <md-text-button href="#install">Use with AI tools</md-text-button>
            </div>
            <div class="trust-row" aria-label="Trust promises">
              <span><md-icon>verified_user</md-icon>Free to use</span>
              <span><md-icon>computer</md-icon>Runs locally</span>
              <span><md-icon>lock</md-icon>You control the CSV</span><span><md-icon>password</md-icon>No password needed</span>
            </div>
          </div>

          <div class="phone-panel reveal delay-1" aria-label="Interactive sample analysis preview">
            <div class="material-card product-card">
              <div class="card-toolbar">
                <span>Mud Buddy sample</span>
                <md-icon-button aria-label="Open public share checklist" id="openChecklist"><md-icon>shield</md-icon></md-icon-button>
              </div>
              <md-tabs id="modeTabs" aria-label="Sample usage modes">
                <md-primary-tab active data-mode="normal">Normal</md-primary-tab>
                <md-primary-tab data-mode="irrigation">Irrigation</md-primary-tab>
                <md-primary-tab data-mode="leak">Leak clue</md-primary-tab>
              </md-tabs>
              <div class="mode-card">
                <div>
                  <p class="overline" id="modeLabel">Normal household</p>
                  <h2 id="modeTitle">Baseline looks honest, not wasteful.</h2>
                  <p id="modeHelper"></p>
                </div>
                <div class="metric-pill"><strong id="modeMetric">148 GPD</strong><span>sample peak</span></div>
              </div>
              <div class="chart" id="chart" aria-label="Synthetic monthly water usage chart"></div>
              <div class="insight-strip">
                <md-circular-progress value="0.72"></md-circular-progress>
                <p id="modeInsight"></p>
              </div>
              <div class="chip-row" aria-label="Feature chips">
                <md-assist-chip label="Baseline"></md-assist-chip>
                <md-assist-chip label="Seasonal lift"></md-assist-chip>
                <md-assist-chip label="Redaction"></md-assist-chip>
              </div>
            </div>
          </div>
        </section>

        <section class="river-band" id="try">
          <div class="shell split">
            <div>
              <h2>CSV to clarity, without handing your water life to a random server.</h2>
              <p>Download or intentionally provide your EBMUD usage CSV, run the local report generator, and get a scrollable visual report that separates household baseline, irrigation lift, peer benchmarks, and check-next clues.</p>
            </div>
            <div class="steps material-card">
              <article><md-icon>download</md-icon><span>Export CSV</span><p>User logs into EBMUD manually; the agent can help download the official CSV after confirmation.</p></article>
              <article><md-icon>analytics</md-icon><span>Generate report</span><p>Mud Buddy processes only the CSV the user explicitly provides.</p></article>
              <article><md-icon>ios_share</md-icon><span>Share safely</span><p>Public mode buckets/removes address, account, meter, raw CSV, and sensitive patterns.</p></article>
            </div>
          </div>
        </section>

        <section class="shell sample-section" id="how">
          <div class="section-head">
            <h2>A gorgeous sample report, built from fake data.</h2>
            <p>Preview the actual output style with synthetic EBMUD-like rows, including an invalid <code>GPD = N/A</code> row that the parser excludes cleanly.</p>
          </div>
          <div class="report-frame material-card">
            <iframe src="sample-report/index.html" title="Mud Buddy sample report"></iframe>
            <div class="frame-actions">
              <md-filled-button href="sample-report/index.html" target="_blank">Open full report</md-filled-button>
              <md-outlined-button href="assets/social-card.svg" target="_blank">Social card</md-outlined-button>
            </div>
          </div>
        </section>

        <section class="shell feature-grid">
          <article class="material-card"><md-icon>query_stats</md-icon><h3>Driver-first analysis</h3><p>GPD trends, current baseline, seasonal lift, peak periods, and practical homeowner next steps.</p></article>
          <article class="material-card"><md-icon>yard</md-icon><h3>Irrigation-aware</h3><p>Frames yard changes as "more plant health per gallon," not just guilt about using water.</p></article>
          <article class="material-card"><md-icon>plumbing</md-icon><h3>Fixture clues</h3><p>Flags patterns worth checking, like winter baseline creep or unusually high WaterScore periods.</p></article>
          <article class="material-card"><md-icon>terminal</md-icon><h3>Codex skill</h3><p>Reusable ebmud-buddy workflow for local CSV analysis, report generation, and safe redaction.</p></article>
        </section>

        <section class="privacy-band" id="privacy">
          <div class="shell split reverse">
            <div class="material-card checklist-card">
              <h3>Public-share checklist</h3>
              ${checklist.map((item, idx) => `<label><md-checkbox data-check="${idx}"></md-checkbox><span>${item}</span></label>`).join('')}
              <md-linear-progress id="shareProgress" value="0"></md-linear-progress>
              <p id="shareStatus">Check every item before publishing a public artifact.</p>
            </div>
            <div>
              <h2>Secure by default, skeptical by design.</h2>
              <p>Credentials, MFA, cookies, browser storage, session tokens, and billing settings are outside the tool boundary. Browser assistance only starts after the user logs in manually and stops if the portal is unclear.</p>
              <div class="doc-actions">
                <md-outlined-button href="docs/privacy.md">Privacy notes</md-outlined-button>
                <md-outlined-button href="docs/security-review.md">Security review</md-outlined-button>
              </div>
            </div>
          </div>
        </section>

        <section class="shell install-section" id="install">
          <div class="install-copy">
            <h2>Install the skill, fork the kit, make your own water report.</h2>
            <p>The launch kit includes a Material demo site, synthetic sample report, Codex skill, docs, test harness, and public-safe ZIP. No AI is required to generate a local report.</p>
          </div>
          <div class="terminal-card material-card">
            <div><span></span><span></span><span></span></div>
            <pre><code>$ python scripts/generate_report.py "path/to/your-ebmud-export.csv" --out "my-water-report"
$ npm run validate
$skill-installer install https://github.com/danieloleary/mud-buddy/tree/main/skills/ebmud-buddy</code></pre>
          </div>
        </section>
      </main>

      <footer>
        <div class="shell footer-grid">
          <p><strong>Mud Buddy by Danno</strong><br />A local-first water report skill for EBMUD exports.</p>
          <p>Not affiliated with EBMUD. Not a formal water audit, leak detector, plumbing inspection, billing tool, or official utility analysis.</p>
          <p><a href="docs/methodology.md">Methodology</a> | <a href="docs/browser-control-safety.md">Browser safety</a> | <a href="mud-buddy-by-danno.zip">Download ZIP</a></p>
        </div>
      </footer>

      <md-dialog id="checklistDialog" aria-label="Public share checklist dialog">
        <div slot="headline">Before you publish</div>
        <form slot="content" method="dialog">
          <p>Public reports should be generated with --public. No address, no account number, no meter ID, no raw CSV, no local paths, and no exact absence/vacation pattern.</p>
        </form>
        <div slot="actions">
          <md-text-button formmethod="dialog">Close</md-text-button>
        </div>
      </md-dialog>
    `;
  }

  bind() {
    this.querySelectorAll('md-primary-tab').forEach((tab) => tab.addEventListener('click', () => this.updateMode(tab.dataset.mode)));
    this.querySelector('#openChecklist').addEventListener('click', () => this.querySelector('#checklistDialog').show());
    this.querySelectorAll('md-checkbox').forEach((box) => box.addEventListener('change', () => this.updateChecklist()));
  }

  updateMode(mode) {
    const data = modes[mode];
    this.querySelector('#modeLabel').textContent = data.label;
    this.querySelector('#modeTitle').textContent = data.title;
    this.querySelector('#modeMetric').textContent = data.metric;
    this.querySelector('#modeHelper').textContent = data.helper;
    this.querySelector('#modeInsight').textContent = data.insight;
    this.querySelectorAll('md-primary-tab').forEach((tab) => { tab.active = tab.dataset.mode === mode; });
    const max = Math.max(...data.bars);
    this.querySelector('#chart').innerHTML = data.bars.map((value, index) => `<span style="--h:${Math.max(18, (value / max) * 100)}%" title="Month ${index + 1}: ${value} synthetic GPD"></span>`).join('');
  }

  updateChecklist() {
    const boxes = [...this.querySelectorAll('md-checkbox')];
    const complete = boxes.filter((box) => box.checked).length;
    const ratio = complete / boxes.length;
    this.querySelector('#shareProgress').value = ratio;
    this.querySelector('#shareStatus').textContent = ratio === 1 ? 'Public-safe checklist complete.' : `${complete} of ${boxes.length} checks complete.`;
  }
}

customElements.define('mud-buddy-app', MudBuddyApp);


