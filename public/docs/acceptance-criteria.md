# Acceptance Criteria

## Landing Page

- Material 3 landing page loads on desktop and mobile.
- Page clearly presents the 1.0 mission: `Help save 1 million gallons this year`.
- Mission language says helped-save or potential savings, not certified utility reduction.
- CTAs work: example report, local report instructions, CSV guidance, privacy docs, GitHub/social card, and ZIP download.
- Page clearly says Mud Buddy is not affiliated with EBMUD.
- Page says EBMUD credentials are never needed.
- Page says users may intentionally provide/upload a CSV for analysis.
- Page defines GPD as gallons per day near the first sample metric.
- New approved visual assets load under GitHub Pages subpaths.

## Report Generation

- Synthetic EBMUD CSV generates a report.
- Invalid row with `Customer GPD = N/A` is excluded cleanly.
- Private report can reference the explicit local CSV filename.
- Public report generated with `--public` removes/buckets identifiers, dates, raw rows, exact values, and sensitive context.
- Report includes plain-English next-check framing and avoids certified leak/billing/conservation claims.

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
- Public artifacts include only approved synthetic SVG images.

## Release

- `npm run validate` passes locally.
- `npm run test:local-real-csv` passes locally when Dan's CSV is present.
- CI passes on GitHub.
- GitHub Pages deploy succeeds.
- Live site, sample report, docs, approved visual assets, social card, and ZIP URLs return `200`.

