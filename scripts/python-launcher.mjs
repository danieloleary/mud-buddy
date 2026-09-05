import { spawn, spawnSync } from 'node:child_process';

// Central Python launcher: `python` then `python3` fallback, with PYTHON env override.
// Use this instead of hardcoding `process.env.PYTHON || 'python'` so python3-only
// machines (no `python` on PATH) work without extra shims.
export function pythonCommands() {
  if (process.env.PYTHON) return [process.env.PYTHON];
  if (process.platform === 'win32') return ['python'];
  return ['python', 'python3'];
}

export function resolvePython() {
  const commands = pythonCommands();
  for (const command of commands) {
    const probe = spawnSync(command, ['--version'], { stdio: 'ignore' });
    if (!probe.error) return command;
  }
  return commands[0];
}

// Drop-in async replacement for `spawn(py, args, options)` with fallback.
export function spawnPython(args, options = {}) {
  return spawn(resolvePython(), args, options);
}

// Drop-in sync replacement for `spawnSync(py, args, options)` with fallback.
export function spawnPythonSync(args, options = {}) {
  const commands = pythonCommands();
  let lastResult;
  for (const command of commands) {
    const result = spawnSync(command, args, options);
    if (result.error?.code === 'ENOENT') {
      lastResult = result;
      continue;
    }
    return result;
  }
  return lastResult;
}
