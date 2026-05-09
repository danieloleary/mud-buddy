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
    'Upload your EBMUD CSV. See what changed.',
    'Analyze my CSV',
    'Try sample data',
    'How to download your EBMUD CSV',
    'Runs in this browser. Your CSV is not uploaded. Not affiliated with EBMUD.',
    'How to get your EBMUD CSV.',
    'Official EBMUD resources',
    'For EBMUD review',
    'Independent today. Feedback-ready if EBMUD wants to review it.'
  ]) {
    if (!body.includes(required)) throw new Error(`Missing homeowner-facing text: ${required}`);
  }

  for (const junk of [
    'Social card',
    'test harness',
    'synthetic flavors',
    'package scan',
    'release gate',
    'Download project ZIP'
  ]) {
    if (body.toLowerCase().includes(junk.toLowerCase())) throw new Error(`Homepage still exposes maintainer/demo copy: ${junk}`);
  }
  for (const iconToken of ['computer', 'cloud_off', 'key_off', 'receipt_long', 'upload_file', 'verified_user']) {
    if (body.includes(iconToken)) throw new Error(`Homepage body text leaked decorative icon token: ${iconToken}`);
  }

  await page.getByText('Try sample data').first().click();
  await page.getByText('Your private browser report is ready.').waitFor({ timeout: 6000 });
  const reportText = await page.locator('[data-testid="browser-report"]').innerText();
  const reportTextLower = reportText.toLowerCase();
  for (const required of [
    'What should I check first?',
    'Normal daily use estimate',
    'Pattern suggests outdoor watering',
    'Compared with the average-household benchmark in your export',
    'When to use EBMUD directly',
    'Billing questions',
    'Confidence',
    'Recommended next steps',
    'How Mud Buddy decides this',
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

  await browser.close();
  console.log('editorial-contract: OK homepage and browser report are homeowner-first');
} finally {
  server.kill();
}
