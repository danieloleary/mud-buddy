# Plan And Status

## Current status

Mud Buddy is a 1.2.0 EBMUD-review sprint candidate. The public product is the browser-local GitHub Pages app: a homeowner downloads an EBMUD usage file, uploads it in the browser, and receives a private plain-English report without a server upload.

Last known green release gate:

- `npm run validate`
- Explicit local real-usage file gate with `MUD_BUDDY_REAL_CSV`
- GitHub CI and Pages deploy on `main`
- Live landing and browser-upload smoke checks

## Product goal

Help East Bay households understand their own EBMUD water-use data, find practical next checks, and identify potential savings without asking for credentials or sending private usage files to a server.

## v1.2 focus

- Make Mud Buddy the brand hero and keep Dan as maker/maintainer attribution.
- Prepare EBMUD-review materials without implying affiliation, endorsement, approval, partnership, or official status.
- Add report confidence labels, recommended next steps, methodology clarity, and a visible evidence layer that explains why the top finding was chosen.
- Keep report findings as heuristic pattern clues, not official EBMUD findings, leak diagnoses, billing findings, plumbing inspections, or certified conservation measurements.

## Final launch gates

- Run `npm run validate` on the final release commit.
- Run `MUD_BUDDY_REAL_CSV="path/to/private.csv" npm run test:local-real-csv` locally.
- Confirm GitHub Actions CI and Pages are green.
- Confirm live Pages loads the app, sample report, docs, assets, social card, sample usage file, and ZIP.
- Confirm no public artifact includes real usage files, service addresses, account numbers, meter IDs, local paths, private reports, traces, or authenticated screenshots.

## Deferred beyond this launch

- Chrome Downloads helper.
- First-run wizard.
- Browser report PDF polish.
- Fixture/toilet worksheets.
- Optional local household context form.
- Helped-save worksheet and community progress page.
