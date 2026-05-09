import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const files = [
  'README.md',
  'AGENTS.md',
  'CLAUDE.md',
  'SUPPORT.md',
  'docs/privacy.md',
  'docs/methodology.md',
  'docs/gallon-savings-methodology.md',
  'docs/browser-control-safety.md',
  'docs/security-review.md',
  'docs/use-with-ai-tools.md',
  'docs/release-management.md',
  'docs/release-checklist.md',
  'docs/acceptance-criteria.md',
  'docs/backlog.md',
  'docs/data-schema.md',
  'docs/plan-and-status.md',
  'docs/ebmud-review-brief.md',
  'docs/co-release-proposal.md',
  'docs/responsible-use.md',
  'docs/browser-local-proof.md',
  'docs/outreach-email-draft.md',
  'skills/ebmud-buddy/references/browser_workflow.md'
];

let combined = '';
const visibleBom = String.fromCharCode(0x00ef) + String.fromCharCode(0x00bb) + String.fromCharCode(0x00bf);
for (const rel of files) {
  const text = await fs.readFile(path.join(root, rel), 'utf8');
  if (text.includes(visibleBom) || text.includes('\uFFFD')) throw new Error(rel + ' contains visible mojibake');
  if (text.includes('\\uFEFF')) throw new Error(rel + ' contains escaped BOM text');
  if (text.indexOf('\uFEFF') > 0) throw new Error(rel + ' contains misplaced BOM');
  combined += '\n--- ' + rel + ' ---\n' + text;
}

const aiTools = await fs.readFile(path.join(root, 'docs/use-with-ai-tools.md'), 'utf8');
if (!aiTools.startsWith('# Use Mud Buddy With AI Coding Tools')) throw new Error('docs/use-with-ai-tools.md must start with the H1');
for (const rel of ['browser-control-safety.md', 'use-with-ai-tools.md']) {
  const source = await fs.readFile(path.join(root, 'docs', rel), 'utf8');
  const mirror = await fs.readFile(path.join(root, 'public/docs', rel), 'utf8');
  if (source !== mirror) throw new Error('public docs mirror is stale: ' + rel);
}

for (const rel of ['.github/workflows/ci.yml', '.github/workflows/pages.yml']) {
  const workflow = await fs.readFile(path.join(root, rel), 'utf8');
  if (!workflow.includes('npm run validate')) throw new Error(`${rel} must use npm run validate as the release gate`);
}

const required = [
  '--public',
  'Ask before controlling',
  'manual',
  'CSV',
  'npm run validate',
  'npm run generate:synthetic',
  'npm run test:csv-provision',
  'npm run test:synthetic',
  'Not affiliated with EBMUD',
  'Official EBMUD resources',
  'Mud Buddy',
  'A browser-local water-use helper for EBMUD customers.',
  'Product-first branding confirmed',
  'EBMUD review brief',
  'browser-local',
  'Create my report',
  'Built with love in Lafayette, CA',
  'millions of gallons of potential water savings',
  'MUD_BUDDY_REAL_CSV',
  'committed synthetic sample CSV',
  'https://x.com/danieloleary',
  'https://www.linkedin.com/in/danieloleary/',
  "Mud Buddy explains your CSV. EBMUD handles official account, billing, emergency, rebate, conservation, outage, pressure, assistance, and water-quality actions.",
  'heuristic pattern clues',
  'not an official indoor-use classification',
  'not a normalized customer comparison',
  'not affiliated with, endorsed by, approved by, or officially reviewed by EBMUD',
  'unless EBMUD authorizes it in writing',
  'browser-local proof',
  'co-release',
  'recommended next steps',
  '1.2.0',
  'visible evidence layer',
  'pattern read from the CSV',
  'urgent, billing-related, pressure/outage-related, water-quality-related, rebate-related, or assistance-related',
  'Never ask for, store, paste, scrape, log, export, or transmit',
  'https://www.ebmud.com/customers',
  'https://www.ebmud.com/customers/account',
  'https://www.ebmud.com/water/conservation-and-rebates/my-water-report-program',
  'https://www.ebmud.com/customers/billing-questions',
  'https://www.ebmud.com/customers/billing-questions/leaks-and-high-bills',
  'https://www.ebmud.com/water/conservation-and-rebates',
  'https://www.ebmud.com/water/conservation-and-rebates/watersmart-gardener',
  'https://www.ebmud.com/customers/alerts',
  'https://www.ebmud.com/water/about-your-water/water-quality',
  'https://www.ebmud.com/customers/customer-assistance-program',
  'https://www.ebmud.com/contact-us'
];
for (const phrase of required) {
  if (!combined.includes(phrase)) throw new Error('Missing required docs phrase: ' + phrase);
}

const forbidden = [
  'do not upload raw EBMUD CSVs to cloud services',
  'Do not upload raw CSVs by default',
  'Public sharing should use `--redact`',
  'Publishing is opt-in and should use redacted output.',
  'Generate a redacted public report only',
  'Implemented, Pending Validation',
  "The generator may read Dan's local CSV",
  "Mud Buddy for EBMUD - by Dan O'Leary",
  "Mud Buddy for EBMUD Customers - by Dan O'Leary",
  'Mud Buddy by Danno',
  'Compared with similar homes',
  'similar-home context',
  visibleBom
];
for (const phrase of forbidden) {
  if (combined.includes(phrase)) throw new Error('Outdated docs phrase remains: ' + phrase);
}

console.log('docs-consistency: OK v1.2 EBMUD-review-ready docs, browser safety, public-mode docs, and mirrors are aligned');
