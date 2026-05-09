import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'tests', 'output', 'csv-provision');
await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(output, { recursive: true });

const csvPath = path.join(output, 'explicit-user-provided-ebmud.csv');
await fs.writeFile(csvPath, `Account Number,Reading Date,Days in Read Period,Meter Reading,CCF,Customer GPD,Average Households GPD,Top 20% GPD,WaterScore,Meter Class,Meter\nPRIVATE-LOCAL,2026-01-30,30,,6.0,150,200,110,Good,SFR,METER-LOCAL\nPRIVATE-LOCAL,2026-02-28,29,,6.5,168,205,115,Good,SFR,METER-LOCAL\n`, 'utf8');

const privateOut = path.join(output, 'private-report');
await new Promise((resolve, reject) => {
  const child = spawn(process.env.PYTHON || 'python', ['scripts/generate_report.py', csvPath, '--out', privateOut], { cwd: root, stdio: 'inherit' });
  child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`private report generator exited ${code}`)));
});
const html = await fs.readFile(path.join(privateOut, 'index.html'), 'utf8');
if (!html.includes('Private local report')) throw new Error('Explicit CSV provision should generate a private local report by default');
if (!html.includes('explicit-user-provided-ebmud.csv')) throw new Error('Private report should be allowed to reference the local user-provided CSV filename');
console.log('csv-provision-policy: OK explicit CSV provision is allowed for private local reports');
