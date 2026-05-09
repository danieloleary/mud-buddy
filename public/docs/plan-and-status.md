# Plan And Status

Version target: `1.0.0` weekend release candidate.

## Current status

Mud Buddy has shipped the v0.5 foundation and is marching toward 1.0:

- Homeowner-first landing page and README.
- Public-safe synthetic visual system.
- Official EBMUD resource routing.
- Manual-login-only browser workflow docs.
- Local report generator with `--public`, `--redact`, and `--summary-json`.
- Synthetic 20-flavor dataset factory.
- Local-only Dan CSV E2E harness.
- Redaction, package policy, docs, browser-flow, and subpath tests.

## 1.0 product goal

Help East Bay households find `1 million gallons` of potential water savings this year.

This is a helped-save/product-impact goal, not a verified EBMUD conservation total.

## Remaining release gates

- Run `npm run validate`.
- Run `npm run test:local-real-csv`.
- Confirm Dan's real CSV remains private and ignored.
- Push release commit to `main`.
- Confirm GitHub Pages deploy passes.
- Verify live site, sample report, docs, approved SVG assets, social card, and ZIP URLs return `200`.
- Tag `v1.0.0` only after the release gates are green.

## Deferred beyond 1.0

- Hosted CSV upload backend.
- Browser-local upload UI if it cannot be fully tested before release.
- Chrome Downloads helper.
- First-run wizard.
- PDF export.
- More detailed household context modeling.
