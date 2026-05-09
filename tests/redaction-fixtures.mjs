import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const py = process.env.PYTHON || 'python';
const out = path.join(root, 'tests', 'output', 'redaction-fixtures');

async function write(rel, text = 'fixture') {
  const file = path.join(out, rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, text, 'utf8');
  return file;
}
function scan(target) {
  return spawnSync(py, ['scripts/check_public_redaction.py', '--path', target, '--strict'], { cwd: root, encoding: 'utf8' });
}
async function expectFail(name, setup) {
  const dir = path.join(out, name);
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
  await setup(dir);
  const result = scan(dir);
  if (result.status === 0) throw new Error(`${name} fixture unexpectedly passed redaction scan`);
}
async function expectFailMessage(name, setup, expectedMessage) {
  const dir = path.join(out, name);
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
  await setup(dir);
  const result = scan(dir);
  if (result.status === 0) throw new Error(`${name} fixture unexpectedly passed redaction scan`);
  if (!`${result.stdout}\n${result.stderr}`.includes(expectedMessage)) {
    throw new Error(`${name} did not report ${expectedMessage}:\n${result.stdout}\n${result.stderr}`);
  }
}

await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });

await expectFail('windows-path', (dir) => fs.writeFile(path.join(dir, 'index.html'), 'C:\\Users\\Somebody\\Downloads\\private.csv'));
await expectFail('posix-path', (dir) => fs.writeFile(path.join(dir, 'index.html'), '/Users/somebody/Downloads/private.csv'));
await expectFail('email-phone-address', (dir) => fs.writeFile(path.join(dir, 'index.html'), 'owner@example.com 510-555-1212 12345 Private Road'));
await expectFail('account-id', (dir) => fs.writeFile(path.join(dir, 'index.html'), 'Account 12345678901'));
await expectFail('tokens', (dir) => fs.writeFile(path.join(dir, 'index.html'), 'sk-thisisafakekeywithmorethan20chars ghp_thisisafakegithubtoken000000'));
await expectFail('raw-csv-html', (dir) => fs.writeFile(path.join(dir, 'index.html'), 'Reading Date,Days in Read Period,CCF,Customer GPD,Average Households GPD,Top 20% GPD\nPUBLIC-TEST,2026-01-01,30,10,200,190,100\nPUBLIC-TEST,2026-02-01,30,11,210,190,100\n'));
await expectFail('browser-artifacts', async (dir) => { await fs.writeFile(path.join(dir, 'trace.har'), '{}'); await fs.writeFile(path.join(dir, 'video.webm'), 'x'); });
await expectFail('non-sample-csv', (dir) => fs.writeFile(path.join(dir, 'private.csv'), 'a,b\n1,2\n'));
await expectFail('unapproved-image', (dir) => fs.writeFile(path.join(dir, 'screenshot.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>'));
await expectFail('tests-output', async (dir) => { await fs.mkdir(path.join(dir, 'tests', 'output'), { recursive: true }); await fs.writeFile(path.join(dir, 'tests', 'output', 'private.txt'), 'private'); });
await expectFail('zip-leakage', async (dir) => {
  const zipPath = path.join(dir, 'leaky.zip');
  const code = `from zipfile import ZipFile\nwith ZipFile(r'''${zipPath}''','w') as z:\n    z.writestr('generated/private-report/index.html','private')\n`;
  const result = spawnSync(py, ['-c', code], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
});
for (const [name, member] of [
  ['zip-traversal-parent', '../escape.txt'],
  ['zip-traversal-absolute', '/tmp/escape.txt'],
  ['zip-traversal-drive', 'C:/Users/Dan/private.txt'],
  ['zip-traversal-nested', 'nested/../../escape.txt']
]) {
  await expectFailMessage(name, async (dir) => {
    const zipPath = path.join(dir, 'leaky.zip');
    const code = `from zipfile import ZipFile\nwith ZipFile(r'''${zipPath}''','w') as z:\n    z.writestr(r'''${member}''','private')\n`;
    const result = spawnSync(py, ['-c', code], { encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  }, 'unsafe ZIP member');
}

const good = path.join(out, 'good-standalone-report');
await fs.mkdir(good, { recursive: true });
await fs.writeFile(path.join(good, 'index.html'), '<!doctype html><title>Public anonymized summary</title><p>Not affiliated with EBMUD.</p>', 'utf8');
for (const visual of ['01_timeline.svg', '02_driver_stack.svg', '03_seasonality.svg', '04_year_over_year.svg', '05_context.svg']) {
  await fs.writeFile(path.join(good, visual), '<svg xmlns="http://www.w3.org/2000/svg"><title>synthetic report visual</title></svg>', 'utf8');
}
const goodResult = scan(good);
if (goodResult.status !== 0) throw new Error(`good standalone report fixture failed:\n${goodResult.stdout}\n${goodResult.stderr}`);
console.log('redaction-fixtures: OK scanner catches negative fixtures and allows standalone report SVGs');
