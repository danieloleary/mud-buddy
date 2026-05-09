# AGENTS.md

Guidance for AI coding agents working on Mud Buddy.

## Product Boundary

Mud Buddy is a local-first EBMUD CSV report generator and public demo site. It is not affiliated with EBMUD and is not a formal water audit, leak detector, plumbing inspection, billing tool, or official utility analysis.

## Safety Rules

- Never ask for, store, paste, scrape, log, export, or transmit EBMUD usernames, passwords, MFA codes, cookies, localStorage, sessionStorage, auth headers, session tokens, CAPTCHA responses, or security-question answers.
- User login to EBMUD is always manual. Browser assistance may resume only after the user confirms they are logged in.
- Do not change EBMUD billing, autopay, contact, account, service, household profile, or settings pages.
- Process raw CSV files locally by default. Users may explicitly provide or upload a CSV to Mud Buddy/local agents for analysis; treat it as sensitive and never publish or commit raw private CSV data.
- Before creating public artifacts, run redaction checks and confirm no address, account number, meter ID, raw CSV, local path, or exact absence/vacation pattern is present.

## Development Commands

Use documented scripts unless the user asks for something else:

```bash
npm ci
npm run generate:sample
npm run build
npm run package:public
npm run test:landing
npm run test:report
npm run test:browser-flow
npm run test:redaction
npm run test:docs
npm run validate
```

Install Playwright Chromium before browser tests when needed:

```bash
npx playwright install chromium
```

## Editing Guidance

Keep changes small and explain tradeoffs. Preserve the local-first privacy model. Avoid overclaiming: use "possible leak clues" and "patterns worth checking," not certified diagnosis.
