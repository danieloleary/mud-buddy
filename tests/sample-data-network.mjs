import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const url = 'http://127.0.0.1:4187/';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4187'], { stdio: 'ignore' });

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
  await page.waitForLoadState('networkidle');

  await page.evaluate(() => {
    window.__mudBuddyStorageWrites = 0;
    for (const store of [window.localStorage, window.sessionStorage]) {
      const originalSetItem = store.setItem.bind(store);
      store.setItem = (...args) => {
        window.__mudBuddyStorageWrites += 1;
        return originalSetItem(...args);
      };
    }
  });

  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.getByText('Try sample data').first().click();
  await page.getByText('Your private browser report is ready.').waitFor({ timeout: 6000 });

  const sampleRequests = requests.filter((requestUrl) => requestUrl.includes('/examples/sample-ebmud-usage.csv'));
  const unexpected = requests.filter((requestUrl) => (
    !requestUrl.startsWith('data:') &&
    !requestUrl.startsWith('blob:') &&
    !requestUrl.includes('/examples/sample-ebmud-usage.csv')
  ));
  if (sampleRequests.length !== 1) throw new Error(`Expected exactly one sample CSV fetch, found ${sampleRequests.length}`);
  if (unexpected.length) throw new Error(`Unexpected network request after sample button:\n${unexpected.join('\n')}`);

  const storageWrites = await page.evaluate(() => window.__mudBuddyStorageWrites || 0);
  if (storageWrites !== 0) throw new Error(`Sample data path wrote to browser storage ${storageWrites} time(s)`);

  await browser.close();
  console.log('sample-data-network: OK sample button fetched only the local synthetic CSV and wrote no storage');
} finally {
  server.kill();
}
