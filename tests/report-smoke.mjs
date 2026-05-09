import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const suppliedUrl = process.env.MUD_BUDDY_REPORT_URL;
const url = suppliedUrl || 'file://' + path.join(root, 'public-site', 'sample-report', 'index.html').replaceAll('\\', '/');

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto(url);
  const body = await page.locator('body').innerText();
  for (const required of ['not affiliated with EBMUD', 'Excluded invalid rows: 1', 'Public anonymized summary']) {
    if (!body.toLowerCase().includes(required.toLowerCase())) throw new Error(`Sample report missing: ${required}`);
  }
  if (/PRIVATE_ADDRESS_SENTINEL|PRIVATE_ACCOUNT_SENTINEL|C:\\Users\\|Billing Usage/.test(body)) throw new Error('Sample report contains forbidden private string');
  const imageCount = await page.locator('img').count();
  if (imageCount < 5) throw new Error(`Expected 5 report SVGs, found ${imageCount}`);
  const unloaded = await page.$$eval('img', (imgs) => imgs.filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.getAttribute('src')));
  if (unloaded.length) throw new Error(`Report images did not load: ${unloaded.join(', ')}`);
  if (errors.length) throw new Error('Console errors: ' + errors.join('\n'));
  console.log('report-smoke: OK sample report loads, images render, disclaimer present');
} finally {
  await browser.close();
}
