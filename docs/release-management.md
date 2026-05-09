# Release Management

Mud Buddy releases should be boring, repeatable, and privacy-safe.

## Release Types

- Patch: docs, tests, styling, small parser fixes, or safety wording.
- Minor: new report sections, new import workflows, new AI-tool instructions, or new browser-flow helpers.
- Major: hosted upload backend, account system, or any change that alters privacy defaults.

The package is currently `private: true`; releases are GitHub/GitHub Pages releases, not npm releases.

## Pre-Release Gate

Run this before tagging, pushing launch copy, or sharing public artifacts:

```bash
npm ci
npx playwright install chromium
npm run validate
```

Confirm:

- CI passes on GitHub.
- Pages deploy passes.
- `https://danieloleary.github.io/mud-buddy/` loads.
- Sample report, docs, social card, and ZIP links load.
- Public ZIP extraction scan passes.
- No raw private CSVs, real account numbers, service addresses, meter IDs, local paths, browser traces, HAR files, or `.herenow` state files are included.

## Release Checklist

1. Update `CHANGELOG.md` with user-facing changes.
2. Run `npm run validate` locally.
3. Review `docs/public-sharing-checklist.md`.
4. Commit with a concise release message.
5. Push `main`.
6. Verify CI and Pages.
7. Create a GitHub release only after Pages is green.
8. Share X/LinkedIn copy only after public URLs return `200`.

## Browser Workflow Acceptance

Real EBMUD browser testing is manual-login assist only:

- The human logs in manually.
- Agent uses only official usage/export/download controls after confirmation.
- Agent detects or asks for the CSV path.
- Agent asks before processing the CSV.
- Agent generates a private report first.
- Agent generates public artifacts only with `--public` and scan confirmation.

Automated CI must use the mock portal and synthetic data only.
