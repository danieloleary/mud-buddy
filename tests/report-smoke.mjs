import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const report = path.join(root, 'public-site', 'sample-report', 'index.html');
const requiredVisuals = ['01_timeline.svg', '02_driver_stack.svg', '03_seasonality.svg', '04_year_over_year.svg', '05_context.svg'];
await fs.access(report);
for (const visual of requiredVisuals) await fs.access(path.join(path.dirname(report), visual));
const html = await fs.readFile(report, 'utf8');
for (const required of ['Mud Buddy', 'Not affiliated with EBMUD', 'Public anonymized summary', 'Excluded invalid rows: 1']) {
  if (!html.includes(required)) throw new Error(`sample report missing required text: ${required}`);
}
for (const forbidden of [/PRIVATE_/i, /Billing Usage/i, /C:\\Users\\/i, /\b\d{10,}\b/]) {
  if (forbidden.test(html)) throw new Error(`sample report leaked forbidden pattern: ${forbidden}`);
}
for (const href of [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((m) => m[1])) {
  if (href.startsWith('/')) throw new Error(`sample report has root-relative asset/link: ${href}`);
  if (/^https?:\/\//.test(href) && !href.startsWith('https://www.ebmud.com/')) throw new Error(`sample report has unexpected external URL: ${href}`);
}
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto('file://' + report.replace(/\\/g, '/'));
  const images = await page.locator('img').count();
  if (images !== requiredVisuals.length) throw new Error(`expected ${requiredVisuals.length} report images, found ${images}`);
  for (const visual of requiredVisuals) {
    const img = page.locator(`img[src="${visual}"]`).first();
    if ((await img.count()) !== 1) throw new Error(`missing report image: ${visual}`);
    if (!(await img.evaluate((node) => node.complete && node.naturalWidth > 0))) throw new Error(`report image failed to load: ${visual}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  if (!(await page.getByText('Public anonymized summary').first().isVisible())) throw new Error('mobile report public label not visible');
  if (errors.length) throw new Error('Console errors: ' + errors.join('\n'));
} finally {
  await browser.close();
}
console.log('report-smoke: OK sample report loads, required SVGs render, links are safe, and mobile label is visible');