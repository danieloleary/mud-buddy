import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const site = path.join(root, 'public-site');
let port = 0;
const basePath = '/mud-buddy/';
const mime = new Map([['.html','text/html'],['.js','text/javascript'],['.css','text/css'],['.svg','image/svg+xml'],['.zip','application/zip'],['.md','text/markdown']]);
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    if (!url.pathname.startsWith(basePath)) { res.writeHead(404).end(); return; }
    let rel = decodeURIComponent(url.pathname.slice(basePath.length));
    if (!rel || rel.endsWith('/')) rel += 'index.html';
    const file = path.resolve(site, rel);
    if (!file.startsWith(path.resolve(site))) { res.writeHead(403).end(); return; }
    const data = await fs.readFile(file);
    res.writeHead(200, { 'content-type': mime.get(path.extname(file)) || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});
port = server.address().port;
try {
  const url = `http://127.0.0.1:${port}${basePath}`;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(url);
  const body = await page.locator('body').innerText();
  if (!body.includes('Mud Buddy by Danno')) throw new Error('Subpath landing failed to render');
  const report = await fetch(`${url}sample-report/index.html`);
  const privacy = await fetch(`${url}docs/privacy.md`);
  const zip = await fetch(`${url}mud-buddy-by-danno.zip`);
  if (!report.ok || !privacy.ok || !zip.ok) throw new Error(`Subpath asset missing report=${report.status} privacy=${privacy.status} zip=${zip.status}`);
  await browser.close();
  console.log('subpath-smoke: OK public-site works under /mud-buddy/');
} finally {
  server.close();
}
