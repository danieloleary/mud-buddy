import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const url = 'http://127.0.0.1:4183/';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4183'], { stdio: 'ignore' });

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
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.locator('#csvInput').setInputFiles(path.join(root, 'examples', 'sample-ebmud-usage.csv'));
  await page.getByRole('heading', { name: 'Report ready.' }).waitFor({ timeout: 6000 });
  const unexpected = requests.filter((requestUrl) => !requestUrl.startsWith('data:') && !requestUrl.startsWith('blob:'));
  if (unexpected.length) throw new Error(`Unexpected network request after upload:\n${unexpected.join('\n')}`);
  await browser.close();
  console.log('browser-upload-network: OK uploaded CSV analysis made no network requests after file selection');
} finally {
  server.kill();
}

