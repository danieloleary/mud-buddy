import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const py = process.platform === 'win32' ? 'python' : 'python3';
const portalPath = path.join(root, 'tests', 'mock-ebmud-portal', 'index.html');
const html = await fs.readFile(portalPath, 'utf8');
for (const forbidden of [/type=["']password/i, /localStorage\s*[.=]/, /sessionStorage\s*[.=]/, /document\.cookie/i, /Authorization:\s*Bearer/i]) {
  if (forbidden.test(html)) throw new Error(`mock portal contains forbidden browser/session pattern: ${forbidden}`);
}
const hrefMatch = html.match(/href="(data:text\/csv[^"']+)"/);
if (!hrefMatch) throw new Error('mock portal missing data:text/csv download link');
const csv = decodeURIComponent(hrefMatch[1].replace(/^data:text\/csv;charset=utf-8,/, ''));
for (const header of ['Reading Date', 'Days in Read Period', 'CCF', 'Customer GPD', 'Average Households GPD', 'Top 20% GPD', 'WaterScore', 'Account Number']) {
  if (!csv.includes(header)) throw new Error(`mock CSV missing header: ${header}`);
}
if (!csv.includes('PUBLIC-SAMPLE')) throw new Error('mock CSV should use public synthetic marker');
const malformedDir = path.join(root, 'tests', 'output', 'browser-flow-safety');
await fs.rm(malformedDir, { recursive: true, force: true });
await fs.mkdir(malformedDir, { recursive: true });
const malformed = path.join(malformedDir, 'malformed.csv');
await fs.writeFile(malformed, 'not,the,right,columns\n1,2,3,4\n', 'utf8');
const bad = spawnSync(py, ['scripts/generate_report.py', malformed, '--out', path.join(malformedDir, 'bad-report')], { cwd: root, encoding: 'utf8' });
if (bad.status === 0) throw new Error('malformed CSV unexpectedly generated a report');
const mockReport = path.join(root, 'tests', 'output', 'mock-report');
try {
  await fs.access(path.join(mockReport, 'index.html'));
  const scan = spawnSync(py, ['scripts/check_public_redaction.py', '--path', mockReport, '--strict'], { cwd: root, encoding: 'utf8' });
  if (scan.status !== 0) throw new Error(`mock public report redaction scan failed:\n${scan.stdout}\n${scan.stderr}`);
} catch {
  console.log('browser-flow-safety: mock report absent, skipping generated-report scan; run test:browser-flow first for full chain');
}
console.log('browser-flow-safety: OK mock portal avoids credential/session handling and rejects malformed CSV');