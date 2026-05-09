import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const suppliedUrl = process.env.MUD_BUDDY_URL;
const url = suppliedUrl || 'http://127.0.0.1:4173/';
let server;
async function waitFor(target, tries = 80) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(target);
      if (res.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${target}`);
}
if (!suppliedUrl) {
  server = process.platform === 'win32'
    ? spawn('cmd.exe', ['/c', 'npx vite preview --host 127.0.0.1 --port 4173'], { stdio: 'ignore' })
    : spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4173'], { stdio: 'ignore' });
  await waitFor(url);
}
try {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto(url);
  if (!/Mud Buddy/.test(await page.title())) throw new Error('Missing Mud Buddy page title');
  await page.getByText('Irrigation', { exact: true }).click();
  const text = await page.locator('body').innerText();
  for (const required of ['Understand your EBMUD water use in minutes.', 'The yard is doing most of the talking.', 'No password needed', 'Not affiliated with EBMUD']) {
    if (!text.includes(required)) throw new Error(`Missing required text: ${required}`);
  }
  const links = await page.$$eval('a[href]', (anchors) => anchors.map((a) => a.getAttribute('href')));
  for (const href of links) {
    if (href && href.startsWith('/')) throw new Error(`Root-relative link is not Pages-safe: ${href}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  if (!(await page.getByText('Generate a local report').first().isVisible())) throw new Error('Mobile CTA not visible');
  await browser.close();
  if (errors.length) throw new Error('Console errors: ' + errors.join('\n'));
  console.log('landing-smoke: OK desktop/mobile Material interaction passed');
} finally {
  if (server) server.kill();
}
