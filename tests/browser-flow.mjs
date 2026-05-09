import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'tests', 'output');
await fs.mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ acceptDownloads: true });
const errors = [];
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
await page.goto('file://' + path.join(root, 'tests', 'mock-ebmud-portal', 'index.html').replaceAll('\\', '/'));
await page.getByTestId('manual-login-complete').click();
const downloadPromise = page.waitForEvent('download');
await page.getByTestId('download-csv').click();
const download = await downloadPromise;
const suggested = download.suggestedFilename();
if (!suggested.endsWith('.csv')) throw new Error(`Expected CSV download, got ${suggested}`);
const csvPath = path.join(output, suggested);
await download.saveAs(csvPath);
const stat = await fs.stat(csvPath);
if (!stat.size) throw new Error('Downloaded CSV was empty');

const reportOut = path.join(output, 'mock-report');
await fs.rm(reportOut, { recursive: true, force: true });
await new Promise((resolve, reject) => {
  const child = spawn(process.platform === 'win32' ? 'python' : 'python3', ['scripts/generate_report.py', csvPath, '--out', reportOut, '--public'], { cwd: root, stdio: 'inherit' });
  child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`report generator exited ${code}`)));
});
await fs.access(path.join(reportOut, 'index.html'));
const reportHtml = await fs.readFile(path.join(reportOut, 'index.html'), 'utf8');
if (!reportHtml.includes('Public anonymized summary')) throw new Error('Generated report is not in public mode');
if (!/not affiliated with EBMUD/i.test(reportHtml)) throw new Error('Generated report missing disclaimer');
if (/Billing Usage|C:\\Users\\|1234567890/.test(reportHtml)) throw new Error('Generated public report leaked sensitive context');
await page.goto('file://' + path.join(reportOut, 'index.html').replaceAll('\\', '/'));
await page.locator('img').first().waitFor({ state: 'visible' });
await browser.close();
if (errors.length) throw new Error('Console errors: ' + errors.join('\n'));
console.log(`browser-flow: OK downloaded ${suggested} (${stat.size} bytes), generated public report, and loaded it cleanly`);
