import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

export async function waitFor(target, tries = 80) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(target);
      if (res.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${target}`);
}

export async function startPreview(port) {
  const url = `http://127.0.0.1:${port}/`;
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' });
  await waitFor(url);
  return {
    url,
    stop: () => server.kill()
  };
}

export function captureConsoleErrors(page) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

export function captureRequests(page) {
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  return requests;
}

export async function installPrivacyGuard(page) {
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
}

export async function withBrowserPage(url, options, callback) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage(options);
    await callback(page);
  } finally {
    await browser.close();
  }
}
