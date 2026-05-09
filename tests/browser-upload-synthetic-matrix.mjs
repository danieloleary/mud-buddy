import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { parseEbmudCsv } from '../src/ebmud-csv.js';
import { analyzeWaterUse } from '../src/water-analysis.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const flavorsDir = path.join(root, 'tests', 'output', 'synthetic-flavors');
const manifestPath = path.join(flavorsDir, 'manifest.json');
const py = process.env.PYTHON || 'python';

try {
  await fs.access(manifestPath);
} catch {
  await new Promise((resolve, reject) => {
    const child = spawn(py, ['scripts/generate_synthetic_flavors.py'], { cwd: root, stdio: 'inherit' });
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`generate_synthetic_flavors exited ${code}`)));
  });
}

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

const url = 'http://127.0.0.1:4184/';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4184'], { stdio: 'ignore' });

try {
  await waitFor(url);
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto(url);

  for (const item of manifest.flavors) {
    const csvPath = path.join(flavorsDir, item.file);
    const parsed = parseEbmudCsv(await fs.readFile(csvPath, 'utf8'));
    const expected = analyzeWaterUse(parsed.rows, parsed.invalidRows, parsed.warnings);
    await page.locator('#csvInput').setInputFiles(csvPath);
    await page.waitForFunction(
      ({ baseline }) => document.querySelector('[data-testid="kpi-baseline"]')?.textContent?.includes(`${baseline} GPD`),
      { baseline: expected.baselineGpd },
      { timeout: 8000 }
    );
    const reportText = await page.locator('[data-testid="browser-report"]').innerText();
    for (const required of [
      `${expected.baselineGpd} GPD`,
      `${expected.seasonalLift} GPD`,
      String(expected.validRows),
      String(expected.invalidRows),
      expected.peakPeriod.label,
      expected.insights[0].title
    ]) {
      if (!reportText.includes(required)) throw new Error(`${item.flavor} browser report missing expected value: ${required}`);
    }
  }

  await browser.close();
  if (errors.length) throw new Error('Console errors: ' + errors.join('\n'));
  console.log(`browser-upload-synthetic-matrix: OK ${manifest.flavors.length} synthetic flavors rendered through browser upload`);
} finally {
  server.kill();
}

