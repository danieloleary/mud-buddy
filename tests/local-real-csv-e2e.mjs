import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const py = process.platform === 'win32' ? 'python' : 'python3';

async function findCsv() {
  if (process.env.MUD_BUDDY_REAL_CSV) return process.env.MUD_BUDDY_REAL_CSV;
  const downloads = path.join(os.homedir(), 'Downloads');
  try {
    const candidates = (await fs.readdir(downloads))
      .filter((name) => /^Billing Usage.*\.csv$/i.test(name))
      .map((name) => path.join(downloads, name))
      .filter((file) => fssync.statSync(file).isFile())
      .sort((a, b) => fssync.statSync(b).mtimeMs - fssync.statSync(a).mtimeMs);
    return candidates[0] || null;
  } catch {
    return null;
  }
}
function run(args) {
  const result = spawnSync(py, args, { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${py} ${args.join(' ')} failed:\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}
function parseSummary(stdout) {
  const start = stdout.indexOf('{');
  if (start < 0) throw new Error('summary-json output missing JSON');
  return JSON.parse(stdout.slice(start));
}
function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(',');
  return lines.map((line) => Object.fromEntries(line.split(',').map((value, i) => [headers[i], value])));
}
function assertNoLeak(text, pattern, label) {
  if (pattern.test(text)) throw new Error(`public real-CSV report leaked ${label}`);
}

const source = await findCsv();
if (!source || !fssync.existsSync(source)) {
  console.log('local-real-csv-e2e: SKIP no local EBMUD Billing Usage CSV found');
  process.exit(0);
}

const rows = parseCsv(await fs.readFile(source, 'utf8'));
const accounts = [...new Set(rows.map((row) => row['Account Number']).filter(Boolean))];
const outRoot = path.join(root, 'tests', 'output', 'dan-real-csv');
await fs.rm(outRoot, { recursive: true, force: true });
await fs.mkdir(outRoot, { recursive: true });
const privateOut = path.join(outRoot, 'private-report');
const publicOut = path.join(outRoot, 'public-report');
const privateSummary = parseSummary(run(['scripts/generate_report.py', source, '--out', privateOut, '--summary-json']));
const publicSummary = parseSummary(run(['scripts/generate_report.py', source, '--out', publicOut, '--public', '--summary-json']));
if (privateSummary.valid_rows <= 0 || privateSummary.total_ccf <= 0 || privateSummary.baseline_gpd <= 0) throw new Error('private real-CSV summary did not produce meaningful stats');
if (publicSummary.valid_rows !== privateSummary.valid_rows || publicSummary.invalid_rows !== privateSummary.invalid_rows) throw new Error('public/private real-CSV row counts differ');
if (publicSummary.total_ccf % 5 !== 0 || publicSummary.baseline_gpd % 25 !== 0) throw new Error('public real-CSV summary is not bucketed');
const publicText = await fs.readFile(path.join(publicOut, 'index.html'), 'utf8');
for (const account of accounts) assertNoLeak(publicText, new RegExp(account.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), 'account number');
assertNoLeak(publicText, /Billing Usage/i, 'source filename');
assertNoLeak(publicText, /[A-Za-z]:\\Users\\[^\s'"<>]+/i, 'local Windows path');
assertNoLeak(publicText, /\b\d{10,}\b/, 'account-like long number');
const forbidArgs = accounts.flatMap((account) => ['--forbid', account]);
forbidArgs.push('--forbid', path.basename(source));
const scan = spawnSync(py, ['scripts/check_public_redaction.py', '--path', publicOut, '--strict', ...forbidArgs], { cwd: root, encoding: 'utf8' });
if (scan.status !== 0) throw new Error(`standalone real public-report redaction scan failed:\n${scan.stdout}\n${scan.stderr}`);
console.log(`local-real-csv-e2e: OK ${privateSummary.valid_rows} valid rows, ${privateSummary.invalid_rows} invalid rows, ${privateSummary.total_ccf} CCF private total, baseline ${privateSummary.baseline_gpd} GPD`);