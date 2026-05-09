# Browser-local Proof

Mud Buddy's public app is designed as a static GitHub Pages site. The primary workflow is browser-local usage-file analysis.

## What happens when a user selects a usage file

1. The user chooses a file through the browser file picker or drag/drop.
2. JavaScript reads the file text in memory.
3. The parser ignores private identifier columns for browser display.
4. The report renders in the page.
5. The private filename, local path, account number, meter ID, service address, and raw usage-file rows are not rendered.

## What should not happen

- No usage file upload to a Mud Buddy backend.
- No localStorage, sessionStorage, IndexedDB, cookie, query-string, or URL-fragment storage of the usage file.
- No EBMUD credential, MFA, CAPTCHA, cookie, token, or session handling.
- No account-setting, billing, autopay, contact, or service changes.

## Test evidence

The release gate uses `npm run validate`, including browser upload, hardened privacy, no-network-after-upload, sample-data network, package policy, redaction, synthetic matrix, and docs consistency tests.

Dan's real usage file test is local-only and opt-in:

```bash
MUD_BUDDY_REAL_CSV="path/to/private.csv" npm run test:local-real-csv
```

The real usage file must never be committed, packaged, uploaded, screenshotted for public launch assets, or copied into docs.

