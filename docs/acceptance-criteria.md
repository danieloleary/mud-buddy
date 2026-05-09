# Acceptance Criteria

## Browser App

- GitHub Pages landing page loads on desktop and mobile.
- A homeowner can choose `Analyze my CSV`, select an EBMUD billing usage CSV, and see an in-page private report.
- `Try sample data` loads only the committed synthetic sample CSV.
- The page clearly says the CSV is read in the browser and is not uploaded.
- The page clearly says Mud Buddy is not affiliated with EBMUD and is not an official audit, leak detector, billing tool, or EBMUD analysis.
- GPD is defined as gallons per day near the first metric/report context.
- Official EBMUD resource links are public `ebmud.com` URLs.

## Browser Report

- Report includes a `What should I check first?` summary.
- Report includes normal daily use estimate, likely outdoor watering, highest-use period, water use over time, average use by season, and data-quality notes.
- Browser report does not render private filename, account number, meter ID, service address, local path, raw CSV rows, or exact private identifiers.
- Oversized CSVs and unusually large row counts are rejected with clear messages.
- Report language stays explanatory and avoids certified leak/billing/conservation claims.

## Report Generation

- Synthetic EBMUD CSV generates private and public reports.
- Invalid rows such as `Customer GPD = N/A` are excluded cleanly.
- Public report generated with `--public` removes/buckets identifiers, dates, raw rows, exact values, and sensitive context.
- Private report generation is local-only and may reference the explicit local source path.

## Security And Privacy

- Credentials, MFA, CAPTCHA answers, cookies, localStorage, sessionStorage, auth headers, and session tokens are never requested, typed, stored, logged, screenshotted, or transmitted.
- Browser upload does not use network requests after file selection.
- Browser upload does not write CSV/report data to localStorage, sessionStorage, IndexedDB, cookies, URLs, or a Mud Buddy account.
- Public packages exclude real CSVs, browser traces, local download folders, private reports, `.herenow`, and deployment state.
- Redaction and package-policy scans pass for public artifacts and ZIP contents.

## Release

- `npm run validate` passes locally and in CI.
- `npm run test:local-real-csv` passes locally only when `MUD_BUDDY_REAL_CSV` is explicitly set.
- GitHub Pages deploy succeeds.
- Live site, sample report, docs, approved visual assets, social card, sample CSV, and ZIP URLs return `200`.
