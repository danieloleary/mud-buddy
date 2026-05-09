import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'tests', 'output', 'browser-upload-hardened-privacy');
await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });
const privateName = 'Billing Usage for 999999999999.csv';
const privatePath = path.join(out, privateName);
const rawRow = '999999999999,2025-07-30,30,,14.2,354,260,150,High,SFR,MTR-PRIVATE-777';
await fs.writeFile(privatePath, `Account Number,Reading Date,Days in Read Period,Meter Reading,CCF,Customer GPD,Average Households GPD,Top 20% GPD,WaterScore,Meter Class,Meter
999999999999,2025-01-30,30,,6.4,160,145,90,Average,SFR,MTR-PRIVATE-777
999999999999,2025-03-01,30,,7.1,177,150,92,Average,SFR,MTR-PRIVATE-777
${rawRow}
`, 'utf8');

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

const url = 'http://127.0.0.1:4186/';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4186'], { stdio: 'ignore' });

try {
  await waitFor(url);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => {
    window.__mudBuddyPrivacyEvents = [];
    const record = (kind, detail = '') => window.__mudBuddyPrivacyEvents.push(`${kind}:${detail}`);
    const originalFetch = window.fetch.bind(window);
    window.fetch = (...args) => { record('fetch', String(args[0])); return originalFetch(...args); };
    const originalBeacon = navigator.sendBeacon?.bind(navigator);
    if (originalBeacon) navigator.sendBeacon = (...args) => { record('beacon', String(args[0])); return originalBeacon(...args); };
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function patchedSetItem(key, value) { record('storage', key); return originalSetItem.call(this, key, value); };
    for (const name of ['WebSocket', 'EventSource', 'Worker']) {
      const Original = window[name];
      if (Original) window[name] = function patchedConstructor(...args) { record(name, String(args[0])); return new Original(...args); };
    }
  });
  await page.locator('#csvInput').setInputFiles(privatePath);
  await page.getByText('Your private browser report is ready.').waitFor({ timeout: 6000 });
  const outer = await page.locator('html').evaluate((node) => node.outerHTML);
  const text = await page.locator('body').innerText();
  const combined = `${outer}\n${text}`;
  for (const forbidden of ['999999999999', 'MTR-PRIVATE-777', privateName, privatePath, rawRow, 'Account Number,Reading Date']) {
    if (combined.includes(forbidden)) throw new Error(`Browser upload leaked private value into DOM/text: ${forbidden}`);
  }
  const events = await page.evaluate(() => window.__mudBuddyPrivacyEvents);
  if (events.length) throw new Error('Browser upload used network/storage APIs after guard installed:\n' + events.join('\n'));
  const storage = await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }));
  if (storage.local || storage.session) throw new Error(`Browser upload wrote browser storage: ${JSON.stringify(storage)}`);
  await browser.close();
  console.log('browser-upload-hardened-privacy: OK full DOM/storage/network privacy guard passed');
} finally {
  server.kill();
}

