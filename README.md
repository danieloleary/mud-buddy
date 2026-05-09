
## Private local report in 5 steps

1. Log into EBMUD yourself in a normal browser session.
2. Download the official usage CSV from the Track Usage/export area.
3. Keep the CSV on your own computer; do not upload it to Mud Buddy.
4. Run `python scripts/generate_report.py path/to/your-ebmud-export.csv --out generated/my-private-report`.
5. Open `generated/my-private-report/index.html` locally. If you want to share a public artifact, regenerate with `--public` and run `npm run test:redaction` first.

Mud Buddy never needs your EBMUD password. If you ask an AI coding tool to help with browser control, instruct it to wait while you log in manually and to ask before operating an authenticated browser tab.

﻿# Mud Buddy by Danno

[![CI](https://github.com/danieloleary/mud-buddy/actions/workflows/ci.yml/badge.svg)](https://github.com/danieloleary/mud-buddy/actions/workflows/ci.yml) [![GitHub Pages](https://github.com/danieloleary/mud-buddy/actions/workflows/pages.yml/badge.svg)](https://github.com/danieloleary/mud-buddy/actions/workflows/pages.yml)

A free, local-first Material 3 water report skill for EBMUD exports.

Mud Buddy turns an EBMUD usage CSV into a clear visual report: gallons-per-day trends, seasonal irrigation patterns, baseline shifts, unusual spikes, public-safe redaction, and practical next steps.

This project is not affiliated with EBMUD. It is not a formal water audit, plumbing inspection, leak detector, billing tool, or official EBMUD analysis. It never needs your EBMUD password.

## Quick Links

- Live site: `https://danieloleary.github.io/mud-buddy/`
- GitHub repo: `https://github.com/danieloleary/mud-buddy`
- Sample report: open the live site and choose `View sample report`
- Installation: [docs/installation.md](docs/installation.md)
- Privacy: [docs/privacy.md](docs/privacy.md)
- Security: [SECURITY.md](SECURITY.md)
- Methodology: [docs/methodology.md](docs/methodology.md)
- AI tool guide: [docs/use-with-ai-tools.md](docs/use-with-ai-tools.md)

## Why

Household water data is useful, but raw CSVs are hard to interpret. Mud Buddy helps regular households answer better questions:

- Did our baseline change?
- Was the jump mostly irrigation?
- Which period deserves attention?
- What should we check first?

## Privacy Boundary

Water usage can reveal household routines. The default workflow is local-first:

- Your CSV stays on your machine.
- No account is required for the local workflow.
- Do not paste EBMUD credentials into Codex, Claude Code, Lovable, or any chat tool.
- Public sharing should use `--redact`.
- Browser assistance starts only after the user logs into EBMUD manually.

## Try The Synthetic Sample

```bash
npm ci
npx playwright install chromium
npm run generate:sample
npm run dev
```

Then open the local Vite URL and use the sample report CTA.

## Use Your Own EBMUD Export Locally

Download your EBMUD usage CSV from the My Water Report / Track Usage area, then run:

```bash
python scripts/generate_report.py "path/to/your-ebmud-export.csv" --out "my-water-report"
```

Open `my-water-report/index.html` on your machine.

For a public-safe version:

```bash
python scripts/generate_report.py "path/to/your-ebmud-export.csv" --out "my-public-report" --redact
```

Before sharing, review [docs/public-sharing-checklist.md](docs/public-sharing-checklist.md).

## Install The Codex Skill

The reusable Codex skill lives in:

```text
skills/ebmud-buddy
```

Future install command once Dan publishes the repo:

```text
$skill-installer install https://github.com/danieloleary/mud-buddy/tree/main/skills/ebmud-buddy
```

## Use With Claude Code, Codex, Or Lovable

See [docs/use-with-ai-tools.md](docs/use-with-ai-tools.md) for simple copy-paste prompts.

## Browser-Assisted Workflow

The secure workflow is user-supervised:

- User logs into EBMUD manually.
- Mud Buddy does not handle passwords, MFA, cookies, localStorage, sessionStorage, auth headers, or session tokens.
- An AI coding agent may help navigate to usage/export screens after login.
- If the portal is unclear, stop and manually download the CSV.

See [docs/browser-control-safety.md](docs/browser-control-safety.md) and [skills/ebmud-buddy/references/browser_workflow.md](skills/ebmud-buddy/references/browser_workflow.md).

## Test And Debug

```bash
npm run debug:report
npm run test:landing
npm run test:report
npm run test:browser-flow
npm run test:redaction
npm run validate
```

The browser-flow test uses a synthetic local mock portal. It does not automate real EBMUD credentials.

## Launch Status

Early public release. Feedback welcome from EBMUD customers, Codex users, Claude Code users, Lovable users, civic-tech folks, homeowners, renters, gardeners, and local water conservation people.

