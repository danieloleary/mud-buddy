# Spark Briefing for Dan — Mud Buddy repo review (2026-09-05)

Prepared by Muse Spark from a direct read of the repo plus a full local test run.
No commits, pushes, or remote changes were made. No secrets found or printed.

## 1. What the project is

**Mud Buddy** (`mud-buddy-by-danno`, v1.2.0) is a **browser-local water-use helper for EBMUD customers**.
Homeowner flow: manually download your EBMUD usage file (Track Usage / My Water Report) → open the
GitHub Pages app → "Find savings in 30 seconds" → get a private in-browser report
(normal daily use, likely outdoor watering, peak period, data-quality notes, weekend checklist,
official EBMUD next steps). The file never leaves the browser; there is no server upload, no account,
no credential handling.

Hard boundaries (README / AGENTS.md / DESIGN.md agree on all of these):
- Independent project, **not affiliated with / endorsed by EBMUD**; copy must say so.
- **Not** a formal audit, leak detector, plumbing inspection, billing tool, or official analysis.
- Report language must stay at "possible leak clues" / "patterns worth checking" — never certified diagnosis.
- Login to EBMUD is always manual; agents must never touch passwords, MFA, cookies, storage, or session material.
- Public sharing only via `--public` + redaction scan; raw usage files are local-only and never committed.
- Design: app-first (not a marketing landing page), Claude-warmth + X-restraint + Linear-precision,
  civic-water palette in `DESIGN.md`; don't add colors/motifs without updating that file.

Current product state (per `docs/backlog.md` / `plan-and-status.md`): **1.2.x launch candidate** —
landing + analyzer/report flow separated, evidence layer ("What Mud Buddy sees") in the report,
partner/review docs consolidated in `docs/partner-note.md`. Mission framing: help save
**1M gallons** of *potential/helped-save* water (methodology in `docs/gallon-savings-methodology.md`),
never verified EBMUD conservation totals.

## 2. Stack and how to run/test

- **Runtime:** Node 20+, Python 3.10+ (`docs/installation.md`). Verified today with Node v20.19.2 / npm 9.2.0 / Python 3.13.5.
- **Frontend:** Vite 7 (`vite.config.js`, `base: './'` for subpath/Pages hosting) + vanilla web component
  (`<mud-buddy-app>` in `src/main.js`) + **Material Web 3** (`@material/web`) + hand CSS (`src/styles.css`).
  No framework, no backend, no bundler plugins beyond copying the sample CSV into `dist/`.
- **Report engine (dual implementation):** `src/water-analysis.js` (browser) + `scripts/generate_report.py`
  (local CLI). JS↔Python parity is test-enforced (`test:js-python-parity`).
- **Tests:** bespoke Node `.mjs` harnesses + **Playwright Chromium** for all browser tests. No eslint/prettier/vitest —
  style/wording is enforced by `docs-consistency` + `editorial-contract` tests instead.
- **CI/CD:** `.github/workflows/ci.yml` and `pages.yml` both run `npm run validate`, then Pages publishes `public-site/`.
- **Live:** https://danieloleary.github.io/mud-buddy/ · sample report under `/sample-report/`.

```bash
npm ci
npx playwright install chromium
npm run generate:sample      # builds generated/sample-report from examples/sample-ebmud-usage.csv
npm run generate:synthetic   # 20 synthetic flavors under tests/output/
npm run dev                  # local Vite dev server
npm run build                # vite build -> dist/
npm run package:public       # builds public-site/ + public ZIP (after generate:sample/synthetic/visuals + build)
npm run validate             # the whole gate: validate:build + :unit + :browser + :docs-package
# Focused suites (AGENTS.md list):
npm run test:landing  test:report  test:browser-flow  test:privacy  test:csv-provision
npm run test:synthetic test:docs   test:redaction     test:subpath
# Local-only private-data gates (never in CI):
MUD_BUDDY_REAL_CSV="path/to/private.csv" npm run test:local-real-csv
python scripts/generate_report.py "path/to/ebmud-export.csv" --out "generated/my-private-report" [--public]
```

## 3. Repo map (important dirs/files)

| Path | What it is |
|---|---|
| `index.html` | App shell (CSP `default-src 'self'`, OG/social tags, mounts `<mud-buddy-app>`). |
| `src/main.js` (358 lines) | App component: landing, analyzer/upload, sample-data button, report render wiring. |
| `src/ebmud-csv.js` (170) | Browser CSV parser (BOM/quotes/N-A/row-cap/strict-date handling). |
| `src/water-analysis.js` (437) | Analysis: baseline GPD, outdoor-watering lift, season averages, findings, opportunity clues. |
| `src/browser-report.js` (427) | In-page report renderer incl. evidence panel, confidence labels, weekend checklist. |
| `src/official-resources.js` (64) | Canonical EBMUD link list used by app + report. |
| `src/styles.css` (666) | Material-3-adjacent styling per DESIGN.md. |
| `scripts/generate_report.py` (731) | Local CLI report generator (private default, `--public` redacted mode). |
| `scripts/package_public_site.py` / `check_public_redaction.py` / `public_release_policy.py` | Pages packaging + redaction/package policy enforcement. |
| `scripts/generate_synthetic_flavors.py` (240) | 20 synthetic usage scenarios (test fixtures, public-safe). |
| `scripts/generate_visual_assets.mjs` / `generate_sample_report.mjs` / `run_python.mjs` | Visual assets, sample report build, Python launcher shim. |
| `tests/` (31 entries) | ~20 suites: csv-parser, parity, synthetic e2e/matrix, 6 browser-upload variants, golden e2e, landing/report smoke, privacy, redaction, docs, subpath, live-site, local-real-csv. `tests/mock-ebmud-portal/` = synthetic portal (never real EBMUD). |
| `examples/sample-ebmud-usage.csv` | The **only** committed usage file (synthetic, public-safe). |
| `docs/` (21 files) | Launch/beta/release/backlog/roadmap/privacy/security/methodology + partner-note, browser-control-safety, use-with-ai-tools. `public/docs/` mirrors are generated copies. |
| `landing/index.html` | 12-line stub (redirect/legacy) — the real landing lives in `src/main.js`. |
| `launch/social-copy.md` | Launch post drafts (X + LinkedIn). |
| `skills/ebmud-buddy/` | Codex/Claude skill: SKILL.md + agents/ + references/ + scripts/ (mirrors report logic). |
| `public/` | Static assets: synthetic SVGs, sample-report, docs mirror. No private data. |
| `dist/` `generated/` `public-site/` `tests/output/` | Build artifacts — all **gitignored** (working tree was clean before and after today's test run). |
| `AGENTS.md` / `CLAUDE.md` / `DESIGN.md` / `CHANGELOG.md` / `SECURITY.md` / `SUPPORT.md` / `CONTRIBUTING.md` | Agent policy, Claude adaptation, design system, changelog (current: 1.2.0 evidence layer), support docs. |

## 4. Current health (ran today, 2026-09-05)

Full `npm run validate` → **PASS (exit 0)** = `validate:build` + `:unit` + `:browser` + `:docs-package`,
plus `npm ci`, `npm run build` (vite 7.3.3, 87 modules, ~516 ms), `generate:sample`, `generate:synthetic`.
Working tree stayed clean (`git status` empty; artifacts gitignored). No linter exists — nothing to run there.

| Command | Result | Notes |
|---|---|---|
| `npm ci` | ✅ pass | clean install OK |
| `npm run build` | ✅ pass | 87 modules transformed |
| `npm run validate:build` | ✅ pass | sample + synthetic + visuals + build + package:public; `public-site/` + ZIP produced |
| `npm run validate:unit` | ✅ pass | csv-parser, js-python-parity (sample + 20 flavors), synthetic correctness + data-contract |
| `npm run validate:browser` | ✅ pass | landing, editorial, 6 upload variants, sample-data-network, golden e2e, report, browser-flow + safety, privacy, csv-provision, subpath |
| `npm run validate:docs-package` | ✅ pass | docs-consistency, docs-links (56 md files), redaction scan on `public-site/`, fixtures, package-policy (92 ZIP entries) |
| `npm run validate` (full) | ✅ **pass, exit 0** | end-to-end gate green locally |
| `test:local-real-csv` / `test:live-site` | ⚪ not run | need private CSV / live URL respectively; the two gates I could not verify from this box |

**Environment caveat (the one real rough edge — see §5.1):** bare `npm run generate:sample` and
`npm run test:privacy` **fail on python3-only machines** with `spawn python ENOENT` because ~13
scripts/tests hardcode `process.env.PYTHON || 'python'`. Only `run_python.mjs` falls back to `python3`.
Today's green runs used `PYTHON=python3` / a `python → python3` PATH shim — CI (Node 24 + Python 3.12,
which ships `python`) is unaffected, but fresh contributors on minimal Linux boxes will hit this.

## 5. Open TODOs / rough edges

1. **`python` vs `python3` hardcoding (verified today).** ~13 files (`generate_sample_report.mjs`,
   `browser-flow.mjs`, `privacy-behavior.mjs`, `csv-provision-policy.mjs`, `synthetic-*`, `redaction-fixtures.mjs`,
   `browser-golden-e2e.mjs`, etc.) use `process.env.PYTHON || 'python'` with no `python3` fallback.
   `run_python.mjs` already has the fallback pattern — it just isn't used everywhere.
2. **Stale launch timeline.** Last commit `4b11cf1` (2026-05-23); roadmap/launch-plan still target
   "quiet beta Mon May 11 → launch Tue May 12 → backup Wed May 13, 2026". That window passed ~3.5 months ago
   with no post-window commits — it is unclear from the repo whether the public launch happened, was deferred,
   or is running as an undisclosed personal beta. The documented launch blocker
   ("≥1 non-Dan real usage file through the live app") has no recorded outcome in-repo.
3. **Beta-gated verification still open:** `test:local-real-csv` (Dan's file) and the non-Dan file check are
   local-only by design, so CI can be green while real-world parser coverage is still n=1.
4. **Overlapping privacy tests** — the backlog itself flags merging them post-launch (privacy-behavior,
   browser-upload-privacy, hardened-privacy, upload-network overlap heavily).
5. **No linter/formatter config** — wording/style rely on custom contract tests; fine today, but editor-level
   feedback (eslint/prettier) doesn't exist for contributors.
6. **Minor:** `landing/index.html` is a 12-line stub while docs sometimes say "landing page" meaning the
   in-app section — mildly confusing to newcomers. `index.html` `theme-color #C96442` isn't in the
   `DESIGN.md` palette — worth a 1-minute design-drift check.

## 6. Top 5 concrete Spark-worthy next tasks (ranked by value)

1. **Fix the `python3` fallback everywhere.** Route all spawns through `run_python.mjs` (or add the
   `['python','python3']` fallback chain to each call site).
   *Success:* delete the PATH shim; on a python3-only box `npm run validate` passes with no `PYTHON=` override.
2. **Close the beta evidence gate.** Run the quiet-beta script (`docs/beta-test-plan.md`) with 3–5 trusted
   EBMUD customers; confirm ≥1 non-Dan real file works in the live browser app; log outcomes
   (counts + issue tags only, no raw data) in `docs/plan-and-status.md`.
   *Success:* beta success criteria all checkable yes/no; any launch-blocker filed as a GitHub issue with
   `usage-file-download`/`upload`/`report-language`/`mobile`/`privacy`/`official-ebmud-routing` label.
3. **Resolve the stale May launch window.** Update `roadmap.md` / `launch-plan.md` / `plan-and-status.md` /
   `backlog.md` to state what actually happened (launched / deferred / personal-beta) with current dates.
   *Success:* no doc still asserts a May-2026 future launch; release-checklist boxes are checked or explicitly deferred.
4. **Ship print/PDF styling for the browser report** (top "near-term polish" item in backlog + roadmap).
   *Success:* `This weekend` checklist + findings print cleanly from desktop and mobile Chrome (no clipped
   actions/cards); add/extend a smoke test asserting print CSS presence; `npm run validate` still green.
5. **Add the local-only fixture/toilet worksheet + helped-save worksheet** (backlog "near-term product polish").
   *Success:* worksheets render in-app, stay local (covered by existing no-network/no-storage privacy tests),
   use "potential/helped-save" wording with zero certified-savings claims (covered by editorial-contract test);
   `npm run validate` still green.

---
*Teams/Setup notes for next session: this box needed `npx playwright install chromium` (~112 MB headless shell)
before browser suites, and a `python → python3` shim for full green — task #1 above removes the second need.
`git log --oneline -5`: 4b11cf1 app-first homepage · baed69f launch plan · 765eedc report polish ·
f272fe9 resource refactor · 53eccfc prose unslop. Remote untouched (`origin https://github.com/danieloleary/mud-buddy.git`).*
