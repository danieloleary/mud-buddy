import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
if (!args.length) {
  console.error('Usage: node scripts/run_python.mjs <script.py> [...args]');
  process.exit(1);
}

const commands = process.env.PYTHON
  ? [process.env.PYTHON]
  : (process.platform === 'win32' ? ['python'] : ['python', 'python3']);

let lastError;
for (const command of commands) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.error?.code === 'ENOENT') {
    lastError = result.error;
    continue;
  }
  if (result.error) {
    console.error(`Failed to run ${command}: ${result.error.message}`);
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}

console.error(`Failed to run Python: ${lastError?.message || 'no executable found'}`);
process.exit(1);
