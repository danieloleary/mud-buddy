import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const py = process.env.PYTHON || 'python';
const tempHome = path.join(root, 'tests', 'output', 'synthetic-source-home');
const outDir = path.join(root, 'tests', 'output', 'synthetic-source-policy');

await fs.rm(tempHome, { recursive: true, force: true });
await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(path.join(tempHome, 'Downloads'), { recursive: true });

const fakePrivateCsv = `Account Number,Reading Date,Days in Read Period,Meter Reading,CCF,Customer GPD,Average Households GPD,Top 20% GPD,WaterScore,Meter Class,Meter
PRIVATE-DOWNLOAD-SHOULD-NOT-BE-USED,2026-01-01,30,,9,224,150,90,high,SFR,PRIVATE-METER
`;
await fs.writeFile(path.join(tempHome, 'Downloads', 'Billing Usage Private Trap.csv'), fakePrivateCsv, 'utf8');

await new Promise((resolve, reject) => {
  const child = spawn(py, ['scripts/generate_synthetic_flavors.py', '--out', outDir], {
    cwd: root,
    env: {
      ...process.env,
      HOME: tempHome,
      USERPROFILE: tempHome
    },
    stdio: 'inherit'
  });
  child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`generate_synthetic_flavors exited ${code}`)));
});

const manifest = JSON.parse(await fs.readFile(path.join(outDir, 'manifest.json'), 'utf8'));
if (manifest.count !== 20) throw new Error(`Expected 20 synthetic flavors, found ${manifest.count}`);
if (manifest.flavors.some((flavor) => flavor.rows <= 1)) {
  throw new Error('Synthetic generator appears to have used the fake one-row Downloads CSV instead of the committed sample');
}

const generatedText = await fs.readFile(path.join(outDir, manifest.flavors[0].file), 'utf8');
for (const forbidden of ['PRIVATE-DOWNLOAD-SHOULD-NOT-BE-USED', 'PRIVATE-METER', 'Billing Usage Private Trap']) {
  if (generatedText.includes(forbidden)) throw new Error(`Private Downloads trap leaked into generated synthetic CSV: ${forbidden}`);
}

console.log(`synthetic-source-policy: OK default synthetic generation used committed sample data on ${os.platform()}`);
