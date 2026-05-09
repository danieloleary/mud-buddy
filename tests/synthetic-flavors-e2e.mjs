import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const flavorsDir = path.join(root, 'tests', 'output', 'synthetic-flavors');
const reportsDir = path.join(root, 'tests', 'output', 'synthetic-reports');
const requiredVisuals = ['01_timeline.svg', '02_driver_stack.svg', '03_seasonality.svg', '04_year_over_year.svg', '05_context.svg'];
const forbidden = [/Billing Usage for/i, /C:\\Users\\[^\s<>'"]+/i, /PRIVATE_ADDRESS_SENTINEL/, /PRIVATE_ACCOUNT_SENTINEL/, /\b\d{10,}\b/];

async function run(command, args, options = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: 'inherit', ...options });
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)));
  });
}

async function readManifest() {
  const manifestPath = path.join(flavorsDir, 'manifest.json');
  try {
    return JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  } catch {
    await run(process.env.PYTHON || 'python', ['scripts/generate_synthetic_flavors.py']);
    return JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  }
}

function assertNoForbidden(text, label) {
  for (const pattern of forbidden) {
    if (pattern.test(text)) throw new Error(`${label} leaked forbidden pattern ${pattern}`);
  }
}

const manifest = await readManifest();
if (manifest.count !== 20 || manifest.flavors.length !== 20) throw new Error(`Expected 20 synthetic flavors, found ${manifest.count}`);
await fs.rm(reportsDir, { recursive: true, force: true });
await fs.mkdir(reportsDir, { recursive: true });

for (const item of manifest.flavors) {
  const csvPath = path.join(flavorsDir, item.file);
  const csvText = await fs.readFile(csvPath, 'utf8');
  assertNoForbidden(csvText, item.file);
  if (!csvText.includes('PUBLIC-SYNTHETIC')) throw new Error(`${item.file} missing synthetic account marker`);

  const privateOut = path.join(reportsDir, item.flavor, 'private');
  const publicOut = path.join(reportsDir, item.flavor, 'public');
  await run(process.env.PYTHON || 'python', ['scripts/generate_report.py', csvPath, '--out', privateOut]);
  await run(process.env.PYTHON || 'python', ['scripts/generate_report.py', csvPath, '--out', publicOut, '--public']);

  for (const out of [privateOut, publicOut]) {
    await fs.access(path.join(out, 'index.html'));
    for (const visual of requiredVisuals) await fs.access(path.join(out, visual));
  }

  const publicHtml = await fs.readFile(path.join(publicOut, 'index.html'), 'utf8');
  if (!publicHtml.includes('Public anonymized summary')) throw new Error(`${item.flavor} public report missing public label`);
  if (!publicHtml.includes(`Excluded invalid rows: ${item.expectedInvalid}`)) throw new Error(`${item.flavor} expected invalid rows ${item.expectedInvalid}`);
  assertNoForbidden(publicHtml, `${item.flavor} public report`);
  if (publicHtml.includes(item.file)) throw new Error(`${item.flavor} public report leaked synthetic usage filename`);

  const firstDataRow = csvText.trim().split(/\r?\n/)[1];
  if (firstDataRow && publicHtml.includes(firstDataRow)) throw new Error(`${item.flavor} public report leaked a raw usage-file row`);
}

console.log(`synthetic-flavors-e2e: OK ${manifest.count} flavors generated private/public reports safely`);
