import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'tests', 'output', 'browser-golden-e2e');
const sampleCsv = path.join(root, 'examples', 'sample-ebmud-usage.csv');
const syntheticDir = path.join(root, 'tests', 'output', 'synthetic-flavors');
const syntheticCsv = path.join(syntheticDir, 'irrigation-summer-heavy.csv');
const scenarioCsvs = [
  'irrigation-summer-heavy.csv',
  'possible-toilet-leak.csv',
  'usage-drop-conservation.csv',
  'flatline-meter-check.csv'
];
const url = 'http://127.0.0.1:4189/';

await fs.mkdir(outDir, { recursive: true });

try {
  await fs.access(syntheticCsv);
} catch {
  await new Promise((resolve, reject) => {
    const child = spawn(process.env.PYTHON || 'python', ['scripts/generate_synthetic_flavors.py'], { cwd: root, stdio: 'inherit' });
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`generate_synthetic_flavors exited ${code}`)));
  });
}

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4189'], { stdio: 'ignore' });

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

try {
  await waitFor(url);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto(url);
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}.topbar{position:static!important}' });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(outDir, 'desktop-landing.png'), fullPage: false });

  await page.locator('#csvInput').setInputFiles(sampleCsv);
  await page.getByText('Your private browser report is ready.').waitFor({ timeout: 6000 });
  await page.screenshot({ path: path.join(outDir, 'desktop-sample-upload-report.png'), fullPage: false });
  await page.locator('[data-testid="browser-report"]').screenshot({ path: path.join(outDir, 'desktop-sample-full-report.png') });

  let reportText = await page.locator('[data-testid="browser-report"]').innerText();
  let reportTextLower = reportText.toLowerCase();
  for (const required of ['What should I check first?', 'Normal daily use estimate', 'Likely outdoor watering', 'Water use over time']) {
    if (!reportTextLower.includes(required.toLowerCase())) throw new Error(`Golden sample report missing: ${required}`);
  }

  await page.locator('#csvInput').setInputFiles(syntheticCsv);
  await page.waitForFunction(() => document.querySelector('[data-testid="browser-report"]')?.textContent?.includes('Uploaded CSV analyzed locally'), null, { timeout: 6000 });
  reportText = await page.locator('[data-testid="browser-report"]').innerText();
  reportTextLower = reportText.toLowerCase();
  if (!reportTextLower.includes('Uploaded CSV analyzed locally'.toLowerCase())) throw new Error('Synthetic upload did not render uploaded-source label');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-testid="analyze-another"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(outDir, 'mobile-synthetic-upload-report.png'), fullPage: false });
  await page.locator('[data-testid="browser-report"]').screenshot({ path: path.join(outDir, 'mobile-synthetic-full-report.png') });

  await page.setViewportSize({ width: 1280, height: 900 });
  for (const scenario of scenarioCsvs) {
    const scenarioPath = path.join(syntheticDir, scenario);
    const scenarioName = scenario.replace(/\.csv$/i, '');
    await page.locator('#csvInput').setInputFiles(scenarioPath);
    await page.waitForFunction(() => document.querySelector('[data-testid="browser-report"]')?.textContent?.includes('Uploaded CSV analyzed locally'), null, { timeout: 6000 });
    const scenarioText = await page.locator('[data-testid="browser-report"]').innerText();
    for (const required of ['What should I check first?', 'Normal daily use estimate', 'Likely outdoor watering', 'Water use over time']) {
      if (!scenarioText.toLowerCase().includes(required.toLowerCase())) throw new Error(`${scenarioName} report missing: ${required}`);
    }
    await page.locator('[data-testid="browser-report"]').screenshot({ path: path.join(outDir, `scenario-${scenarioName}-full-report.png`) });
  }

  if (errors.length) throw new Error(`Console errors:\n${errors.join('\n')}`);
  await browser.close();
  console.log(`browser-golden-e2e: OK desktop/mobile and ${scenarioCsvs.length} synthetic scenario report screenshots captured`);
} finally {
  server.kill();
}
