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
if (!suppliedUrl) {
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4180'], { stdio: 'ignore' });
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
    'Understand your EBMUD water use without sending your CSV anywhere.',
    'Private browser analyzer',
    'Drop your EBMUD CSV here',
    'Analyze my CSV',
    'Try sample data',
    'My bill jumped.',
    'Help save 1 million gallons this year.',
    'Outdoor watering appears to explain most of the lift.',
    'GPD = gallons/day',
    'No EBMUD password needed',
    'Runs in this browser. Your CSV is not uploaded. Not affiliated with EBMUD.',
    'Official EBMUD resources',
    "Mud Buddy helps interpret your exported CSV; official account, billing, emergency, rebate, and conservation actions happen on EBMUD's site.",
    'Not affiliated with EBMUD'
  ]) {
    if (!text.includes(required)) throw new Error(`Missing required text: ${required}`);
  }
  const assets = [
    'assets/hero-civic-water.webp',
    'assets/workflow-csv-report.svg',
    'assets/csv-export-boundary.svg',
    'assets/privacy-local-first.svg',
    'assets/ebmud-resource-directory.svg',
    'assets/report-preview-redacted.webp',
    'assets/irrigation-season-story.webp',
    'assets/leak-check-next-steps.webp',
    'assets/public-sharing-checklist-card.svg',
    'assets/ai-agent-safe-handoff.svg'
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
  if ((await page.locator('md-ripple').count()) < 11) throw new Error('Expected Material ripples on resource cards');
  if ((await page.locator('md-divider').count()) < 2) throw new Error('Expected rendered Material dividers');
  if ((await page.locator('md-filled-tonal-button').count()) < 2) throw new Error('Expected Material filled tonal buttons');
  if ((await page.locator('#csvInput').count()) !== 1) throw new Error('Expected browser-local CSV file input');
  await page.getByText('Try sample data').first().click();
  await page.getByText('Your private browser report is ready.').waitFor({ timeout: 6000 });
  if (!(await page.locator('.browser-report').isVisible())) throw new Error('Sample browser report did not render');
  if ((await page.locator('[data-testid="primary-kpis"]').count()) !== 1) throw new Error('Sample browser report missing primary KPI section');
  await page.locator('md-checkbox').first().click();
  await page.getByText('Reset checklist').click();
  const progressValue = Number(await page.locator('#shareProgress').evaluate((node) => node.value));
  if (progressValue !== 0) throw new Error('Checklist reset did not return progress to zero');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
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
  console.log('landing-smoke: OK desktop/mobile visuals, resources, and Material interaction passed');
} finally {
  if (server) server.kill();
}


