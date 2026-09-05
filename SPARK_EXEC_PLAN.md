# SPARK_EXEC_PLAN.md — Five ordered tasks (expanded 2026-09-05)

Source: SPARK_BRIEFING.md §6. Execute IN ORDER. No git push. Working-tree changes only.
Follow AGENTS.md (privacy, no credentials, local-first) and DESIGN.md (palette, no new motifs).

## Task 1 — Fix `python` vs `python3` fallback everywhere
- **Problem:** ~14 files use `process.env.PYTHON || 'python'` with no `python3` fallback;
  only `scripts/run_python.mjs` has the fallback. Bare `npm run generate:sample` /
  `npm run test:privacy` fail on python3-only boxes (`spawn python ENOENT`).
- **Plan:**
  1. Create `scripts/python-launcher.mjs` exporting `pythonCommands()`,
     `spawnPython(args, options)`, `spawnPythonSync(args, options)`.
     Semantics: `process.env.PYTHON` override wins; else win32 → `['python']`,
     else `['python', 'python3']`; async/sync variants fall through on ENOENT.
  2. Replace hardcodes in `scripts/generate_sample_report.mjs` + tests:
     `browser-flow.mjs`, `browser-flow-safety.mjs`, `browser-golden-e2e.mjs`,
     `browser-upload-synthetic-matrix.mjs`, `csv-provision-policy.mjs`,
     `js-python-parity.mjs`, `local-real-csv-e2e.mjs`, `package-public-policy.mjs`,
     `privacy-behavior.mjs`, `redaction-fixtures.mjs`, `synthetic-data-contract.mjs`,
     `synthetic-flavors-e2e.mjs`, `synthetic-report-results-correctness.mjs`,
     `synthetic-source-policy.mjs`.
  3. Keep `scripts/run_python.mjs` behavior (delegate to launcher, keep CLI + exit codes).
- **Success:** `PATH` without `python`, no `PYTHON=` override → `npm run validate` green.
- **Verify:** `rg "process\.env\.PYTHON \|\| 'python'" scripts tests` returns nothing
  (outside generated `tests/output/` staging copies).

## Task 2 — Close the beta evidence gate (synthetic-only, privacy-safe)
- **Constraint:** Do NOT invent private data. No real CSV exists on this box
  (no `MUD_BUDDY_REAL_CSV`, no Dan/private file). Per AGENTS.md, never commit raw data.
- **Plan:** Update `docs/plan-and-status.md` with a dated (2026-09-05) beta-evidence
  section citing ONLY verifiable synthetic runs: `examples/sample-ebmud-usage.csv` +
  20 synthetic flavors + `npm run validate` suites. Success criteria from
  `docs/beta-test-plan.md` marked yes/no against synthetic evidence.
  If the ≥1 non-Dan real-CSV gate is unmet (expected), write an explicit BLOCKED note
  with the exact remaining human step:
  `MUD_BUDDY_REAL_CSV="path/to/private.csv" npm run test:local-real-csv` (local-only,
  never committed) + one trusted tester running the live app per `docs/beta-test-plan.md`.
- **Success:** Evidence claims are checkable; no fabricated tester counts or filenames.

## Task 3 — Resolve the stale May 2026 launch window
- **Problem:** `docs/roadmap.md`, `docs/launch-plan.md` (and `plan-and-status.md`
  context) still assert a future "quiet beta Mon May 11 → launch Tue May 12 →
  backup Wed May 13, 2026" window that passed ~3.5 months ago.
- **Plan:** Rewrite date assertions to past-tense deferred status:
  launch deferred, running as personal beta as of 2026-09-05; remove/retarget
  future-tense May-12/13 launch claims; keep go/no-go criteria and gates intact.
  Touch `docs/roadmap.md`, `docs/launch-plan.md`, `docs/plan-and-status.md`.
  Check `docs/backlog.md` for launch-date assertions (leave gate checklist wording).
- **Success:** `rg "May 1[123], 2026|May 11|May 12|May 13" docs/roadmap.md
  docs/launch-plan.md docs/plan-and-status.md` shows no future-tense launch promise.
- **Verify:** `npm run test:docs` (docs-consistency) still green — no required/forbidden
  phrase regressions.

## Task 4 — Ship print/PDF styling for the browser report
- **Plan:**
  1. Extend the existing `@media print` block in `src/styles.css` (keep DESIGN.md
     palette; print = ink-on-white, no new colors): hide nav/interactive panels,
     force light backgrounds, avoid breaking checklist/cards across pages,
     ensure charts/weekend checklist/findings print without clipping.
  2. Add `tests/print-smoke.mjs` (Playwright): load app via `vite preview`,
     click "Try sample report", assert report renders, assert print CSS present
     (a `@media print` rule hiding `.topbar`/`.analyzer-section` etc.),
     emulate print media and screenshot/assert weekend checklist + findings visible.
     No network, no storage, no private data (sample CSV only).
  3. Add `package.json` script `test:print` and wire into `validate:browser`.
- **Success:** Checklist + findings print cleanly desktop/mobile widths;
  new smoke test green; `npm run validate` green.

## Task 5 — Fixture/toilet + helped-save worksheets (local-only, in-app)
- **Plan:** In `src/browser-report.js`, add two local-only sections to the report:
  1. Fixture/toilet check worksheet (dye-test steps, meter-stillness check,
     checkbox-style list, "patterns worth checking" framing).
  2. Helped-save estimate worksheet (potential gallons framed as
     "potential/helped-save", never certified savings; references existing
     `totalOpportunityGallons`/savings clues, investigation targets only).
  - Pure DOM rendering from the in-memory `analysis` object; NO localStorage/
    sessionStorage, NO fetch/XHR/beacon (must stay green under
    `browser-upload-hardened-privacy` + `browser-upload-network` guards).
  - Wording must pass `editorial-contract`: "possible leak clues",
    "patterns worth checking", "potential/helped-save"; zero certified-savings
    claims, zero official-EBMUD claims.
  - Add matching CSS classes in `src/styles.css` using existing palette vars.
- **Success:** Worksheets render in-app from sample data; privacy + editorial
  tests green; `npm run validate` green.

## Final — Full validate + SPARK_RUN_REPORT.md
- Run `npm run validate` (no `PYTHON=` shim, no `python` symlink) after all five tasks.
- Write `SPARK_RUN_REPORT.md`: per-task what-changed/file list, verify commands +
  results, BLOCKED notes (Task 2 real-CSV gate), deferred-beta statement,
  follow-ups. No private data, no tokens.
