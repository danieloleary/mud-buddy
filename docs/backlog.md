# Backlog

## Current 1.2.x App State

- Browser-local app is live on GitHub Pages.
- Landing page and analyzer/report flow are separated.
- Homeowners can analyze EBMUD usage data in the browser without a server upload.
- Browser report includes a start-here finding, evidence layer, money/water opportunity clues, recommended next checks, and official EBMUD routing.
- Parser, JS/Python parity, synthetic data, browser upload, no-network, privacy, redaction, package-policy, docs, and subpath tests are covered by `npm run validate`.
- Dan's private usage file gate is explicit and local-only through `MUD_BUDDY_REAL_CSV`.
- Public partner material is consolidated in `docs/partner-note.md`.

## Must Finish Before Broad Launch

- Run `npm run validate` on the final release commit.
- Run `MUD_BUDDY_REAL_CSV="path/to/private.csv" npm run test:local-real-csv` locally.
- Confirm GitHub Actions CI and Pages deploy pass on `main`.
- Run live smoke checks for landing, analyzer upload, sample data, sample report, docs, approved visual assets, social card, and package ZIP.
- Confirm public scans find no real usage file, address, account number, meter ID, local path, browser trace, private report, authenticated screenshot, or private filename.
- Do a final mobile/desktop read-through as a homeowner, not a maintainer.
- Run quiet beta with 3-5 trusted EBMUD customers.
- Confirm at least one non-Dan real usage file works through the live browser app.
- Review feedback for launch-blocking usage-file-download, privacy, report-language, and mobile issues.

## Near-Term Product Polish

- Improve print/PDF styling for the browser report.
- Add fixture/toilet check worksheets.
- Add optional household and landscaping context form that stays local.
- Add a helped-save worksheet that stays local and avoids certified-savings claims.
- Add public examples gallery using synthetic scenarios only.
- Consider a first-run wizard only if testers still struggle to get the usage file.

## Maintainer Cleanup After Broad Launch

- Consider merging overlapping privacy tests once launch risk drops.
- Keep improving the live-site smoke script for post-deploy checks.
- Keep release docs consolidated around this backlog, release checklist, release management, and launch plan.
- Add community feedback triage and a helped-save progress page.

## Later

- Support smart-meter/hourly exports if available.
- Support additional utilities with similar usage file or Green Button exports.
- Build utility-template abstractions for other local-first civic data tools.
- Explore optional hosted services only if users ask for them and privacy/security requirements are fully defined.

## Not Planned For Current Launch

- Hosted usage file upload backend.
- EBMUD credential automation.
- Certified leak, plumbing, billing, conservation, or official utility diagnosis.
- Storage of user usage files on a server.
