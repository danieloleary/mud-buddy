import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'tests', 'output', 'browser-upload-errors');
await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });

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

async function writeFixture(name, text) {
  const file = path.join(out, name);
  await fs.writeFile(file, text, 'utf8');
  return file;
}

const valid = path.join(root, 'examples', 'sample-ebmud-usage.csv');
const empty = await writeFixture('empty.csv', '');
const missing = await writeFixture('missing.csv', 'Reading Date,CCF\n2026-01-01,6\n');
const allInvalid = await writeFixture('all-invalid.csv', 'Reading Date,Days in Read Period,CCF,Customer GPD\n2026-01-01,30,N/A,N/A\n');
const allZero = await writeFixture('all-zero.csv', 'Reading Date,Days in Read Period,CCF,Customer GPD\n2026-01-01,30,0,0\n2026-02-01,30,0,0\n');
const wrongType = await writeFixture('usage.txt', 'not a csv');
const quoted = await writeFixture('quoted.csv', '\uFEFFAccount Number,Reading Date,Days in Read Period,Meter Reading,CCF,Customer GPD,Average Households GPD,Top 20% GPD,WaterScore,Meter Class,Meter\nPUBLIC-SAMPLE,2026-01-01,30,,"6.5","162","150","90","average","SFR","MTR,QUOTED"\nPUBLIC-SAMPLE,2026-02-01,30,,N/A,N/A,150,90,average,SFR,"MTR,QUOTED"\nPUBLIC-SAMPLE,2026-03-01,30,,7,175,152,91,average,SFR,"MTR,QUOTED"\n');
const tooLarge = await writeFixture('too-large.csv', `Reading Date,Days in Read Period,CCF,Customer GPD\n2026-01-01,30,6,150\n${' '.repeat(5 * 1024 * 1024)}\n`);
const tooManyRows = await writeFixture('too-many-rows.csv', `Reading Date,Days in Read Period,CCF,Customer GPD\n${Array.from({ length: 5001 }, (_, index) => index % 2 === 0 ? `2026-01-${String((index % 28) + 1).padStart(2, '0')},30,6,150` : `not-a-date,0,0x10,-150`).join('\n')}\n`);

const url = 'http://127.0.0.1:4185/';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4185'], { stdio: 'ignore' });

async function expectStatus(page, contains) {
  await page.waitForFunction((text) => document.querySelector('#uploadStatus')?.textContent?.includes(text), contains, { timeout: 6000 });
}

try {
  await waitFor(url);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  await page.goto(url);
  await page.locator('#csvInput').setInputFiles(wrongType);
  await expectStatus(page, 'does not look like EBMUD usage data');
  await page.locator('#csvInput').setInputFiles(empty);
  await expectStatus(page, 'does not include enough rows');
  await page.locator('#csvInput').setInputFiles(missing);
  await expectStatus(page, 'Missing required EBMUD column');
  await page.locator('#csvInput').setInputFiles(allInvalid);
  await expectStatus(page, 'No valid EBMUD usage rows');
  await page.locator('#csvInput').setInputFiles(allZero);
  await expectStatus(page, 'No positive water usage values');
  await page.locator('#csvInput').setInputFiles(tooLarge);
  await expectStatus(page, 'too large');
  await page.locator('#csvInput').setInputFiles(tooManyRows);
  await expectStatus(page, 'too many rows');
  await page.locator('#csvInput').setInputFiles(quoted);
  await page.getByRole('heading', { name: 'Your water-saving briefing is ready.' }).waitFor({ timeout: 6000 });
  let reportText = await page.locator('[data-testid="browser-report"]').innerText();
  if (!reportText.toLowerCase().includes('row skipped') || !reportText.includes('1')) throw new Error('Quoted/N/A fixture did not render invalid-row note');

  const validText = await fs.readFile(valid, 'utf8');
  const dataTransfer = await page.evaluateHandle((text) => {
    const transfer = new DataTransfer();
    transfer.items.add(new File([text], 'sample-ebmud-usage.csv', { type: 'text/csv' }));
    return transfer;
  }, validText);
  await page.dispatchEvent('#dropzone', 'drop', { dataTransfer });
  await page.waitForFunction(() => document.querySelector('[data-testid="browser-report"]')?.textContent?.includes('Normal daily use estimate'), null, { timeout: 6000 });
  reportText = await page.locator('[data-testid="browser-report"]').innerText();
  if (!reportText.toLowerCase().includes('usage file analyzed locally')) throw new Error('Drag/drop valid usage file did not recover to uploaded report');
  await browser.close();
  console.log('browser-upload-dragdrop-and-errors: OK drag/drop, invalid inputs, limits, quoted usage file, N/A, and recovery');
} finally {
  server.kill();
}
