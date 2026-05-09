import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const suppliedUrl = process.env.MUD_BUDDY_URL;
const url = suppliedUrl || 'http://127.0.0.1:4173/';
let server;
async function waitFor(target, tries = 80) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(target);
      if (res.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${target}`);
}
if (!suppliedUrl) {
  server = process.platform === 'win32'
    ? spawn('cmd.exe', ['/c', 'npx vite preview --host 127.0.0.1 --port 4173'], { stdio: 'ignore' })
    : spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4173'], { stdio: 'ignore' });
  await waitFor(url);
}
try {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto(url);
  if (!/Mud Buddy/.test(await page.title())) throw new Error('Missing Mud Buddy page title');
  await page.getByText('Irrigation', { exact: true }).click();
  const text = await page.locator('body').innerText();
  for (const required of [
    'Find out what changed in your water use.',
    'My bill jumped.',
    'The yard is doing most of the talking.',
    'No password needed',
    'Official EBMUD resources',
    "Mud Buddy helps interpret your exported CSV; official account, billing, emergency, rebate, and conservation actions happen on EBMUD's site.",
    'Not affiliated with EBMUD'
  ]) {
    if (!text.includes(required)) throw new Error(`Missing required text: ${required}`);
  }
  const assets = [
    'assets/hero-civic-water.svg',
    'assets/workflow-csv-report.svg',
    'assets/privacy-local-first.svg',
    'assets/ebmud-resource-directory.svg'
  ];
  for (const asset of assets) {
    const image = page.locator(`img[src="${asset}"]`).first();
    if ((await image.count()) !== 1) throw new Error(`Missing image tag for ${asset}`);
    await image.scrollIntoViewIfNeeded();
    const handle = await image.elementHandle();
    if (!handle) throw new Error(`Missing image element handle for ${asset}`);
    await page.waitForFunction((img) => img.complete && img.naturalWidth > 0, handle);
  }
  const resourceLinks = await page.$$eval('.resource-card', (anchors) => anchors.map((a) => a.href));
  if (resourceLinks.length < 11) throw new Error(`Expected at least 11 official resource links, found ${resourceLinks.length}`);
  for (const href of resourceLinks) {
    if (!href.startsWith('https://www.ebmud.com/')) throw new Error(`Official resource link is not a public EBMUD URL: ${href}`);
  }
  const links = await page.$$eval('a[href]', (anchors) => anchors.map((a) => a.getAttribute('href')));
  for (const href of links) {
    if (href && href.startsWith('/')) throw new Error(`Root-relative link is not Pages-safe: ${href}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  if (!(await page.getByText('Create my private report').first().isVisible())) throw new Error('Mobile CTA not visible');
  await browser.close();
  if (errors.length) throw new Error('Console errors: ' + errors.join('\n'));
  console.log('landing-smoke: OK desktop/mobile visuals, resources, and Material interaction passed');
} finally {
  if (server) server.kill();
}
