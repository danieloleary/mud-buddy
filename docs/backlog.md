# Backlog

## Completed For v0.5.0

- Material landing page visual upgrade with synthetic civic-water SVG assets.
- Official EBMUD customer-resource directory and routing language.
- GitHub issue templates, PR template, Dependabot, support docs, code of conduct, and citation metadata.
- Synthetic dataset factory with 20 EBMUD-style flavors.
- Public ZIP packaging and redaction scan hardening.
- v0.5.0 package metadata and changelog.

## Next Up After v0.5.0

- Add a local upload UI that accepts an EBMUD CSV in-browser, parses it locally, and generates a downloadable report without a server.
- Add Chrome Downloads helper that lists recent CSV candidates and asks before processing.
- Add first-run wizard for Claude Code, Codex, and Lovable users.
- Add a public/private report badge that is visible above the fold.
- Add manual real-portal checklist screenshots made from mock pages only.

## Safety And Privacy

- Keep explicit consent before processing any detected real CSV.
- Expand scanner fixtures as new file types or public artifacts are added.
- Keep real EBMUD browser control manual-login-assisted only.
- Keep raw private CSVs and generated private reports out of Git, public ZIPs, public docs, and hosted sites.

## Analysis Improvements

- Add irrigation-season comparison by water year.
- Add baseline-confidence labels.
- Add fixture/toilet check worksheet.
- Add optional household context form that stays local.
- Add stronger household-size and landscaping-context explanations.

## Distribution

- Publish v0.5.0 through GitHub Pages and a GitHub release once CI and Pages are green.
- Add Show HN, X, LinkedIn, and local East Bay launch checklist.
- Consider Product Hunt after the README, screenshots, issue templates, and first external feedback are clean.

## Not Planned For MVP

- Hosted CSV upload backend.
- EBMUD credential automation.
- Certified leak, plumbing, billing, or official utility diagnosis.
- Storage of user CSVs on a server.