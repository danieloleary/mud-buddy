# Backlog

## Completed For 1.2.0 Review Candidate

- Homeowner-first browser app on GitHub Pages: upload an EBMUD usage file, analyze it locally in the browser, and render an in-page report.
- Browser parser and analysis modules with JS/Python parity checks.
- Material Web landing/results UI with homeowner wording, official EBMUD resource routing, and clear privacy language.
- Public-safe synthetic visual assets and sample report.
- Synthetic dataset factory with 20 EBMUD-style flavors under ignored `tests/output/`.
- Local-only real usage file gate for Dan's private export when `MUD_BUDDY_REAL_CSV` is explicitly set.
- Privacy, redaction, package-policy, no-network, synthetic-source, and browser-upload test coverage.
- GitHub issue templates, PR template, Dependabot, support docs, code of conduct, citation metadata, CI, and Pages workflows.
- Product-first branding: Mud Buddy is the app, with Dan as maker/maintainer attribution.
- EBMUD-review docs: review brief, responsible use, browser-local proof, co-release proposal, and outreach email draft.
- Browser report confidence labels, recommended next steps, and plain-English methodology explainer.
- Browser report evidence layer: peak-vs-normal, outdoor signal, normal-use drift, data quality, and visible non-official caution.

## Must Finish Before Broad Launch

- Run `npm run validate` on the final release commit.
- Run `MUD_BUDDY_REAL_CSV="path/to/private.csv" npm run test:local-real-csv` locally.
- Confirm GitHub Actions CI and Pages deploy pass on `main`.
- Run live smoke checks for homepage, browser upload, sample data, sample report, docs, approved visual assets, social card, and ZIP.
- Confirm public scans find no real usage file, address, account number, meter ID, local path, browser trace, private report, authenticated screenshot, or private filename.
- Do a final mobile/desktop read-through as a homeowner, not a maintainer.
- Run quiet beta with 3-5 trusted EBMUD customers.
- Confirm at least one non-Dan real usage file works through the live browser app.
- Review feedback for launch-blocking usage-file-download, privacy, report-language, and mobile issues.

## Near-Term Product Polish

- Add a first-run wizard for non-technical homeowners: `Download usage file`, `Create my report`, `Review next checks`, `Share safely`.
- Add clearer print/PDF styling for the browser report.
- Add fixture/toilet check worksheets.
- Add optional household and landscaping context form that stays local.
- Add a helped-save worksheet that stays local and avoids certified-savings claims.
- Add public examples gallery using synthetic scenarios only.

## Maintainer Cleanup After Broad Launch

- Consider merging overlapping privacy tests once launch risk drops.
- Keep improving the live-site smoke script for post-deploy checks.
- Consolidate release docs if they start drifting.
- Add community feedback triage and a helped-save progress page.

## Later

- Support smart-meter/hourly exports if available.
- Support additional utilities with similar usage file or Green Button exports.
- Build utility-template abstractions for other local-first civic data tools.
- Explore optional hosted services only if users ask for them and privacy/security requirements are fully defined.

## Not Planned For Current Launch

- Hosted usage file upload backend.
- EBMUD credential automation.
- Certified leak, plumbing, billing, conservation, or official utility diagnosis.
- Storage of user usage files on a server.
