
## Copy-paste safety rule for every AI tool

Before real browser control, paste this instruction:

```text
Ask before controlling my real EBMUD browser session. Never type or request my password, MFA code, cookies, localStorage, sessionStorage, authorization headers, billing settings, autopay, contact/profile pages, or screenshots of authenticated private pages. Wait while I log in manually, then help me use the official Track Usage/export/download controls only. If anything is ambiguous, stop and ask me to download the CSV manually.
```

Private local report command:

```bash
python scripts/generate_report.py path/to/your-ebmud-export.csv --out generated/my-private-report
```

Public sharing command:

```bash
python scripts/generate_report.py path/to/your-ebmud-export.csv --out generated/public-report --public
npm run test:redaction
```

﻿# Use Mud Buddy With AI Coding Tools

These are simple copy-paste recipes for people who want Claude Code, Codex, or Lovable to help run, customize, test, or debug Mud Buddy.

## Claude Code

Official docs: [Claude Code setup](https://docs.anthropic.com/en/docs/claude-code/getting-started), [Claude Code commands](https://code.claude.com/docs/en/commands).

Clone the repo, open it, then start Claude Code:

```bash
git clone https://github.com/danieloleary/mud-buddy.git
cd mud-buddy
claude
```

Paste this into Claude Code:

```text
You are helping me use Mud Buddy, a local-first EBMUD CSV report generator. Read README.md, AGENTS.md, package.json, docs/privacy.md, and docs/security-review.md first. Do not ask for or handle EBMUD credentials, MFA codes, cookies, session storage, local storage, auth headers, account numbers, addresses, meter IDs, or raw customer data beyond local files I explicitly provide. Help me run the documented setup, generate the synthetic sample report, start the dev site, and run the test/debug scripts. If anything fails, show the exact command, error, likely cause, and smallest safe fix. Use /doctor, /debug, /diff, and /review when useful.
```

## Codex

Official docs: [Codex skills](https://developers.openai.com/codex/skills/), [Codex AGENTS.md](https://developers.openai.com/codex/guides/agents-md).

Clone the repo, open it in Codex, then ask Codex to follow the repo instructions:

```bash
git clone https://github.com/danieloleary/mud-buddy.git
cd mud-buddy
codex
```

Paste this into Codex:

```text
Use the Mud Buddy repo instructions. Read AGENTS.md and README.md first. Keep the workflow local-first and privacy-preserving. Do not automate EBMUD credentials, MFA, CAPTCHA, cookies, localStorage, sessionStorage, auth headers, or session tokens. Generate the synthetic sample report, run the app, and use the documented scripts for testing/debugging. Before any public artifact, run the redaction scan and confirm no address, account number, meter ID, raw CSV, local path, or absence/vacation pattern is present.
```

To install the bundled Codex skill from a public GitHub repo once Dan publishes it:

```text
$skill-installer install https://github.com/danieloleary/mud-buddy/tree/main/skills/ebmud-buddy
```

## Lovable

Official docs: [Lovable GitHub integration](https://docs.lovable.dev/integrations/github), [Lovable troubleshooting](https://docs.lovable.dev/tips-tricks/troubleshooting), [Lovable debugging prompts](https://docs.lovable.dev/prompting/prompting-debugging).

Important: Lovable's GitHub integration is primarily for syncing Lovable-created projects with GitHub. Do not promise that Lovable can directly import this existing repo as a first-class Lovable project. Use Lovable for a new companion UI, landing page remix, or prompt-generated prototype that follows Mud Buddy's rules.

Paste this into Lovable:

```text
Build a clean local-first landing/demo page for Mud Buddy by Danno, a free EBMUD CSV water-usage report generator. Keep the brand calm, civic-tech, and privacy-forward. The page should explain: export EBMUD CSV manually, process locally, generate a private report, use redacted mode for public sharing. Include CTAs for GitHub, sample report, privacy notes, and installation. Do not build a login flow. Do not ask for EBMUD credentials. Do not upload raw CSVs by default. Use copy that says "possible leak clues" and "patterns worth checking," not certified diagnosis. Add a clear footer: Not affiliated with EBMUD.
```

## Common Local Commands

```bash
npm ci
npx playwright install chromium
npm run generate:sample
npm run dev
npm run build
npm run package:public
npm run test:landing
npm run test:report
npm run test:browser-flow
npm run test:redaction
```

If the app fails to start, copy the full terminal error into your AI tool and ask it to diagnose the smallest safe fix. If the page is blank, ask it to check the Vite output, browser console, missing assets, and dependency install errors.
