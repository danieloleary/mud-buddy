# Plan And Status

## Current status

Mud Buddy is a 1.2.x browser-local app for EBMUD customers. The live product is the GitHub Pages site: a homeowner lands on a clean intro page, opens the analyzer, uploads EBMUD usage data in the browser, and receives a private plain-English report without a server upload.

Last known green checks:

- `npm run validate`
- Explicit local real-usage file gate with `MUD_BUDDY_REAL_CSV`
- GitHub CI and Pages deploy on `main`
- Live landing and browser-upload smoke checks

## Product goal

Help East Bay households understand their own EBMUD water-use data, find practical next checks, and identify potential savings without asking for credentials or sending private usage files to a server.

## Current focus

- Keep the public experience simple: landing, analyzer, report, EBMUD resources.
- Keep report findings useful and evidence-based, with a visible evidence layer, without sounding official or diagnostic.
- Keep partner/reviewer material short and current in `docs/partner-note.md`.
- Keep Dan/local attribution secondary; Mud Buddy is the product.
- Keep all private-data behavior browser-local and test-backed.

## Final launch gates

- Run `npm run validate` on the final release commit.
- Run `MUD_BUDDY_REAL_CSV="path/to/private.csv" npm run test:local-real-csv` locally.
- Confirm GitHub Actions CI and Pages are green.
- Confirm live Pages loads the landing page, analyzer, sample report, docs, assets, social card, sample usage file, and package ZIP.
- Confirm no public output includes real usage files, service addresses, account numbers, meter IDs, local paths, private reports, traces, authenticated screenshots, private filenames, or raw usage rows.

## Deferred beyond this launch

- First-run wizard if beta users still need it.
- Browser report PDF polish.
- Fixture/toilet worksheets.
- Optional local household context form.
- Helped-save worksheet and community progress page.
