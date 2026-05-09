import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const files = [
  'README.md',
  'AGENTS.md',
  'CLAUDE.md',
  'docs/privacy.md',
  'docs/browser-control-safety.md',
  'docs/security-review.md',
  'docs/use-with-ai-tools.md',
  'docs/release-management.md',
  'docs/release-checklist.md',
  'docs/acceptance-criteria.md',
  'docs/backlog.md',
  'skills/ebmud-buddy/references/browser_workflow.md'
];

let combined = '';
for (const rel of files) {
  const text = await fs.readFile(path.join(root, rel), 'utf8');
  if (text.includes('???')) throw new Error(`${rel} contains visible BOM/mojibake`);
  combined += `
--- ${rel} ---
${text}`;
}

const required = [
  '--public',
  'Ask before controlling',
  'manual',
  'CSV',
  'npm run validate',
  'npm run generate:synthetic',
  'Not affiliated with EBMUD'
];
for (const phrase of required) {
  if (!combined.includes(phrase)) throw new Error(`Missing required docs phrase: ${phrase}`);
}

const forbidden = [
  'do not upload raw EBMUD CSVs to cloud services',
  'Do not upload raw CSVs by default',
  'Public sharing should use `--redact`',
  'Publishing is opt-in and should use redacted output.',
  'Generate a redacted public report only'
];
for (const phrase of forbidden) {
  if (combined.includes(phrase)) throw new Error(`Outdated docs phrase remains: ${phrase}`);
}

console.log('docs-consistency: OK CSV consent, browser safety, and public-mode docs are aligned');
