# Backlog

## Completed For 1.0.0 Release Candidate

- Homeowner-first landing page and README.
- `Help save 1 million gallons this year` mission and gallon-savings methodology.
- Material Web polish with ripples, tonal buttons, dividers, checklist reset, and clearer sample-mode accessibility.
- Public-safe synthetic SVG asset set for report preview, CSV boundary, sharing checklist, irrigation, leak checks, AI handoff, and GitHub social sharing.
- Official EBMUD customer-resource directory and routing language.
- Synthetic dataset factory with 20 EBMUD-style flavors.
- Local-only real CSV gate for Dan's private export.
- Public ZIP packaging, package policy tests, and redaction scan hardening.
- GitHub issue templates, PR template, Dependabot, support docs, code of conduct, and citation metadata.

## Must Finish Before Tagging v1.0.0

- `npm run validate` passes locally and in CI.
- `npm run test:local-real-csv` passes locally and Dan's CSV remains private.
- GitHub Pages deploy succeeds for the release commit.
- Live site, sample report, docs, approved SVG assets, social card, and ZIP return `200`.
- Public scans find no real CSV, address, account number, meter ID, local path, browser trace, private report, or authenticated screenshot.

## Next Up After 1.0.0

- Add a fully browser-local upload UI that accepts an EBMUD CSV and renders a report without a server.
- Add Chrome Downloads helper that lists recent CSV candidates and asks before processing.
- Add first-run wizard for Claude Code, Codex, and Lovable users.
- Add a public/private report badge that is visible above the fold.
- Add manual real-portal checklist screenshots made from mock pages only.

## Analysis Improvements

- Add irrigation-season comparison by water year.
- Add baseline-confidence labels.
- Add fixture/toilet check worksheet.
- Add optional household context form that stays local.
- Add stronger household-size and landscaping-context explanations.
- Add optional helped-save estimate worksheet that stays local and avoids certified-savings claims.

## Distribution

- Publish v1.0.0 through GitHub Pages and a GitHub release once CI and Pages are green.
- Add Show HN, X, LinkedIn, and local East Bay launch checklist.
- Consider Product Hunt after the README, screenshots, issue templates, and first external feedback are clean.

## Not Planned For 1.0

- Hosted CSV upload backend.
- EBMUD credential automation.
- Certified leak, plumbing, billing, conservation, or official utility diagnosis.
- Storage of user CSVs on a server.
