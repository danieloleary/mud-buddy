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
  if (brandText.includes("by Dan O'Leary")) throw new Error(`Topbar brand should keep Dan attribution out of the main brand: ${brandText}`);
  if (brandText.includes("for EBMUD - by Dan O'Leary")) throw new Error(`Topbar brand still implies affiliation: ${brandText}`);
  await assertNoHorizontalOverflow(page, 'desktop landing');
  await assertBoxInsideViewport(page, 'h1', 'desktop hero headline');
  await assertBoxInsideViewport(page, '.upload-card', 'desktop upload card');
  if ((await page.locator('.brand-mark svg').count()) !== 1) throw new Error('Brand mark SVG did not render');
  const brandMarkText = (await page.locator('.brand-mark').textContent())?.trim() || '';
  if (brandMarkText) throw new Error(`Brand mark leaked fallback text: ${brandMarkText}`);
  const materialIconFont = await page.locator('.dropzone .icon-glyph').evaluate((el) => getComputedStyle(el, '::before').fontFamily);
  if (!/Material Symbols Rounded/.test(materialIconFont)) throw new Error(`Material icon font was not applied: ${materialIconFont}`);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  await assertNoHorizontalOverflow(page, 'mobile landing');
  await assertBoxInsideViewport(page, 'h1', 'mobile hero headline');
  await page.locator('.upload-card').scrollIntoViewIfNeeded();
  if (!(await page.locator('.upload-card').isVisible())) throw new Error('Mobile upload card is not reachable');

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(url);
  await page.getByText('Irrigation', { exact: true }).click();
  const text = await page.locator('body').innerText();
  for (const required of [
    'Upload your EBMUD usage data. Get beautiful analysis, recommendations, and more.',
    'for EBMUD customers',
    'Browser-local CSV analyzer',
    'Drop your EBMUD usage CSV here',
    'Upload my usage data',
    'Try sample data',
    'high bills, irrigation surprises, fixture checks',
    'Save millions of gallons, one home at a time.',
    'Built with love in Lafayette, CA.',
    'Pattern suggests outdoor watering is driving the lift.',
    'GPD = gallons/day',
    'No EBMUD password needed',
    'Runs in this browser. Your CSV is not uploaded. Not affiliated with EBMUD.',
    'Official EBMUD resources',
    'For EBMUD review',
    'Independent today. Feedback-ready if EBMUD wants to review it.',
    "Mud Buddy helps interpret your exported CSV; official account, billing, emergency, rebate, and conservation actions happen on EBMUD's site.",
    'Not affiliated with EBMUD'
  ]) {
    if (!text.includes(required)) throw new Error(`Missing required text: ${required}`);
  }
  for (const iconToken of ['computer', 'cloud_off', 'key_off', 'receipt_long', 'upload_file', 'verified_user']) {
    if (text.includes(iconToken)) throw new Error(`Landing body text leaked decorative icon token: ${iconToken}`);
  }
  const assets = [
    'assets/hero-civic-water.webp',
    'assets/privacy-local-first.webp',
    'assets/ebmud-resource-directory.webp',
    'assets/report-preview-redacted.webp',
    'assets/irrigation-season-story.webp',
    'assets/leak-check-next-steps.webp'
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
  const reportText = await page.locator('[data-testid="browser-report"]').innerText();
  if (!reportText.includes('When to use EBMUD directly')) throw new Error('Sample browser report missing official EBMUD next-step routing');
  if (!reportText.includes('average-household benchmark in your export')) throw new Error('Sample browser report missing softened benchmark wording');
  if (!reportText.includes('Confidence')) throw new Error('Sample browser report missing confidence labels');
  if (!reportText.includes('Recommended next steps')) throw new Error('Sample browser report missing recommended next steps');
  if (!reportText.includes('How Mud Buddy decides this')) throw new Error('Sample browser report missing methodology explainer');
  if (reportText.includes('Compared with similar homes')) throw new Error('Sample browser report still uses similar-homes wording');
  await page.getByText('Sharing checklist').click();
  if (!page.url().includes('docs/public-sharing-checklist.md')) throw new Error('Sharing checklist link did not navigate to docs');
  await page.goto(url);
  await page.getByText('Try sample data').first().click();
  await page.getByText('Your private browser report is ready.').waitFor({ timeout: 6000 });
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


