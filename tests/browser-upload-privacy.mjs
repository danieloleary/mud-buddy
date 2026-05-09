import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const fixtureDir = path.join(root, 'tests', 'output', 'browser-upload-privacy');
const privateName = 'Billing Usage for 999999999999.csv';
const privatePath = path.join(fixtureDir, privateName);
await fs.rm(fixtureDir, { recursive: true, force: true });
await fs.mkdir(fixtureDir, { recursive: true });
await fs.writeFile(privatePath, `Account Number,Reading Date,Days in Read Period,Meter Reading,CCF,Customer GPD,Average Households GPD,Top 20% GPD,WaterScore,Meter Class,Meter
999999999999,2025-01-30,30,,6.4,160,145,90,Average,SFR,MTR-PRIVATE-777
999999999999,2025-03-01,30,,7.1,177,150,92,Average,SFR,MTR-PRIVATE-777
999999999999,2025-07-30,30,,14.2,354,260,150,High,SFR,MTR-PRIVATE-777
`, 'utf8');

const url = 'http://127.0.0.1:4182/';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4182'], { stdio: 'ignore' });

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
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(url);
  await page.locator('#csvInput').setInputFiles(privatePath);
  await page.getByText('Your private browser report is ready.').waitFor({ timeout: 6000 });
  const body = await page.locator('body').innerText();
  for (const forbidden of ['999999999999', 'MTR-PRIVATE-777', privateName, privatePath, 'Account Number,Reading Date']) {
    if (body.includes(forbidden)) throw new Error(`Browser upload leaked private value: ${forbidden}`);
  }
  if (!body.toLowerCase().includes('uploaded csv analyzed locally')) throw new Error('Browser report should use generic source label');
  await browser.close();
  console.log('browser-upload-privacy: OK browser report hides account, meter, filename, raw rows, and local paths');
} finally {
  server.kill();
}

