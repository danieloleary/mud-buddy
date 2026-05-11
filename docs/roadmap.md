# Roadmap

## Now: 1.2.x Launch Candidate

- Keep the live app focused on the homeowner path: landing, analyzer, report, official EBMUD resources.
- Keep `npm run validate`, explicit Dan-local usage-file QA, GitHub Actions, Pages deploy, and live smoke checks green.
- Run quiet beta with 3-5 trusted people on Monday, May 11, 2026.
- Confirm at least one non-Dan real usage file works through browser-local upload.
- Fix only launch-blocking confusion, broken links, mobile layout issues, privacy concerns, or real usage-file parser failures.
- Target public launch on Tuesday, May 12, 2026 if quiet beta is clean.
- Use Wednesday, May 13, 2026 as the backup launch day if one more polish/debug loop is needed.

## Public Launch

- Launch Mud Buddy as a browser-local homeowner app for EBMUD customers.
- Keep the primary promise simple: upload EBMUD usage data in the browser, get a private water-saving briefing, and know what to check first.
- Keep the millions-of-gallons mission framed as helped-save or potential savings, not verified EBMUD conservation totals.
- Keep real EBMUD access manual-login-only; Mud Buddy never handles credentials or session material.
- Keep partner language conservative: no official, approved, endorsed, partner, or co-branded wording unless EBMUD authorizes it in writing.

## Near Term After Launch

- Add print/PDF styling for the browser report.
- Add fixture/toilet check worksheets.
- Add helped-save estimate worksheet that stays local and avoids certified claims.
- Add public examples gallery using synthetic scenarios only.
- Add community feedback triage and a helped-save progress page.
- Add a first-run wizard only if testers still struggle with the usage-file step.

## Maintainer Improvements

- Consider merging overlapping privacy tests after launch.
- Maintain the post-deploy live-site smoke script.
- Keep CI and Pages pinned to `npm run validate` so release gates don't drift.
- Keep generated screenshots synthetic-only unless a real-data public report has passed redaction scan and manual review.
- Keep partner/reviewer docs consolidated unless a real review process starts.

## Later

- Support smart-meter/hourly exports if available.
- Support additional utilities with similar usage file or Green Button exports.
- Build utility-template abstractions for other local-first civic data tools.
- Build community partner and local conservation professional workflows.
- Explore optional hosted services only if users ask for them and privacy/security requirements are fully defined.
