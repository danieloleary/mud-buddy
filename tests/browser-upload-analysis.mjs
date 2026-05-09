import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const suppliedUrl = process.env.MUD_BUDDY_URL;
const url = suppliedUrl || 'http://127.0.0.1:4181/';
let server;

async function waitFor(target, tries = 80) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(target);
      if (res.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${target}`);
}

if (!suppliedUrl) {
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4181'], { stdio: 'ignore' });
  await waitFor(url);
}

try {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto(url);
  await page.locator('#csvInput').setInputFiles(path.join(root, 'examples', 'sample-ebmud-usage.csv'));
  await page.getByText('Your private browser report is ready.').waitFor({ timeout: 6000 });
  const body = await page.locator('body').innerText();
  const lowerBody = body.toLowerCase();
  for (const required of [
    'Uploaded CSV analyzed locally',
    'Runs in this browser. Your CSV is not uploaded, stored, or added to the URL. Not affiliated with EBMUD.',
    'CSV notes',
    'Water use over time',
    'Average use by season',
    'This is explanatory pattern-finding'
  ]) {
    if (!lowerBody.includes(required.toLowerCase())) throw new Error(`Missing browser upload text: ${required}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileAnalyzeAgain = page.locator('[data-testid="analyze-another"]');
  await mobileAnalyzeAgain.scrollIntoViewIfNeeded();
  if (!(await mobileAnalyzeAgain.isVisible())) throw new Error('Mobile analyze-another CTA not visible');
  await browser.close();
  if (errors.length) throw new Error('Console errors: ' + errors.join('\n'));
  console.log('browser-upload-analysis: OK uploaded sample CSV renders browser-local report on desktop/mobile');
} finally {
  if (server) server.kill();
}
