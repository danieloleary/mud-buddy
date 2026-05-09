# Mud Buddy by Danno

[![CI](https://github.com/danieloleary/mud-buddy/actions/workflows/ci.yml/badge.svg)](https://github.com/danieloleary/mud-buddy/actions/workflows/ci.yml) [![GitHub Pages](https://github.com/danieloleary/mud-buddy/actions/workflows/pages.yml/badge.svg)](https://github.com/danieloleary/mud-buddy/actions/workflows/pages.yml)

A free, local-first Material 3 water report skill for EBMUD exports.

Mud Buddy turns an EBMUD usage CSV into a clear visual report: gallons-per-day trends, seasonal irrigation patterns, baseline shifts, unusual spikes, public-safe summaries, and practical next steps.

This project is not affiliated with EBMUD. It is not a formal water audit, plumbing inspection, leak detector, billing tool, or official EBMUD analysis. It never needs your EBMUD password.

## Private local report in 5 steps

1. Log into EBMUD yourself in a normal browser session.
2. Download the official usage CSV from the Track Usage/export area.
3. Provide or upload the CSV to Mud Buddy only when you explicitly want it analyzed.
4. Run `python scripts/generate_report.py path/to/your-ebmud-export.csv --out generated/my-private-report`.
5. Open `generated/my-private-report/index.html` locally. If you want to share a public artifact, regenerate with `--public` and run `npm run test:redaction` first.

Mud Buddy never needs your EBMUD password. If you ask an AI coding tool to help with browser control, instruct it to wait while you log in manually and to ask before operating an authenticated browser tab.

## Quick Links

- Live site: `https://danieloleary.github.io/mud-buddy/`
- GitHub repo: `https://github.com/danieloleary/mud-buddy`
- Sample report: open the live site and choose `See sample report`
- Installation: [docs/installation.md](docs/installation.md)
- Privacy: [docs/privacy.md](docs/privacy.md)
- Security: [SECURITY.md](SECURITY.md)
- Methodology: [docs/methodology.md](docs/methodology.md)
- AI tool guide: [docs/use-with-ai-tools.md](docs/use-with-ai-tools.md)
- Release process: [docs/release-management.md](docs/release-management.md)
- Release checklist: [docs/release-checklist.md](docs/release-checklist.md)
- Acceptance criteria: [docs/acceptance-criteria.md](docs/acceptance-criteria.md)
- Backlog: [docs/backlog.md](docs/backlog.md)

## Why

Household water data is useful, but raw CSVs are hard to interpret. Mud Buddy helps regular households answer better questions:

- Did our baseline change?
- Was the jump mostly irrigation?
- Which period deserves attention?
- What should we check first?

## Privacy Boundary

Water usage can reveal household routines. The default workflow is local-first:

- Your CSV may be provided to Mud Buddy or an AI coding agent when you explicitly request analysis.
- Raw private CSVs stay local unless you deliberately choose another workflow.
- No account is required for the local workflow.
- Do not paste EBMUD credentials into Codex, Claude Code, Lovable, or any chat tool.
- Public sharing should use `--public`; `--redact` removes identifiers but is not full anonymization.
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
python scripts/generate_report.py "path/to/your-ebmud-export.csv" --out "my-public-report" --public
npm run test:redaction
```

Before sharing, review [docs/public-sharing-checklist.md](docs/public-sharing-checklist.md).

## Install The Codex Skill

The reusable Codex skill lives in:

```text
skills/ebmud-buddy
```

Install command once the repo is public:

```text
$skill-installer install https://github.com/danieloleary/mud-buddy/tree/main/skills/ebmud-buddy
```

## Use With Claude Code, Codex, Or Lovable

See [docs/use-with-ai-tools.md](docs/use-with-ai-tools.md) for simple copy-paste prompts. Claude Code users should also read [CLAUDE.md](CLAUDE.md).

## Browser-Assisted Workflow

The agent-assisted workflow is user-supervised but can be end-to-end after manual login:

- User logs into EBMUD manually.
- Mud Buddy does not handle passwords, MFA, cookies, localStorage, sessionStorage, auth headers, or session tokens.
- An AI coding agent may help navigate to usage/export screens after login.
- The agent may detect the downloaded CSV in Chrome Downloads or ask the user for the CSV path.
- The agent asks before processing the CSV, then generates a private local report.
- If the portal is unclear, stop and manually download the CSV.

See [docs/browser-control-safety.md](docs/browser-control-safety.md) and [skills/ebmud-buddy/references/browser_workflow.md](skills/ebmud-buddy/references/browser_workflow.md).

## Synthetic Test Datasets

Mud Buddy can derive 20 ignored, anonymized EBMUD-style CSV flavors from Dan's local export for realistic parser and report testing. Dan's raw CSV stays outside the repo; generated flavors live under `tests/output/synthetic-flavors/`, which is ignored by Git.

```bash
npm run generate:synthetic
npm run test:synthetic
```

The only committed CSV remains `examples/sample-ebmud-usage.csv`.

## Test, Release, And Debug

```bash
npm run debug:report
npm run test:landing
npm run test:report
npm run test:browser-flow
npm run test:privacy
npm run test:docs
npm run test:redaction
npm run validate
```

The browser-flow test uses a synthetic local mock portal. It does not automate real EBMUD credentials. Release steps are documented in [docs/release-management.md](docs/release-management.md).

## Launch Status

Early public release. Feedback welcome from EBMUD customers, Codex users, Claude Code users, Lovable users, civic-tech folks, homeowners, renters, gardeners, and local water conservation people.
