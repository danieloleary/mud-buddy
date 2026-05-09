# Mud Buddy Plan and Status

Updated: 2026-05-09

## Current Product Direction

Mud Buddy by Danno is a free, local-first EBMUD water-usage analysis project.

The goal is to help EBMUD customers turn their official usage CSV export into a private, plain-English report with trends, seasonal signals, possible leak clues, irrigation patterns, and practical next steps.

Canonical public home:

- GitHub repo: https://github.com/danieloleary/mud-buddy
- GitHub Pages site: https://danieloleary.github.io/mud-buddy/

Important positioning:

- Not affiliated with EBMUD.
- Not a certified leak detector, billing audit, plumbing inspection, or official EBMUD analysis.
- Local-first by default.
- User may explicitly provide/upload a CSV for private local analysis.
- Credentials, MFA, CAPTCHA, cookies, localStorage, sessionStorage, auth headers, and session tokens are always off limits.
- Mud Buddy helps interpret exported CSV data; official account, billing, emergency, rebate, conservation, outage, pressure, assistance, and water-quality actions happen on EBMUD's site.

## Current Release Target

Version target: 0.5.0

Implemented for v0.5.0:

- Synthetic SVG visual system for landing page, README, and social preview.
- Official EBMUD resource directory for public customer pages.
- Stronger agent/browser routing for urgent, billing, outage, pressure, water-quality, rebate, and assistance topics.
- GitHub issue templates, PR template, Dependabot, support docs, code of conduct, and citation metadata.
- Package/redaction policy for known public SVG assets and community files.

## Security Rules To Preserve

Never automate or store:

- EBMUD username or password.
- MFA codes.
- CAPTCHA flows.
- Cookies.
- Browser localStorage or sessionStorage.
- Auth headers.
- Session tokens.
- Authenticated screenshots.
- Billing, autopay, contact, settings, or profile changes.

Allowed workflow:

1. Open the official EBMUD portal.
2. Human logs in manually.
3. Agent waits for explicit user confirmation.
4. Agent navigates only to usage/export/download screens.
5. Agent uses the official CSV download control.
6. Agent detects the downloaded CSV in Chrome Downloads when possible.
7. Agent asks before processing the downloaded CSV.
8. Mud Buddy generates a private local report first.
9. User must choose `--public` plus pass redaction checks before sharing.

Public artifacts must exclude:

- Name.
- Service address.
- Account number.
- Meter ID.
- Raw CSV rows.
- Local file paths.
- Real private filenames.
- Authenticated browser traces.
- Exact occupancy or vacation patterns.

## Synthetic Dataset Factory Status

The repo has an ignored synthetic dataset factory:

- Script: `scripts/generate_synthetic_flavors.py`
- Test: `tests/synthetic-flavors-e2e.mjs`
- Output: `tests/output/synthetic-flavors/`

The output folder is ignored and should not be committed. The only committed CSV should remain `examples/sample-ebmud-usage.csv`.

## Backlog

Near-term:

- Run full v0.5 release gate.
- Confirm GitHub README images render.
- Confirm GitHub Pages site renders visuals and official-resource cards.
- Confirm public ZIP scan passes.
- Confirm no private local source identifiers appear in repo, public site, or ZIP.

Medium-term:

- Add drag-and-drop CSV local-only browser report generation.
- Add optional client-side-only CSV parsing in the static site.
- Add a downloadable public-safe report bundle.
- Add irrigation-focused interpretation helpers.
- Add toilets/constant-baseline leak clue explainer.

Later:

- Make a polished demo video.
- Prepare Show HN post.
- Prepare Product Hunt assets after real users try it.
- Add screenshots from synthetic sample reports.
- Consider packaged releases through GitHub Releases.

## Launch Checklist

Before sharing publicly:

- `npm run validate` passes.
- GitHub Actions CI passes.
- GitHub Pages deploy passes.
- Live landing page loads.
- Sample report loads.
- Docs links work.
- Public ZIP downloads.
- Public ZIP scan passes.
- No real EBMUD CSV is committed.
- No real address/account/meter/local path appears in repo or public site.
- README clearly says local-first and not affiliated with EBMUD.
- Browser workflow clearly refuses credential/session automation.
- Official EBMUD resource links point to public pages only.
- Social copy avoids overclaiming leak detection or official analysis.

## v0.5.0 QA hardening

Current QA target:

- Full `npm run validate` release gate.
- Local-only real CSV gate through `npm run test:local-real-csv` when a real export is available.
- Synthetic data-contract assertions for all 20 flavors.
- Standalone generated-report redaction scanning.
- Package ZIP policy checks.
- Redaction negative fixtures.
- Browser-flow safety checks.
- Docs link/script consistency checks.

Known local-only fact from Dan's current export: the local report path has generated a private report with 32 valid rows, 1 invalid row, 483.0 CCF, and baseline 182 GPD. This fact is not committed as a test fixture and should not be used in CI because the real CSV is private and may change.