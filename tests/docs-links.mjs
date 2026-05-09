import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
const scripts = new Set(Object.keys(packageJson.scripts || {}));
const mdFiles = [];
async function walk(dir) {
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (['.git', 'node_modules', 'dist', 'generated', 'public-site', 'tests/output'].some((skip) => rel === skip || rel.startsWith(skip + '/'))) continue;
      await walk(full);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      mdFiles.push(full);
    }
  }
}
await walk(root);
for (const file of mdFiles) {
  const relFile = path.relative(root, file).replace(/\\/g, '/');
  const text = await fs.readFile(file, 'utf8');
  for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    let href = match[1].trim().split(/\s+/)[0].replace(/^<|>$/g, '');
    if (!href || href.startsWith('#') || /^[a-z]+:/i.test(href) || href.startsWith('mailto:')) continue;
    href = href.split('#')[0];
    if (!href) continue;
    const target = path.resolve(path.dirname(file), decodeURIComponent(href));
    try { await fs.access(target); }
    catch { throw new Error(`${relFile} has broken relative link: ${match[1]}`); }
  }
  for (const match of text.matchAll(/npm run ([\w:-]+)/g)) {
    const script = match[1];
    if (!scripts.has(script)) throw new Error(`${relFile} documents missing npm script: ${script}`);
  }
  if (/v0\.1\.0/.test(text)) throw new Error(`${relFile} still references stale v0.1.0 release target`);
}
const publicDocsDir = path.join(root, 'public', 'docs');
try {
  const publicDocs = await fs.readdir(publicDocsDir);
  for (const name of publicDocs.filter((n) => n.endsWith('.md'))) {
    const source = path.join(root, 'docs', name);
    try { await fs.access(source); } catch { continue; }
    const [a, b] = await Promise.all([fs.readFile(source, 'utf8'), fs.readFile(path.join(publicDocsDir, name), 'utf8')]);
    if (a !== b) throw new Error(`public docs mirror is stale: ${name}`);
  }
} catch {}
const validate = packageJson.scripts.validate || '';
for (const required of ['test:data-contract', 'test:redaction-fixtures', 'test:package-policy', 'test:browser-flow-safety', 'test:docs-links']) {
  if (!validate.includes(required)) throw new Error(`validate does not include ${required}`);
}
console.log(`docs-links: OK ${mdFiles.length} markdown files have valid relative links and script references`);