# Roadmap

## 1.0 Public Launch

- Launch **Mud Buddy for EBMUD - by Dan O'Leary** as a browser-local homeowner app.
- Keep the primary promise simple: upload an EBMUD CSV in the browser, get a private water-use report, and know what to check next.
- Keep the 1M-gallon mission framed as helped-save or potential savings, not verified EBMUD conservation totals.
- Validate with `npm run validate`, explicit Dan-local CSV QA, GitHub Actions, Pages deploy, and live smoke checks.
- Keep real EBMUD access manual-login-only; Mud Buddy never handles credentials or session material.

## Near Term After Launch

- Add a first-run wizard with `Download CSV`, `Analyze my CSV`, `Review next checks`, and `Share safely`.
- Add print/PDF styling for the browser report.
- Add baseline-confidence labels and fixture/toilet check worksheets.
- Add helped-save estimate worksheet that stays local and avoids certified claims.
- Add public examples gallery using synthetic scenarios only.
- Add community feedback triage and a 1M-gallon progress page.

## Maintainer Improvements

- Consider merging overlapping privacy tests after launch.
- Add a post-deploy live-site smoke script.
- Keep CI and Pages pinned to `npm run validate` so release gates do not drift.
- Keep generated screenshots synthetic-only unless a real-data public report has passed redaction scan and manual review.

## Later

- Support smart-meter/hourly exports if available.
- Support additional utilities with similar CSV or Green Button exports.
- Build utility-template abstractions for other local-first civic data tools.
- Build community partner and local conservation professional workflows.
- Explore optional hosted services only if users ask for them and privacy/security requirements are fully defined.
