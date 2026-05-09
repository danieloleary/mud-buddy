import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEbmudCsv } from '../src/ebmud-csv.js';
import { analyzeWaterUse } from '../src/water-analysis.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const py = process.env.PYTHON || 'python';
const outRoot = path.join(root, 'tests', 'output', 'js-python-parity');

process.on('uncaughtException', (error) => {
  const message = String(error?.message || error).replace(/\r?\n/g, ' ');
  console.error(`::error title=JS/Python parity failed::${message}`);
  console.error(error?.stack || error);
  process.exit(1);
});

await fs.rm(outRoot, { recursive: true, force: true });
await fs.mkdir(outRoot, { recursive: true });

function runSummary(csvPath, label) {
  const out = path.join(outRoot, label.replace(/[^a-z0-9_-]/gi, '-'));
  const result = spawnSync(py, ['scripts/generate_report.py', csvPath, '--out', out, '--summary-json'], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  const start = result.stdout.indexOf('{');
  if (start < 0) throw new Error('Python summary-json output missing JSON for ' + label);
  return JSON.parse(result.stdout.slice(start));
}

async function compare(csvPath, label) {
  const pythonSummary = runSummary(csvPath, label);
  const parsed = parseEbmudCsv(await fs.readFile(csvPath, 'utf8'));
  const jsSummary = analyzeWaterUse(parsed.rows, parsed.invalidRows, parsed.warnings);
  for (const [metric, expected, actual] of [
    ['valid rows', pythonSummary.valid_rows, jsSummary.validRows],
    ['invalid rows', pythonSummary.invalid_rows, jsSummary.invalidRows],
    ['baseline GPD', pythonSummary.baseline_gpd, jsSummary.baselineGpd]
  ]) {
    if (expected !== actual) throw new Error(`${label}: JS/Python parity mismatch for ${metric}: expected ${expected}, got ${actual}`);
  }
  if (Math.abs(pythonSummary.total_ccf - jsSummary.totalCcf) > 0.01) {
    throw new Error(`${label}: JS/Python parity mismatch for total CCF: expected ${pythonSummary.total_ccf}, got ${jsSummary.totalCcf}`);
  }
  if (Math.abs(pythonSummary.total_gallons - jsSummary.totalGallons) > 1) {
    throw new Error(`${label}: JS/Python parity mismatch for total gallons: expected ${pythonSummary.total_gallons}, got ${jsSummary.totalGallons}`);
  }
  if (Math.abs(pythonSummary.avg_gpd - jsSummary.avgGpd) > 0.1) {
    throw new Error(`${label}: JS/Python parity mismatch for avg GPD: expected ${pythonSummary.avg_gpd}, got ${jsSummary.avgGpd}`);
  }
}

await compare(path.join(root, 'examples', 'sample-ebmud-usage.csv'), 'sample');
const manifestPath = path.join(root, 'tests', 'output', 'synthetic-flavors', 'manifest.json');
try {
  await fs.access(manifestPath);
} catch {
  const result = spawnSync(py, ['scripts/generate_synthetic_flavors.py'], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
}
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
for (const item of manifest.flavors) {
  await compare(path.join(root, 'tests', 'output', 'synthetic-flavors', item.file), item.flavor);
}

console.log(`js-python-parity: OK browser summary matches Python for sample + ${manifest.flavors.length} synthetic flavors`);
