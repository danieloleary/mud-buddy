import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public-site');
const zipPath = path.join(publicDir, 'water-buddy-by-danno.zip');
const staging = path.join(os.tmpdir(), 'mud-buddy-public-zip');
const excludeParts = new Set(['node_modules', '.git', '.herenow', 'dist', 'public-site', 'generated', '__pycache__', '.pytest_cache', 'test-results', 'playwright-report']);
const excludeNames = new Set(['water_usage_scroll_report.html']);

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}
async function copyIfExists(src, dest) {
  if (await exists(src)) await fs.cp(src, dest, { recursive: true });
}
function allowed(relParts, name) {
  if (relParts.some((part) => excludeParts.has(part))) return false;
  if (excludeNames.has(name)) return false;
  if (name.endsWith('.zip')) return false;
  if (name.endsWith('.csv') && name !== 'sample-ebmud-usage.csv') return false;
  if (relParts.includes('validation-report') || relParts.includes('output')) return false;
  if (name.endsWith('.pyc')) return false;
  return true;
}
async function copyFiltered(srcDir, destDir, relParts = []) {
  await fs.mkdir(destDir, { recursive: true });
  for (const entry of await fs.readdir(srcDir, { withFileTypes: true })) {
    const nextRel = [...relParts, entry.name];
    if (!allowed(nextRel, entry.name)) continue;
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) await copyFiltered(src, dest, nextRel);
    else if (entry.isFile()) await fs.copyFile(src, dest);
  }
}
async function run(cmd, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit' });
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`)));
  });
}

await fs.rm(publicDir, { recursive: true, force: true });
await fs.mkdir(publicDir, { recursive: true });
await copyIfExists(path.join(root, 'dist'), publicDir);
await copyIfExists(path.join(root, 'generated', 'sample-report'), path.join(publicDir, 'sample-report'));
await copyIfExists(path.join(root, 'examples', 'screenshots'), path.join(publicDir, 'assets'));
await copyIfExists(path.join(root, 'docs'), path.join(publicDir, 'docs'));

await fs.rm(staging, { recursive: true, force: true });
await copyFiltered(root, staging);
await fs.rm(zipPath, { force: true });
await run(process.env.PYTHON || 'python', [
  '-c',
  'import pathlib, sys, zipfile; root=pathlib.Path(sys.argv[1]); out=pathlib.Path(sys.argv[2]); out.parent.mkdir(parents=True, exist_ok=True); z=zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED); [z.write(p, p.relative_to(root).as_posix()) for p in root.rglob("*") if p.is_file()]; z.close()',
  staging,
  zipPath,
]);
console.log(`package_public_site: wrote ${publicDir}`);
console.log(`package_public_site: wrote ${zipPath}`);

