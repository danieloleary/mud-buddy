import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const py = process.platform === 'win32' ? 'python' : 'python3';
const zipPath = path.join(root, 'public-site', 'mud-buddy-by-danno.zip');
try { await fs.access(zipPath); } catch { throw new Error('public ZIP missing; run npm run package:public first'); }
const code = `import json\nfrom zipfile import ZipFile\nwith ZipFile(r'''${zipPath}''') as z:\n    print(json.dumps(sorted(z.namelist())))\n`;
const result = spawnSync(py, ['-c', code], { cwd: root, encoding: 'utf8' });
if (result.status !== 0) throw new Error(result.stderr || result.stdout);
const names = JSON.parse(result.stdout);
const has = (name) => names.includes(name);
for (const expected of [
  'README.md',
  'SECURITY.md',
  'SUPPORT.md',
  'CODE_OF_CONDUCT.md',
  'CITATION.cff',
  'docs/privacy.md',
  'skills/ebmud-buddy/SKILL.md',
  'scripts/generate_report.py',
  'examples/sample-ebmud-usage.csv',
  'tests/mock-ebmud-portal/index.html',
  '.github/ISSUE_TEMPLATE/bug_report.yml',
  '.github/pull_request_template.md',
  '.github/dependabot.yml',
  'public/assets/social-card.svg'
]) {
  if (!has(expected)) throw new Error(`public ZIP missing expected file: ${expected}`);
}
for (const name of names) {
  if (/^(node_modules|dist|generated|public-site|\.git|\.herenow|tests\/output|test-results|playwright-report)\//.test(name)) throw new Error(`public ZIP includes forbidden path: ${name}`);
  if (/Billing Usage/i.test(name)) throw new Error(`public ZIP includes billing export filename: ${name}`);
  if (/\.csv$/i.test(name) && name !== 'examples/sample-ebmud-usage.csv') throw new Error(`public ZIP includes non-sample CSV: ${name}`);
  if (/\.(har|trace|webm|png|jpe?g|gif|webp)$/i.test(name)) throw new Error(`public ZIP includes forbidden artifact/image: ${name}`);
  if (/\.svg$/i.test(name) && name.startsWith('public/assets/')) {
    const allowed = new Set(['hero-civic-water.svg', 'workflow-csv-report.svg', 'privacy-local-first.svg', 'ebmud-resource-directory.svg', 'readme-banner.svg', 'social-card.svg']);
    if (!allowed.has(path.basename(name))) throw new Error(`public ZIP includes unknown SVG asset: ${name}`);
  }
}
console.log(`package-public-policy: OK ${names.length} ZIP entries satisfy public package policy`);