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

## Beta evidence (2026-09-05, synthetic-only)

Privacy-safe verification from committed synthetic data only. No real usage file
is present on this machine, so every claim below is checkable from the repo:

- `examples/sample-ebmud-usage.csv` (the only committed usage file) parses and
  renders through the browser-local upload path (`npm run test:browser-upload`).
- 20 synthetic flavors (`npm run generate:synthetic`) cover irrigation lift,
  possible toilet-leak creep, conservation drops, flatline meter checks, and
  short/long/partial read periods; all render in-browser
  (`npm run test:browser-upload-synthetic`, `npm run test:synthetic`).
- JS/Python parity holds for the sample plus all 20 flavors
  (`npm run test:js-python-parity`).
- Full `npm run validate` was green locally on 2026-09-05.

Against `docs/beta-test-plan.md` success criteria (synthetic evidence only):

- Sample data runs without help: yes (sample-data-network + browser-upload tests).
- Usage-file help is understandable: partial (editorial-contract green; needs humans).
- At least 1 real non-Dan usage file works through the live browser app: BLOCKED.
- No tester thinks Mud Buddy asks for an EBMUD login secret: partial (needs humans).
- No tester thinks Mud Buddy is official EBMUD analysis: partial (needs humans).
- Report produces at least one useful next check: yes for synthetic scenarios.

### BLOCKED: non-Dan real usage-file gate

Status: not run. No non-Dan real EBMUD usage file has been exercised through the
live app in-repo, and none is present on this machine. The exact remaining human
step (local-only; never commit the file, its contents, or any identifiers):

1. A trusted EBMUD customer (not Dan) logs into EBMUD themselves, downloads
   their usage file, and uploads it through the live app in their own browser.
2. They report only counts plus issue tags (`usage-file-download`, `upload`,
   `report-language`, `mobile`, `privacy`, `official-ebmud-routing`) following
   `docs/beta-test-plan.md`, and never send the raw file.
3. Optional local parser check on Dan's box:
   `MUD_BUDDY_REAL_CSV="path/to/private.csv" npm run test:local-real-csv`.
