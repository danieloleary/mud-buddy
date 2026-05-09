import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const url = 'http://127.0.0.1:4188/';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4188'], { stdio: 'ignore' });

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
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(url);
  const body = await page.locator('body').innerText();

  for (const required of [
    'Mud Buddy',
    'for EBMUD customers',
    'Create a private EBMUD water report.',
    'Create my report',
    'Try sample report',
    'Get my usage file',
    'Built with love in Lafayette, CA.',
    'Runs in this browser. Your usage file is not uploaded, stored, or added to the URL. Not affiliated with EBMUD.',
    'Download from EBMUD, then create your report.',
    'Official EBMUD resources'
  ]) {
    if (!body.includes(required)) throw new Error(`Missing homeowner-facing text: ${required}`);
  }

  for (const junk of [
    'Social card',
    'test harness',
    'synthetic flavors',
    'package scan',
    'release gate',
    'Download project ZIP',
    'For EBMUD review',
    'agent assist',
    'artifact'
  ]) {
    if (body.toLowerCase().includes(junk.toLowerCase())) throw new Error(`Homepage still exposes maintainer/demo copy: ${junk}`);
  }
  for (const iconToken of ['computer', 'cloud_off', 'key_off', 'receipt_long', 'upload_file', 'verified_user']) {
    if (body.includes(iconToken)) throw new Error(`Homepage body text leaked decorative icon token: ${iconToken}`);
  }

  await page.getByRole('button', { name: 'Try sample report' }).first().click();
  await page.getByRole('heading', { name: 'Report ready.' }).waitFor({ timeout: 6000 });
  const reportText = await page.locator('[data-testid="browser-report"]').innerText();
  const reportTextLower = reportText.toLowerCase();
  for (const required of [
    'Start here',
    'Normal daily use estimate',
    'Outdoor watering clue',
    'Average-household benchmark in your usage file',
    'When to use EBMUD directly',
    'Billing questions',
    'Recommended next checks',
    'What Mud Buddy sees',
    'This is a pattern read from your usage file, not an official EBMUD finding.',
    'Confidence and method',
    'What would make this more certain',
    'Print or save PDF'
  ]) {
    if (!reportTextLower.includes(required.toLowerCase())) throw new Error(`Browser report still needs homeowner wording: ${required}`);
  }
  for (const iconToken of ['query_stats', 'task_alt']) {
    if (reportText.includes(iconToken)) throw new Error(`Browser report body text leaked decorative icon token: ${iconToken}`);
  }
  for (const oldLabel of ['Baseline estimate', 'Seasonal lift clue', 'Peer context:', 'Read-period notes', 'Print / save', 'Compared with similar homes', 'similar-home context', "for EBMUD - by Dan O'Leary", "for EBMUD Customers - by Dan O'Leary"]) {
    if (reportText.includes(oldLabel)) throw new Error(`Browser report still contains old jargon: ${oldLabel}`);
  }
  for (const risky of ['appears to drive', 'proof of a leak', 'definitely a leak', 'official classification', 'Keep minutes steady']) {
    if (reportTextLower.includes(risky.toLowerCase())) throw new Error(`Browser report sounds too definitive or stale: ${risky}`);
  }

  await browser.close();
  console.log('editorial-contract: OK v1.2 app and report are homeowner-first, evidence-based, and EBMUD-safe');
} finally {
  server.kill();
}
