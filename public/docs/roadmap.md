# Roadmap

## 1.2 EBMUD Review Readiness

- Make **Mud Buddy** the product hero; keep Dan O'Leary as maker/maintainer attribution in supporting areas.
- Add EBMUD-review docs: review brief, responsible use, browser-local proof, co-release proposal, and outreach email draft.
- Add browser report confidence labels, recommended next steps, a short methodology explainer, and a visible evidence layer for why the top finding was chosen.
- Soften report findings into heuristic pattern clues: first checks, evidence, and uncertainty, not official classifications or diagnoses.
- Keep co-release language conservative: no official, approved, endorsed, partner, or co-branded wording unless EBMUD authorizes it in writing.
- Validate with `npm run validate`, explicit Dan-local usage file QA, GitHub Actions, Pages deploy, and live smoke checks before outreach.

## Immediate Before Broad Launch

- Run a quiet beta with 3-5 trusted EBMUD customers.
- Run the mobile QA checklist on the live site.
- Confirm at least one non-Dan real usage file works through browser-local upload.
- Send the EBMUD outreach packet only after the live app, privacy proof, and review brief are current.
- Fix only launch-blocking confusion, broken links, mobile layout issues, privacy concerns, or real usage file parser failures.

## 1.0 Public Launch

- Launch **Mud Buddy** as a browser-local homeowner app for EBMUD customers.
- Keep the primary promise simple: upload an EBMUD usage file in the browser, get a private water-use report, and know what to check next.
- Keep the millions-of-gallons mission framed as helped-save or potential savings, with 1M gallons as the first milestone, not verified EBMUD conservation totals.
- Validate with `npm run validate`, explicit Dan-local usage file QA, GitHub Actions, Pages deploy, and live smoke checks.
- Keep real EBMUD access manual-login-only; Mud Buddy never handles credentials or session material.

## Near Term After Launch

- Add a first-run wizard with `Download usage file`, `Find savings in 30 seconds`, `Review next checks`, and `Share safely`.
- Add print/PDF styling for the browser report.
- Add fixture/toilet check worksheets.
- Add helped-save estimate worksheet that stays local and avoids certified claims.
- Add public examples gallery using synthetic scenarios only.
- Add community feedback triage and a helped-save progress page.

## Maintainer Improvements

- Consider merging overlapping privacy tests after launch.
- Maintain the post-deploy live-site smoke script.
- Keep CI and Pages pinned to `npm run validate` so release gates do not drift.
- Keep generated screenshots synthetic-only unless a real-data public report has passed redaction scan and manual review.

## Later

- Support smart-meter/hourly exports if available.
- Support additional utilities with similar usage file or Green Button exports.
- Build utility-template abstractions for other local-first civic data tools.
- Build community partner and local conservation professional workflows.
- Explore optional hosted services only if users ask for them and privacy/security requirements are fully defined.
