# CLAUDE.md

Guidance for Claude Code when working on Mud Buddy.

@AGENTS.md

## Start Here

Read these files before making changes:

- `README.md`
- `package.json`
- `docs/privacy.md`
- `docs/browser-control-safety.md`
- `docs/security-review.md`
- `docs/use-with-ai-tools.md`

`AGENTS.md` is the canonical cross-agent policy. This file adapts it for Claude Code.

## Product Boundary

Mud Buddy is a local-first EBMUD CSV report generator and public demo site. It is not affiliated with EBMUD and is not a formal water audit, leak detector, plumbing inspection, billing tool, or official utility analysis.

Avoid overclaiming. Prefer phrases like "possible leak clues" and "patterns worth checking," not certified diagnosis.

## CSV Handling

It is OK for a user to provide or upload an EBMUD usage CSV to Mud Buddy or to an AI coding agent working in this local repo when they explicitly ask for analysis. Treat the CSV as sensitive local data.

Never publish, commit, paste into public docs, or include raw private CSV data in public artifacts. Use `--public` plus the redaction scan before sharing anything publicly.

## Browser Safety

If browser assistance is requested:

- Ask before controlling a real EBMUD browser session.
- Let the user complete login, password, MFA, CAPTCHA, security questions, and consent prompts manually.
- After the user confirms login, navigate only to official usage, Track Usage, export, or CSV download screens.
- Prefer official controls labeled like `Download your data`, `Export`, or `CSV`.
- Detect the downloaded CSV in the browser download location or ask the user to identify it.
- Ask before processing a detected CSV.
- Do not change billing, autopay, contact, account, service, household profile, or settings pages.
- If anything is ambiguous, stop and ask the user to download the CSV manually.

Never ask for, store, paste, scrape, log, export, or transmit EBMUD usernames, passwords, MFA codes, cookies, localStorage, sessionStorage, auth headers, session tokens, CAPTCHA responses, or security-question answers.

## Commands

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
npm run test:privacy
npm run test:redaction
npm run test:subpath
npm run test:docs
npm run validate
```

Private report:

```bash
python scripts/generate_report.py path/to/your-ebmud-export.csv --out generated/my-private-report
```

Public-safe report:

```bash
python scripts/generate_report.py path/to/your-ebmud-export.csv --out generated/public-report --public
npm run test:redaction
```

Use `/doctor`, `/debug`, `/diff`, and `/review` when useful. When something fails, report the exact command, exact error, likely cause, and smallest safe fix.
