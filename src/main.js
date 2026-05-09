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
    helper: 'Example pattern: steady indoor use, mild garden lift, and no obvious continuous-use clue.',
    bars: [48, 50, 55, 52, 57, 60, 62, 59, 54, 51, 49, 48],
    insight: 'Good first check: compare winter/spring baseline before judging summer watering.'
  },
  irrigation: {
    label: 'Irrigation season',
    title: 'The yard is doing most of the talking.',
    metric: '236 GPD',
    helper: 'Example pattern: summer and fall lift rise far above indoor baseline, then cool back down.',
    bars: [45, 47, 54, 67, 74, 88, 96, 94, 84, 70, 55, 47],
    insight: 'Best next move: audit controller zones and leaks before ripping out plants.'
  },
  leak: {
    label: 'Possible leak clue',
    title: 'A quiet baseline creep deserves a dye test.',
    metric: '192 GPD',
    helper: 'Example pattern: winter usage stays higher than expected, which can point to fixtures or toilets.',
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
    <md-icon>${item.icon}</md-icon>
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
          <span class="brand-mark"><md-icon>water_drop</md-icon></span>
          <span><strong>Mud Buddy</strong><small>by Danno</small></span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#how">How it works</a>
          <a href="#resources">Official resources</a>
          <a href="#privacy">Privacy</a>
          <a href="#install">Power users</a>
        </nav>
        <md-filled-button href="sample-report/index.html" target="_blank">Example report</md-filled-button>
      </header>

      <main id="top">
        <section class="hero shell">
          <div class="hero-copy reveal">
            <h1>Find out what changed in your water use.</h1>
            <p class="lede">Mud Buddy turns your EBMUD usage export into a private, plain-English report about high bills, irrigation season, baseline creep, family changes, possible leak clues, and what to check next.</p>
            <div class="hero-actions">
              <md-filled-button href="sample-report/index.html" target="_blank">See example report</md-filled-button>
              <md-outlined-button href="#install">Create my private report</md-outlined-button>
              <md-text-button href="#how">How to get your EBMUD CSV</md-text-button>
            </div>
            <div class="trust-row" aria-label="Trust promises">
              <span><md-icon>verified_user</md-icon>Free to use</span>
              <span><md-icon>computer</md-icon>Runs locally</span>
              <span><md-icon>lock</md-icon>You control the CSV</span>
              <span><md-icon>password</md-icon>No password needed</span>
            </div>
            <div class="question-cards" aria-label="Homeowner questions Mud Buddy helps answer">
              <article><md-icon>receipt_long</md-icon><strong>My bill jumped.</strong><span>Was it one period, a new baseline, or outdoor use?</span></article>
              <article><md-icon>yard</md-icon><strong>My yard is thirsty.</strong><span>How much looks like irrigation season?</span></article>
              <article><md-icon>wc</md-icon><strong>We flush a lot.</strong><span>What does normal household use look like now?</span></article>
              <article><md-icon>plumbing</md-icon><strong>Could it be a leak?</strong><span>Which patterns deserve a meter or toilet dye check?</span></article>
            </div>
            <img class="hero-art visual-asset" src="assets/hero-civic-water.svg" alt="Synthetic civic water dashboard illustration" loading="eager" />
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
              <h2>From confusing CSV to homeowner clarity.</h2>
              <p>Download your EBMUD usage CSV, run Mud Buddy locally, and get a scrollable visual report that separates household baseline, yard watering lift, peer benchmarks, unusual periods, and practical next checks.</p>
              <p class="official-line">Mud Buddy helps interpret your exported CSV; official account, billing, emergency, rebate, and conservation actions happen on EBMUD's site.</p>
            </div>
            <div class="workflow-panel material-card">
              <img class="workflow-art visual-asset" src="assets/workflow-csv-report.svg" alt="Synthetic CSV to report workflow" loading="lazy" />
              <div class="steps">
                <article><md-icon>download</md-icon><span>Get your CSV</span><p>You log into EBMUD yourself and download the official usage export from Track Usage.</p></article>
                <article><md-icon>analytics</md-icon><span>Read the pattern</span><p>Mud Buddy processes only the CSV you explicitly provide and explains the drivers in plain English.</p></article>
                <article><md-icon>task_alt</md-icon><span>Check next</span><p>Use the report to decide whether to inspect irrigation, fixtures, toilets, or an official EBMUD resource.</p></article>
              </div>
            </div>
          </div>
        </section>

        <section class="shell sample-section" id="how">
          <div class="section-head">
            <h2>See what a homeowner report looks like.</h2>
            <p>Preview the output style with public-safe sample data: timelines, baseline clues, seasonal lift, year-over-year change, and simple next checks.</p>
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
          <article class="material-card"><md-icon>query_stats</md-icon><h3>High-bill clues</h3><p>See whether a jump is isolated, seasonal, or part of a persistent baseline change.</p></article>
          <article class="material-card"><md-icon>yard</md-icon><h3>Irrigation context</h3><p>Understand yard watering as plant health, controller behavior, and gallons per day, not just guilt.</p></article>
          <article class="material-card"><md-icon>plumbing</md-icon><h3>Fixture checks</h3><p>Spot patterns worth checking with toilet dye tests, a meter test, or an irrigation walk-through.</p></article>
          <article class="material-card"><md-icon>support_agent</md-icon><h3>Optional agent assist</h3><p>Power users can ask Codex or Claude Code to help after manual login and explicit CSV approval.</p></article>
        </section>

        <section class="resource-band" id="resources">
          <div class="shell resource-layout">
            <div class="resource-copy">
              <h2>Official EBMUD resources, right where the questions show up.</h2>
              <p>Mud Buddy is a private interpretation layer. When the next step is official, urgent, billing-related, pressure/outage-related, water-quality-related, rebate, or assistance related, use EBMUD's public customer resources.</p>
              <img class="resource-art visual-asset" src="assets/ebmud-resource-directory.svg" alt="Synthetic official EBMUD resource directory illustration" loading="lazy" />
            </div>
            <div class="resource-grid" aria-label="Official EBMUD resources">
              ${resourceCards}
            </div>
          </div>
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
              <img class="privacy-art visual-asset" src="assets/privacy-local-first.svg" alt="Synthetic local-first privacy illustration" loading="lazy" />
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
            <h2>Create your private report, or use the AI-agent workflow.</h2>
            <p>Homeowners can run one local command against an EBMUD CSV. Power users can install the ebmud-buddy skill so Codex or Claude Code can guide the manual-login, CSV-download, local-analysis workflow.</p>
          </div>
          <div class="terminal-card material-card">
            <div><span></span><span></span><span></span></div>
            <pre><code>$ python scripts/generate_report.py "path/to/your-ebmud-export.csv" --out "my-water-report"
$ python scripts/generate_report.py "path/to/your-ebmud-export.csv" --out "my-public-report" --public
$skill-installer install https://github.com/danieloleary/mud-buddy/tree/main/skills/ebmud-buddy</code></pre>
          </div>
        </section>
      </main>

      <footer>
        <div class="shell footer-grid">
          <p><strong>Mud Buddy by Danno</strong><br />A local-first water report skill for EBMUD exports.</p>
          <p>Not affiliated with EBMUD. Not a formal water audit, leak detector, plumbing inspection, billing tool, or official utility analysis. Official account, billing, emergency, rebate, conservation, outage, pressure, assistance, and water-quality actions happen on EBMUD's site.</p>
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
