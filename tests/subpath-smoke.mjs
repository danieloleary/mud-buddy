import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const site = path.join(root, 'public-site');
let port = 0;
const basePath = '/mud-buddy/';
const mime = new Map([['.html','text/html'],['.js','text/javascript'],['.css','text/css'],['.svg','image/svg+xml'],['.zip','application/zip'],['.md','text/markdown']]);
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    if (!url.pathname.startsWith(basePath)) { res.writeHead(404).end(); return; }
    let rel = decodeURIComponent(url.pathname.slice(basePath.length));
    if (!rel || rel.endsWith('/')) rel += 'index.html';
    const file = path.resolve(site, rel);
    if (!file.startsWith(path.resolve(site))) { res.writeHead(403).end(); return; }
    const data = await fs.readFile(file);
    res.writeHead(200, { 'content-type': mime.get(path.extname(file)) || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});
port = server.address().port;
try {
  const url = `http://127.0.0.1:${port}${basePath}`;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(url);
  const body = await page.locator('body').innerText();
  if (!body.includes('Mud Buddy') || !body.includes('for EBMUD customers')) throw new Error('Subpath landing failed to render product-first brand');
  if (!body.includes('Drop your EBMUD usage data here')) throw new Error('Subpath landing missing browser upload UI');
  if (!body.includes('Official EBMUD resources')) throw new Error('Subpath landing missing official resources section');
  if (!body.includes('Runs in this browser. Your usage file is not uploaded')) throw new Error('Subpath landing missing browser-local privacy proof');
  const links = await page.$$eval('a[href], img[src], script[src], link[href]', (nodes) => nodes.map((node) => node.getAttribute('href') || node.getAttribute('src')).filter(Boolean));
  const internal = new Set(['', 'sample-report/index.html', 'docs/privacy.md', 'docs/browser-control-safety.md', 'docs/ebmud-review-brief.md', 'docs/browser-local-proof.md', 'docs/co-release-proposal.md', 'assets/social-card.svg', 'assets/github-social-card.svg', 'assets/github-social-card.png', 'assets/readme-banner.svg', 'assets/hero-civic-water.svg', 'assets/hero-civic-water.webp', 'assets/mud-buddy-kawaii-mascot.webp', 'assets/workflow-csv-report.svg', 'assets/privacy-local-first.svg', 'assets/privacy-local-first.webp', 'assets/ebmud-resource-directory.svg', 'assets/ebmud-resource-directory.webp', 'assets/report-preview-redacted.svg', 'assets/report-preview-redacted.webp', 'assets/csv-export-boundary.svg', 'assets/public-sharing-checklist-card.svg', 'assets/sample-report-montage.svg', 'assets/sample-report-montage.webp', 'assets/irrigation-season-story.svg', 'assets/irrigation-season-story.webp', 'assets/leak-check-next-steps.svg', 'assets/leak-check-next-steps.webp', 'assets/ai-agent-safe-handoff.svg', 'assets/favicon-32.png', 'assets/apple-touch-icon.png', 'mud-buddy-by-danno.zip']);
  for (const href of links) {
    if (href.startsWith('#')) continue;
    if (href.startsWith('/')) throw new Error(`root-relative subpath link: ${href}`);
    if (/^https?:\/\//.test(href)) {
      if (!href.startsWith('https://www.ebmud.com/') && !href.startsWith('https://github.com/') && !href.startsWith('https://x.com/') && !href.startsWith('https://www.linkedin.com/') && !href.startsWith('https://fonts.googleapis.com') && !href.startsWith('https://fonts.gstatic.com')) throw new Error(`unexpected external link: ${href}`);
      continue;
    }
    internal.add(href.split('#')[0]);
  }
  internal.add('examples/sample-ebmud-usage.csv');
  const reportPage = await browser.newPage({ viewport: { width: 1000, height: 900 } });
  await reportPage.goto(`${url}sample-report/index.html`);
  const reportAssets = await reportPage.$$eval('a[href], img[src], script[src], link[href]', (nodes) => nodes.map((node) => node.getAttribute('href') || node.getAttribute('src')).filter(Boolean));
  for (const href of reportAssets) {
    if (href.startsWith('#')) continue;
    if (href.startsWith('/')) throw new Error(`root-relative sample-report link: ${href}`);
    if (!/^https?:\/\//.test(href)) internal.add(`sample-report/${href.split('#')[0]}`);
  }
  for (const rel of internal) {
    if (!rel || rel.startsWith('mailto:')) continue;
    const response = await fetch(`${url}${rel}`);
    if (!response.ok) throw new Error(`Subpath crawl missing ${rel}: ${response.status}`);
  }
  await browser.close();
  console.log(`subpath-smoke: OK public-site works under /mud-buddy/ and crawled ${internal.size} local assets`);
} finally {
  server.close();
}
