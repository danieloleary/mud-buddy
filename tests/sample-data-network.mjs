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
    window.__mudBuddyPrivacyEvents = [];
    const record = (kind, detail = '') => window.__mudBuddyPrivacyEvents.push(`${kind}:${detail}`);
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function patchedSetItem(key, value) {
      record('storage', key);
      return originalSetItem.call(this, key, value);
    };
    const originalBeacon = navigator.sendBeacon?.bind(navigator);
    if (originalBeacon) {
      navigator.sendBeacon = (...args) => {
        record('beacon', String(args[0]));
        return originalBeacon(...args);
      };
    }
    for (const name of ['WebSocket', 'EventSource', 'Worker']) {
      const Original = window[name];
      if (Original) {
        window[name] = function patchedConstructor(...args) {
          record(name, String(args[0]));
          return new Original(...args);
        };
      }
    }
  });

  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.getByText('Try sample report').first().click();
  await page.getByRole('heading', { name: 'Your water-saving map is ready.' }).waitFor({ timeout: 6000 });

  const sampleRequests = requests.filter((requestUrl) => {
    const parsed = new URL(requestUrl);
    return parsed.origin === new URL(url).origin && parsed.pathname === '/examples/sample-ebmud-usage.csv';
  });
  const appOrigin = new URL(url).origin;
  const allowedSameOriginAfterClick = (requestUrl) => {
    const parsed = new URL(requestUrl);
    return parsed.origin === appOrigin && (
      parsed.pathname === '/examples/sample-ebmud-usage.csv' ||
      parsed.pathname.startsWith('/assets/')
    );
  };
  const unexpected = requests.filter((requestUrl) => (
    !requestUrl.startsWith('data:') &&
    !requestUrl.startsWith('blob:') &&
    !allowedSameOriginAfterClick(requestUrl)
  ));
  if (sampleRequests.length !== 1) throw new Error(`Expected exactly one sample usage file fetch, found ${sampleRequests.length}`);
  if (unexpected.length) throw new Error(`Unexpected network request after sample button:\n${unexpected.join('\n')}`);

  const privacyEvents = await page.evaluate(() => window.__mudBuddyPrivacyEvents || []);
  if (privacyEvents.length) throw new Error(`Sample data path used forbidden APIs:\n${privacyEvents.join('\n')}`);

  await browser.close();
  console.log('sample-data-network: OK sample button fetched one local synthetic usage file, allowed only same-origin assets, and wrote no storage');
} finally {
  server.kill();
}
