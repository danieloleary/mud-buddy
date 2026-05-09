import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const py = process.platform === 'win32' ? 'python' : 'python3';
const flavorsDir = path.join(root, 'tests', 'output', 'synthetic-flavors');
const reportsDir = path.join(root, 'tests', 'output', 'synthetic-results-correctness');
const manifestPath = path.join(flavorsDir, 'manifest.json');

try {
  await fs.access(manifestPath);
} catch {
  const result = spawnSync(py, ['scripts/generate_synthetic_flavors.py'], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
}

function runSummary(csvPath, outPath, isPublic = false) {
  const args = ['scripts/generate_report.py', csvPath, '--out', outPath, '--summary-json'];
  if (isPublic) args.push('--public');
  const result = spawnSync(py, args, { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  const start = result.stdout.indexOf('{');
  if (start < 0) throw new Error('summary-json output missing JSON');
  return JSON.parse(result.stdout.slice(start));
}

const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
await fs.rm(reportsDir, { recursive: true, force: true });
await fs.mkdir(reportsDir, { recursive: true });

for (const item of manifest.flavors) {
  const csvPath = path.join(flavorsDir, item.file);
  const csvText = await fs.readFile(csvPath, 'utf8');
  const firstDataRow = csvText.trim().split(/\r?\n/)[1];
  const privateOut = path.join(reportsDir, item.flavor, 'private');
  const publicOut = path.join(reportsDir, item.flavor, 'public');
  const privateSummary = runSummary(csvPath, privateOut);
  const publicSummary = runSummary(csvPath, publicOut, true);
  const privateHtml = await fs.readFile(path.join(privateOut, 'index.html'), 'utf8');
  const publicHtml = await fs.readFile(path.join(publicOut, 'index.html'), 'utf8');
  for (const text of [privateHtml, publicHtml]) {
    for (const bad of ['NaN', 'undefined', 'None']) {
      if (text.includes(bad)) throw new Error(`${item.flavor} report includes ${bad}`);
    }
    if (!text.includes(`Excluded invalid rows: ${item.expectedInvalid}`)) throw new Error(`${item.flavor} report missing expected invalid row count`);
  }
  if (!privateHtml.includes(`${privateSummary.total_ccf.toFixed(0)} CCF`) && !privateHtml.includes(`${Math.round(privateSummary.total_ccf)} CCF`)) {
    throw new Error(`${item.flavor} private report missing total CCF stat`);
  }
  if (!publicHtml.includes('Public anonymized summary')) throw new Error(`${item.flavor} public report missing public label`);
  if (!publicHtml.includes('Baseline bucket')) throw new Error(`${item.flavor} public report missing bucketed baseline label`);
  if (publicHtml.includes('Peak period')) throw new Error(`${item.flavor} public report leaked exact peak label`);
  if (publicSummary.total_ccf % 5 !== 0 || publicSummary.baseline_gpd % 25 !== 0) throw new Error(`${item.flavor} public report summary is not bucketed`);
  for (const forbidden of [item.file, firstDataRow, 'PUBLIC-SYNTHETIC']) {
    if (forbidden && publicHtml.includes(forbidden)) throw new Error(`${item.flavor} public report leaked ${forbidden}`);
  }
}

console.log(`synthetic-report-results-correctness: OK ${manifest.flavors.length} generated reports have sane labels, values, and privacy behavior`);
