# Acceptance Criteria

## Landing Page

- Material 3 landing page loads on desktop and mobile.
- CTAs work: sample report, local report instructions, AI-tool guide, privacy docs, ZIP download.
- Page clearly says Mud Buddy is not affiliated with EBMUD.
- Page says EBMUD credentials are never needed.
- Page says users may intentionally provide/upload a CSV for analysis.

## Report Generation

- Synthetic EBMUD CSV generates a report.
- Invalid row with `Customer GPD = N/A` is excluded cleanly.
- Private report can reference the explicit local CSV filename.
- Public report generated with `--public` removes/buckets identifiers, dates, raw rows, exact values, and sensitive context.

## Browser Flow

- Automated tests use the mock portal only.
- The mock flow includes a manual-login boundary.
- The flow downloads a non-empty CSV.
- The generated report loads in Chromium.
- Browser console has no errors.
- Real EBMUD flow remains manual-login assist only.

## Security And Privacy

- Credentials, MFA, CAPTCHA answers, cookies, localStorage, sessionStorage, auth headers, and session tokens are never requested, typed, stored, logged, screenshotted, or transmitted.
- Public packages exclude real CSVs, browser traces, local download folders, private reports, `.herenow`, and deployment state.
- Redaction scan passes for extracted ZIP contents.
- Public docs describe `--public` as the sharing-safe mode.

## Release

- `npm run validate` passes locally.
- CI passes on GitHub.
- GitHub Pages deploy succeeds.
- Live site, sample report, docs, social card, and ZIP URLs return `200`.
