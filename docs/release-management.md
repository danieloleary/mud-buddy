# Release Management

Mud Buddy uses the `package.json` version as the canonical app/release version, even though the package is private and not published to npm.

## Current target

- Version: `1.1.0`
- Release window: weekend release candidate
- Canonical deployment: GitHub Pages
- Public mission: help East Bay households find `1 million gallons` of potential water savings this year

## Release gates

Every public release must pass:

```bash
npm ci
npx playwright install chromium
npm run validate
npm run test:local-real-csv
```

`test:local-real-csv` is local-only and skip-safe when no private CSV is present. Dan's real CSV must never be committed, packaged, hosted, pasted into docs, or included in screenshots.

## Version policy

- Patch releases fix docs, copy, tests, or small bugs.
- Minor releases add user-visible features while the product is still evolving.
- `1.1.0` means the browser-local EBMUD CSV workflow, review-ready docs, public-safe sample report, redaction/package scans, and GitHub Pages site are stable enough for EBMUD feedback and broader public sharing.

## Public release checklist

- Version updated in `package.json` and lockfile.
- README and changelog updated.
- `docs/gallon-savings-methodology.md` reviewed if mission or savings language changes.
- Public artifacts include only approved synthetic assets.
- GitHub Pages workflow passes.
- Live site smoke check passes.
- GitHub release notes avoid certified leak, billing, conservation, or official utility claims.
