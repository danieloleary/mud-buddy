import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
if (!args.length) {
  console.error('Usage: node scripts/run_python.mjs <script.py> [...args]');
  process.exit(1);
}

const command = process.platform === 'win32' ? 'python' : 'python3';
const result = spawnSync(command, args, { stdio: 'inherit' });

if (result.error) {
  console.error(`Failed to run ${command}: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
