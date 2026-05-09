import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'tests', 'output', 'privacy-fixture');
await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(output, { recursive: true });
const csv = path.join(output, 'Billing Usage for 9999999999.csv');
await fs.writeFile(csv, `Account Number,Reading Date,Days in Read Period,Meter Reading,CCF,Customer GPD,Average Households GPD,Top 20% GPD,WaterScore,Meter Class,Meter\n9999999999,2025-01-30,30,,6.4,160,145,90,Above,SFR,MTR-PRIVATE-777\n9999999999,2025-07-30,30,,14.2,354,260,150,High,SFR,MTR-PRIVATE-777\n`, 'utf8');
const publicOut = path.join(output, 'public-report');
await new Promise((resolve, reject) => {
  const child = spawn(process.env.PYTHON || 'python', ['scripts/generate_report.py', csv, '--out', publicOut, '--public', '--address', '123 Private Oak Drive', '--household', 'Family vacation July 10-20', '--irrigation', 'Meter MTR-PRIVATE-777'], { cwd: root, stdio: 'inherit' });
  child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`public generator exited ${code}`)));
});
let combined = '';
for (const name of await fs.readdir(publicOut)) {
  const file = path.join(publicOut, name);
  if ((await fs.stat(file)).isFile()) combined += await fs.readFile(file, 'utf8');
}
for (const forbidden of ['123 Private Oak Drive', '9999999999', 'MTR-PRIVATE-777', 'Billing Usage for 9999999999', 'Family vacation July 10-20', 'Peak: 354 GPD']) {
  if (combined.includes(forbidden)) throw new Error(`Public mode leaked forbidden value: ${forbidden}`);
}
if (!combined.includes('Peak bucket')) throw new Error('Public mode did not suppress exact peak label');
console.log('privacy-behavior: OK --public buckets values and removes identifiers/context');
