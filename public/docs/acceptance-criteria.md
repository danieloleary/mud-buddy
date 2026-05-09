# Acceptance Criteria

## Browser App

- GitHub Pages landing page loads on desktop and mobile.
- A homeowner can choose `Find savings in 30 seconds`, select an EBMUD billing usage file, and see an in-page private report.
- `Try sample report` loads only the committed synthetic sample usage file.
- The app explains that the usage-file step usually takes about 3 minutes, does not require understanding the file, and does not change the user's EBMUD account.
- The page clearly says the usage file is read in the browser and is not uploaded.
- The page clearly says Mud Buddy is not affiliated with EBMUD and is not an official audit, leak detector, billing tool, or EBMUD analysis.
- GPD is defined as gallons per day near the first metric/report context.
- Official EBMUD resource links are public `ebmud.com` URLs.

## Browser Report

- Report includes a `Start here` summary that tells the household what to check first.
- Report includes confidence labels, recommended next steps, a `What Mud Buddy sees` evidence panel, and a short `How Mud Buddy decides this` explanation.
- Report includes a visible caution that the summary is a pattern read from the usage file, not an official EBMUD finding.
- Report includes a short `This weekend` checklist with practical household checks.
- Report includes normal daily use estimate, likely outdoor watering, highest-use period, water use over time, average use by season, and data-quality notes.
- Browser report does not render private filename, account number, meter ID, service address, local path, raw usage file rows, or exact private identifiers.
- Oversized usage files and unusually large row counts are rejected with clear messages.
- Report language stays explanatory and avoids certified leak/billing/conservation claims.

## Report Generation

- Synthetic EBMUD usage file generates private and public reports.
- Invalid rows such as `Customer GPD = N/A` are excluded cleanly.
- Public report generated with `--public` removes/buckets identifiers, dates, raw rows, exact values, and sensitive context.
- Private report generation is local-only and may reference the explicit local source path.

## Security And Privacy

- Credentials, MFA, CAPTCHA answers, cookies, localStorage, sessionStorage, auth headers, and session tokens are never requested, typed, stored, logged, screenshotted, or transmitted.
- Browser upload does not use network requests after file selection.
- Browser upload does not write usage file/report data to localStorage, sessionStorage, IndexedDB, cookies, URLs, or a Mud Buddy account.
- Public packages exclude real usage files, browser traces, local download folders, private reports, `.herenow`, and deployment state.
- Redaction and package-policy scans pass for public artifacts and ZIP contents.

## Release

- `npm run validate` passes locally and in CI.
- `npm run test:local-real-csv` passes locally only when `MUD_BUDDY_REAL_CSV` is explicitly set.
- GitHub Pages deploy succeeds.
- Live site, sample report, docs, approved visual assets, social card, sample usage file, and ZIP URLs return `200`.
- EBMUD-review docs are present and do not imply affiliation, endorsement, approval, partnership, co-branding, or official status.
