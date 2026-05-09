import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const flavorsDir = path.join(root, 'tests', 'output', 'synthetic-flavors');
const summaryDir = path.join(root, 'tests', 'output', 'synthetic-summary-contract');
const py = process.env.PYTHON || 'python';

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  const headers = rows.shift();
  return rows.filter((r) => r.length && r.some(Boolean)).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
}

function num(value) {
  const cleaned = String(value ?? '').replace(/,/g, '').trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
function avg(values) {
  const xs = values.filter((v) => v !== null && Number.isFinite(v));
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}
function sd(values) {
  const xs = values.filter((v) => v !== null && Number.isFinite(v));
  if (xs.length < 2) return 0;
  const m = avg(xs);
  return Math.sqrt(xs.reduce((sum, v) => sum + (v - m) ** 2, 0) / (xs.length - 1));
}
function ratio(a, b) {
  return a && b ? a / b : null;
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function runSummary(csvPath, outPath, isPublic = false) {
  const args = ['scripts/generate_report.py', csvPath, '--out', outPath, '--summary-json'];
  if (isPublic) args.push('--public');
  const result = spawnSync(py, args, { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`summary generation failed for ${csvPath}: ${result.stderr || result.stdout}`);
  const start = result.stdout.indexOf('{');
  assert(start >= 0, `summary-json output missing JSON for ${csvPath}`);
  return JSON.parse(result.stdout.slice(start));
}

async function ensureManifest() {
  try {
    return JSON.parse(await fs.readFile(path.join(flavorsDir, 'manifest.json'), 'utf8'));
  } catch {
    const result = spawnSync(py, ['scripts/generate_synthetic_flavors.py'], { cwd: root, encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr || result.stdout);
    return JSON.parse(await fs.readFile(path.join(flavorsDir, 'manifest.json'), 'utf8'));
  }
}

const manifest = await ensureManifest();
assert(manifest.count === 20, `expected 20 flavors, found ${manifest.count}`);
await fs.rm(summaryDir, { recursive: true, force: true });
await fs.mkdir(summaryDir, { recursive: true });

for (const item of manifest.flavors) {
  const csvPath = path.join(flavorsDir, item.file);
  const rows = parseCsv(await fs.readFile(csvPath, 'utf8'));
  const parsed = rows.map((row) => ({
    date: new Date(`${row['Reading Date']}T00:00:00Z`),
    gpd: num(row['Customer GPD']),
    ccf: num(row.CCF),
    days: num(row['Days in Read Period']),
    avg: num(row['Average Households GPD']),
    top: num(row['Top 20% GPD']),
    row
  }));
  const valid = parsed.filter((r) => r.gpd !== null);
  const gpds = valid.map((r) => r.gpd);
  const third = Math.max(1, Math.floor(valid.length / 3));
  const first = avg(gpds.slice(0, third));
  const last = avg(gpds.slice(-third));
  const summer = avg(valid.filter((r) => [5, 6, 7, 8].includes(r.date.getUTCMonth())).map((r) => r.gpd));
  const nonSummer = avg(valid.filter((r) => ![5, 6, 7, 8].includes(r.date.getUTCMonth())).map((r) => r.gpd));
  const fall = avg(valid.filter((r) => [8, 9, 10].includes(r.date.getUTCMonth())).map((r) => r.gpd));
  const nonFall = avg(valid.filter((r) => ![8, 9, 10].includes(r.date.getUTCMonth())).map((r) => r.gpd));
  const before2025 = avg(valid.filter((r) => r.date < new Date('2025-01-01T00:00:00Z')).map((r) => r.gpd));
  const after2025 = avg(valid.filter((r) => r.date >= new Date('2025-01-01T00:00:00Z')).map((r) => r.gpd));
  const beforeMar2025 = avg(valid.filter((r) => r.date < new Date('2025-03-01T00:00:00Z')).map((r) => r.gpd));
  const afterMar2025 = avg(valid.filter((r) => r.date >= new Date('2025-03-01T00:00:00Z')).map((r) => r.gpd));
  const beforeMay2025 = avg(valid.filter((r) => r.date < new Date('2025-05-01T00:00:00Z')).map((r) => r.gpd));
  const afterMay2025 = avg(valid.filter((r) => r.date >= new Date('2025-05-01T00:00:00Z')).map((r) => r.gpd));
  const aboveAvg = valid.filter((r) => r.avg !== null && r.gpd > r.avg).length;
  const closeTop = valid.filter((r) => r.top && r.gpd / r.top >= 0.9 && r.gpd / r.top <= 1.15).length;
  const belowTop = valid.filter((r) => r.top !== null && r.gpd < r.top).length;
  const shortPeriods = parsed.filter((r) => r.days !== null && r.days <= 30).length;
  const longPeriods = parsed.filter((r) => r.days !== null && r.days >= 70).length;
  const years = [...new Set(parsed.map((r) => r.date.getUTCFullYear()))].sort();
  const invalidRows = parsed.filter((r) => r.gpd === null).length;

  const f = item.flavor;
  if (f === 'normal-baseline') assert(sd(gpds) / avg(gpds) < 0.35, `${f} should be stable-ish`);
  if (f === 'large-family-growth') assert(ratio(last, first) >= 1.25, `${f} should grow materially`);
  if (f === 'irrigation-summer-heavy') assert(ratio(summer, nonSummer) >= 1.45, `${f} should show summer irrigation lift`);
  if (f === 'irrigation-fall-heavy') assert(ratio(fall, nonFall) >= 1.25, `${f} should show fall irrigation lift`);
  if (f === 'new-landscaping-ramp') assert(ratio(afterMar2025, beforeMar2025) >= 1.25, `${f} should ramp after March 2025`);
  if (f === 'dying-plants-water-more') assert(ratio(afterMay2025, beforeMay2025) >= 1.18, `${f} should lift after May 2025`);
  if (f === 'possible-toilet-leak') assert(ratio(after2025, before2025) >= 1.18, `${f} should lift baseline after 2025`);
  if (f === 'continuous-baseline-creep') assert(ratio(last, first) >= 1.3, `${f} should creep upward`);
  if (f === 'winter-spike') assert(ratio(after2025, before2025) >= 1.15, `${f} should include later winter/spring spike`);
  if (f === 'usage-drop-conservation') assert(ratio(last, first) <= 0.85, `${f} should drop at least 15%, got ${ratio(last, first)?.toFixed(2)}`);
  if (f === 'erratic-controller') assert(sd(gpds) / avg(gpds) >= 0.35, `${f} should be erratic`);
  if (f === 'high-peer-comparison') assert(aboveAvg / valid.length >= 0.8, `${f} should be above average peers`);
  if (f === 'top-20-close') assert(closeTop / valid.length >= 0.8, `${f} should be close to top 20 benchmark`);
  if (f === 'low-efficient') assert(belowTop / valid.length >= 0.8, `${f} should be below top benchmark`);
  if (f === 'missing-gpd-row') assert(invalidRows === 1, `${f} should have one missing/invalid GPD row`);
  if (f === 'na-gpd-row') assert(invalidRows === 1 && parsed.filter((r) => r.row['Customer GPD'] === 'N/A').length === 1, `${f} should have one N/A row`);
  if (f === 'short-read-period') assert(shortPeriods >= 6, `${f} should have several short read periods`);
  if (f === 'long-read-period') assert(longPeriods >= 6, `${f} should have several long read periods`);
  if (f === 'partial-year') assert(rows.length === 6 && years.length === 1 && years[0] === 2026, `${f} should be six 2026 rows`);
  if (f === 'flatline-meter-check') assert(sd(gpds) <= 3, `${f} should be nearly flat`);

  const privateSummary = runSummary(csvPath, path.join(summaryDir, f, 'private'));
  const publicSummary = runSummary(csvPath, path.join(summaryDir, f, 'public'), true);
  assert(privateSummary.valid_rows === rows.length - item.expectedInvalid, `${f} private valid row count mismatch`);
  assert(privateSummary.invalid_rows === item.expectedInvalid, `${f} private invalid row count mismatch`);
  assert(publicSummary.valid_rows === privateSummary.valid_rows, `${f} public valid row count mismatch`);
  assert(publicSummary.invalid_rows === privateSummary.invalid_rows, `${f} public invalid row count mismatch`);
  assert(privateSummary.total_ccf > 0 && privateSummary.total_gallons === Math.round(privateSummary.total_ccf * 748), `${f} private totals inconsistent`);
  assert(privateSummary.avg_gpd > 0 && privateSummary.baseline_gpd > 0, `${f} private summary missing GPD stats`);
  assert(publicSummary.total_ccf % 5 === 0, `${f} public total CCF should be bucketed to 5 CCF`);
  assert(publicSummary.baseline_gpd % 25 === 0, `${f} public baseline should be bucketed to 25 GPD`);
}

console.log(`synthetic-data-contract: OK ${manifest.count} synthetic flavors match intended data patterns and summaries`);
