# SPARK_RUN_REPORT.md — Five ordered tasks (2026-09-05)

Working tree only. No git push. No private data invented or committed. No tokens touched.
Executed in order per SPARK_EXEC_PLAN.md (expanded from stub before coding).

Environment: Node v20.19.2 / npm 9.2.0 / Python 3.13.5, python3-only box
(no `python` on PATH, no `PYTHON=` override during verification).

## Task 1 — `python3` fallback everywhere: DONE
- Created `scripts/python-launcher.mjs` (`pythonCommands()`, `resolvePython()`,
  `spawnPython()`, `spawnPythonSync()`). `process.env.PYTHON` override wins;
  otherwise win32 → `['python']`, else `['python', 'python3']` with ENOENT fallback.
- Replaced all `process.env.PYTHON || 'python'` hardcodes (15 files):
  `scripts/generate_sample_report.mjs`, `scripts/run_python.mjs` (now delegates to
  the launcher, same CLI/exit behavior), and tests `browser-flow`,
  `browser-flow-safety`, `browser-golden-e2e`, `browser-upload-synthetic-matrix`,
  `csv-provision-policy`, `js-python-parity`, `local-real-csv-e2e`,
  `package-public-policy`, `privacy-behavior`, `redaction-fixtures`,
  `synthetic-data-contract`, `synthetic-flavors-e2e`, `synthetic-source-policy`.
- Verify: `rg "process\.env\.PYTHON" scripts tests --glob '*.mjs'` (excl. generated
  `tests/output/` staging copies) matches only the launcher itself;
  `npm run generate:sample` and `npm run test:privacy` pass with `PYTHON` unset.

## Task 2 — Beta evidence gate: DONE (synthetic-only) + BLOCKED note
- `docs/plan-and-status.md` gained a dated 2026-09-05 beta-evidence section citing
  only checkable synthetic runs (committed sample + 20 flavors + validate suites)
  and scored `docs/beta-test-plan.md` criteria yes/partial/BLOCKED.
- BLOCKED: ≥1 non-Dan real usage file through the live app — not run, no such file
  on this machine. Exact remaining human step recorded in the doc: trusted tester
  uploads via the live app in their own browser (counts + issue tags only, never
  the raw file), plus optional local
  `MUD_BUDDY_REAL_CSV="path/to/private.csv" npm run test:local-real-csv`.

## Task 3 — Stale May 2026 launch window: DONE
- `docs/roadmap.md`: May 11-13 window rewritten as past-tense deferred personal
  beta as of 2026-09-05; no new launch date set.
- `docs/launch-plan.md`: target-window section reframed as deferred; historical May
  2026 proof bullets kept verbatim for the record; sequence headings marked
  "(was …)" / "(deferred … plan; reuse when a new date is set)".
- Verify: remaining "May 11/12/13" mentions are all past-tense; `test:docs` and
  `test:docs-links` green.

## Task 4 — Print/PDF styling: DONE
- `src/styles.css`: extended `@media print` (DESIGN.md palette only) — hides
  chrome/interactive panels, inverts the dark share-card preview to ink-on-white,
  `break-inside: avoid` on report cards incl. `.worksheet-card`, reveals collapsed
  method `<details>` on paper, `@page { margin: 12mm }`.
- New `tests/print-smoke.mjs` + `test:print` script, wired into `validate:browser`.
  Asserts print CSS presence and, under emulated print media, topbar hidden while
  findings/weekend checklist stay visible (desktop + 390px widths).
- Verify: `npm run test:print` green.

## Task 5 — Fixture/toilet + helped-save worksheets: DONE
- `src/browser-report.js`: two new local-only sections after "This weekend":
  `fixture-worksheet` (dye test, meter-stillness, look-and-listen, faucets) and
  `helped-save-worksheet` (potential gallons from the in-memory analysis object).
  Pure DOM render, no storage/network; "possible leak clues" / "patterns worth
  checking" / "potential helped-save" wording, zero certified-savings claims.
- `src/styles.css`: `.worksheet-card` / `.worksheet-list` styles in existing palette.
- `tests/editorial-contract.mjs`: now requires the new worksheet headings.
- Verify: editorial-contract, browser-upload-privacy (hardened), and
  browser-upload-network all green.

## Final verification
- `env -u PYTHON npm run validate` → **exit 0** (build + unit + browser incl. new
  `test:print` + docs-package). 93 ZIP entries pass package policy; redaction scan
  passes on `public-site/`.
- Not run (need human/private context by design): `test:local-real-csv`
  (SKIPs without `MUD_BUDDY_REAL_CSV`), `test:live-site`.

## Follow-ups
1. Human quiet beta per `docs/beta-test-plan.md` (the BLOCKED gate above).
2. Consider merging overlapping privacy tests post-launch (pre-existing backlog item).
3. `landing/index.html` stub vs in-app landing naming; `theme-color #C96442` not in
   DESIGN.md palette (pre-existing minor drift, untouched).
