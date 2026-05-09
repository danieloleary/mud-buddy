import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const tmp = path.join(os.tmpdir(), 'mud-buddy-sample-report');
const dest = path.join(root, 'generated', 'sample-report');
await fs.rm(tmp, { recursive: true, force: true });
await fs.rm(dest, { recursive: true, force: true });
await fs.mkdir(tmp, { recursive: true });
await fs.mkdir(path.dirname(dest), { recursive: true });
await new Promise((resolve, reject) => {
  const child = spawn(process.env.PYTHON || 'python', ['scripts/generate_report.py', 'examples/sample-ebmud-usage.csv', '--out', tmp, '--public'], { cwd: root, stdio: 'inherit' });
  child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`report generator exited ${code}`)));
});
await fs.cp(tmp, dest, { recursive: true });
console.log(`generate_sample_report: copied ${tmp} -> ${dest}`);
