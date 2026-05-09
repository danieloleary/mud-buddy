# Release Management

Mud Buddy uses the `package.json` version as the canonical app/release version, even though the package is private and not published to npm.

## Current target

- Version: `1.2.0`
- Release window: weekend release candidate
- Canonical deployment: GitHub Pages
- Public mission: help East Bay households save money and find millions of gallons of potential water savings, starting with a `1 million gallons` first milestone

## Release gates

Every public release must pass:

```bash
npm ci
npx playwright install chromium
npm run validate
MUD_BUDDY_REAL_CSV="path/to/private.csv" npm run test:local-real-csv
```

`test:local-real-csv` is local-only and skip-safe when no private usage file is present. Dan's real usage file must never be committed, packaged, hosted, pasted into docs, or included in screenshots.

## Version policy

- Patch releases fix docs, copy, tests, or small bugs.
- Minor releases add user-visible features while the product is still evolving.
- `1.2.0` means the browser-local EBMUD usage-file workflow, review-ready docs, public-safe sample report, redaction/package scans, GitHub Pages site, and evidence-based report findings are stable enough for EBMUD feedback and broader public sharing.

## Public release checklist

- Version updated in `package.json` and lockfile.
- README and changelog updated.
- `docs/gallon-savings-methodology.md` reviewed if mission or savings language changes.
- Public artifacts include only approved synthetic assets.
- GitHub Pages workflow passes.
- Live site smoke check passes.
- Post-deploy live smoke can be run with `MUD_BUDDY_URL="https://danieloleary.github.io/mud-buddy/" npm run test:live-site`.
- GitHub release notes avoid certified leak, billing, conservation, or official utility claims.
