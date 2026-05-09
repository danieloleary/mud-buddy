# Plan And Status

Version target: browser-local 1.0 launch candidate.

## Current status

Mud Buddy has shipped the v1 foundation and is being upgraded from a polished project/demo site into a usable homeowner web app:

- Browser-local upload and analysis is now the primary release blocker.
- Homeowner-first landing page and README.
- Public-safe synthetic visual system.
- Official EBMUD resource routing.
- Manual-login-only browser workflow docs.
- Local report generator with `--public`, `--redact`, and `--summary-json`.
- Synthetic 20-flavor dataset factory.
- Local-only Dan CSV E2E harness.
- Redaction, package policy, docs, browser-flow, and subpath tests.

## Product goal

Help East Bay households find `1 million gallons` of potential water savings this year.

This is a helped-save/product-impact goal, not a verified EBMUD conservation total.

## Remaining release gates

- Run `npm run validate`.
- Run `npm run test:local-real-csv`.
- Confirm browser upload works with the synthetic sample and Dan's private local CSV.
- Confirm uploaded CSV analysis makes no network requests after file selection.
- Confirm Dan's real CSV remains private and ignored.
- Push release commit to `main`.
- Confirm GitHub Pages deploy passes.
- Verify live site, browser upload, sample report, docs, approved visual assets, social card, sample CSV, and ZIP URLs return `200`.
- Tag only after the release gates are green.

## Deferred beyond this launch

- Hosted CSV upload backend.
- Chrome Downloads helper.
- First-run wizard.
- PDF export.
- More detailed household context modeling.

