import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const suppliedUrl = process.env.MUD_BUDDY_URL;
const url = suppliedUrl || 'http://127.0.0.1:4180/';
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

async function assertNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 2) throw new Error(`${label} has horizontal overflow of ${overflow}px`);
}

async function assertBoxInsideViewport(page, selector, label) {
  const box = await page.locator(selector).first().boundingBox();
  const viewport = page.viewportSize();
  if (!box || !viewport) throw new Error(`${label} is missing from the rendered page`);
  if (box.x < -1 || box.y < -1 || box.x + box.width > viewport.width + 1 || box.y + box.height > viewport.height + 1) {
    throw new Error(`${label} is clipped or outside first viewport: ${JSON.stringify({ box, viewport })}`);
  }
}

if (!suppliedUrl) {
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4180'], { stdio: 'ignore' });
  await waitFor(url);
}
try {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto(url);
  if (!/Mud Buddy/.test(await page.title())) throw new Error('Missing Mud Buddy page title');
  const brandText = await page.locator('.brand').innerText();
  if (!brandText.includes('for EBMUD customers')) throw new Error(`Topbar brand did not use customer-safe wording: ${brandText}`);
  if (brandText.includes("by Dan O'Leary") || brandText.includes('for EBMUD -')) throw new Error(`Topbar brand implies attribution or affiliation too strongly: ${brandText}`);
  await assertNoHorizontalOverflow(page, 'desktop landing');
  await assertBoxInsideViewport(page, 'h1', 'desktop hero headline');
  await assertBoxInsideViewport(page, '.landing-visual', 'desktop landing visual');
  if ((await page.locator('.brand-mark svg').count()) !== 1) throw new Error('Brand mark SVG did not render');
  const brandMarkText = (await page.locator('.brand-mark').textContent())?.trim() || '';
  if (brandMarkText) throw new Error(`Brand mark leaked fallback text: ${brandMarkText}`);
  if ((await page.locator('.landing-visual img[src$="mud-buddy-kawaii-mascot.webp"]').count()) !== 1) throw new Error('Kawaii Mud Buddy mascot image did not render');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  await assertNoHorizontalOverflow(page, 'mobile landing');
  await assertBoxInsideViewport(page, 'h1', 'mobile hero headline');
  await page.getByRole('button', { name: 'Analyze my usage' }).click();
  await page.locator('.upload-card').scrollIntoViewIfNeeded();
  if (!(await page.locator('.upload-card').isVisible())) throw new Error('Mobile upload card is not reachable');

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(url);
  const text = await page.locator('body').innerText();
  for (const required of [
    'Learn where your water bill is leaking money.',
    'for EBMUD customers',
    'Upload your EBMUD usage data.',
    'Find savings in 30 seconds',
    'Drop your EBMUD usage data here',
    'Find savings in 30 seconds',
    'Try sample report',
    'How to get the file',
    'Getting the file usually takes about 3 minutes.',
    'This will not change your EBMUD account.',
    'Show me the steps',
    'Built with love in Lafayette, CA.',
    'Goal: help neighbors save money and millions of gallons, one home at a time.',
    'Runs in this browser. Your usage file is not uploaded, stored, or added to the URL. Not affiliated with EBMUD.',
    'Official EBMUD resources',
    "Mud Buddy explains your usage file. EBMUD handles billing, emergencies, rebates, outages, pressure, assistance, and water quality.",
    'Not affiliated with EBMUD'
  ]) {
    if (!text.includes(required)) throw new Error(`Missing required text: ${required}`);
  }
  await page.getByText('How to get the file').click();
  if (!(await page.getByText('How to get your EBMUD usage file').isVisible())) throw new Error('Usage file guide dialog did not open');
  if (!(await page.getByText('You do not need to understand the file.').isVisible())) throw new Error('Usage file guide is not spouse-proof');
  await page.getByRole('button', { name: 'Close' }).click();
  for (const clutter of ['For EBMUD review', 'Independent today', 'Download project ZIP', 'synthetic flavors', 'release gate']) {
    if (text.toLowerCase().includes(clutter.toLowerCase())) throw new Error(`Landing still exposes clutter text: ${clutter}`);
  }
  if ((await page.locator('md-assist-chip[label="No EBMUD login needed"]').count()) !== 1) throw new Error('Missing trust chip for no EBMUD login');
  if ((await page.locator('md-assist-chip[label="Private in your browser"]').count()) !== 1) throw new Error('Missing trust chip for private browser analysis');
  for (const iconToken of ['computer', 'cloud_off', 'key_off', 'receipt_long', 'upload_file', 'verified_user']) {
    if (text.includes(iconToken)) throw new Error(`Landing body text leaked decorative icon token: ${iconToken}`);
  }
  const resourceLinks = await page.$$eval('.resource-card', (anchors) => anchors.map((a) => a.href));
  if (resourceLinks.length < 6) throw new Error(`Expected compact official resource links, found ${resourceLinks.length}`);
  for (const href of resourceLinks) {
    if (!href.startsWith('https://www.ebmud.com/')) throw new Error(`Official resource link is not a public EBMUD URL: ${href}`);
  }
  if ((await page.locator('#csvInput').count()) !== 1) throw new Error('Expected browser-local usage file input');
  await page.getByRole('button', { name: 'Try sample report' }).first().click();
  await page.getByRole('heading', { name: 'Report ready.' }).waitFor({ timeout: 6000 });
  if (!(await page.locator('.browser-report').isVisible())) throw new Error('Sample browser report did not render');
  const reportText = await page.locator('[data-testid="browser-report"]').innerText();
  const reportTextLower = reportText.toLowerCase();
  for (const required of ['Start here', 'Recommended next checks', 'This weekend', 'Key numbers', 'Water use over time', 'Usage file notes', 'When to use EBMUD directly', 'Print or save PDF']) {
    if (!reportTextLower.includes(required.toLowerCase())) throw new Error(`Sample browser report missing section: ${required}`);
  }
  if (!reportTextLower.includes('average-household benchmark in your usage file')) throw new Error('Sample browser report missing softened benchmark wording');
  if (!reportTextLower.includes('confidence and method')) throw new Error('Sample browser report missing compact confidence/method details');
  if (reportText.includes('Compared with similar homes')) throw new Error('Sample browser report still uses similar-homes wording');
  const links = await page.$$eval('a[href]', (anchors) => anchors.map((a) => a.getAttribute('href')));
  for (const href of links) {
    if (href && href.startsWith('/')) throw new Error(`Root-relative link is not Pages-safe: ${href}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileAnalyzeAgain = page.locator('[data-testid="analyze-another"]');
  await mobileAnalyzeAgain.scrollIntoViewIfNeeded();
  if (!(await mobileAnalyzeAgain.isVisible())) throw new Error('Mobile analyze-another CTA not visible');
  await browser.close();
  if (errors.length) throw new Error('Console errors: ' + errors.join('\n'));
  console.log('landing-smoke: OK simplified Material app surface passed desktop/mobile/sample checks');
} finally {
  if (server) server.kill();
}
