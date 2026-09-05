import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const css = await fs.readFile(path.join(root, 'src', 'styles.css'), 'utf8');
const printBlock = css.slice(css.indexOf('@media print'));
if (!printBlock.length) throw new Error('src/styles.css has no @media print block');
for (const required of ['.weekend-checklist-card', '.next-checks-card', '.browser-chart-card', 'break-inside', '.method-details', '@page']) {
  if (!printBlock.includes(required)) throw new Error(`print CSS missing required rule: ${required}`);
}

const url = 'http://127.0.0.1:4191/';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4191'], { stdio: 'ignore' });

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
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto(url);
  await page.getByRole('button', { name: 'Try sample report' }).first().click();
  await page.getByRole('heading', { name: 'Your water-saving briefing is ready.' }).waitFor({ timeout: 6000 });

  await page.emulateMedia({ media: 'print' });
  const topbarDisplay = await page.locator('.topbar').evaluate((node) => getComputedStyle(node).display);
  if (topbarDisplay !== 'none') throw new Error(`print media should hide .topbar, got display: ${topbarDisplay}`);
  for (const text of ['This weekend', 'Recommended next checks', 'Normal daily use estimate', 'Where savings may be hiding', 'What Mud Buddy sees']) {
    const node = page.locator('[data-testid="browser-report"]').getByText(text, { exact: false }).first();
    if (!(await node.isVisible())) throw new Error(`print media hides report content: ${text}`);
  }
  const reportBox = await page.locator('[data-testid="browser-report"]').boundingBox();
  if (!reportBox || reportBox.width < 600) throw new Error('print report width looks clipped on desktop');

  await page.setViewportSize({ width: 390, height: 844 });
  const weekend = page.locator('[data-testid="browser-report"]').getByText('This weekend', { exact: false }).first();
  if (!(await weekend.isVisible())) throw new Error('print media hides weekend checklist on mobile width');

  if (errors.length) throw new Error('Console errors: ' + errors.join('\n'));
  await browser.close();
  console.log('print-smoke: OK print CSS present; report findings and weekend checklist stay visible in print media');
} finally {
  server.kill();
}
