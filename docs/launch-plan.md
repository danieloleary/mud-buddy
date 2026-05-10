# Mud Buddy Browser-Local Launch Plan

## Launch thesis

Mud Buddy is a small, useful example of AI-assisted civic tech: a browser-local tool that helps EBMUD customers analyze usage data, get beautiful recommendations, spot patterns worth checking, and maybe save water and money.

Core message:

> Upload your EBMUD usage data in the browser. Mud Buddy gives you a private plain-English report, practical recommendations, and first checks for saving money and water without sending the file to a server.

Important wording:

- Say `potential savings`, `helped-save`, and `patterns worth checking`.
- Do not say certified savings, official EBMUD analysis, leak diagnosis, billing advice, or plumbing inspection.
- Do not imply EBMUD affiliation, approval, endorsement, partnership, or co-branding unless EBMUD authorizes it in writing.
- Lead with the app: `Analyze my usage`, `Try sample report`, and `How to get the file`.
- Lead with privacy: no EBMUD password, no server upload, no credential automation, public sharing only with `--public`.

## Launch assets

- Live app: https://danieloleary.github.io/mud-buddy/
- Repo: https://github.com/danieloleary/mud-buddy
- Sample report: https://danieloleary.github.io/mud-buddy/sample-report/index.html
- Social card: https://danieloleary.github.io/mud-buddy/assets/github-social-card.png
- Partner note: https://danieloleary.github.io/mud-buddy/docs/partner-note.md
- X: https://x.com/danieloleary
- LinkedIn: https://www.linkedin.com/in/danieloleary/
- Canonical disclaimer: Not affiliated with EBMUD. Not a formal water audit, leak detector, plumbing inspection, billing tool, certified conservation measurement, or official EBMUD analysis.

## Release gates before broad social launch

Required gates:

- `npm run validate`
- `MUD_BUDDY_REAL_CSV="path/to/private.csv" npm run test:local-real-csv`
- Browser upload test proves a homeowner can upload a usage file and see the in-page report.
- Editorial contract proves the public page leads with homeowner copy, analyzer, sample data, usage-file help, privacy, and official EBMUD resources instead of maintainer/test language.
- Synthetic source policy proves default QA fixtures come from committed sample data, not Dan's Downloads folder.
- Sample-data network test proves the demo button fetches only the local synthetic usage file.
- Browser privacy test proves account number, meter ID, filename, local path, and raw rows do not appear in the browser report.
- No-network-after-upload test proves uploaded usage-file analysis does not make network requests.
- GitHub Actions CI green on `main`.
- GitHub Pages deploy green on `main`.
- Live site smoke check: `MUD_BUDDY_URL="https://danieloleary.github.io/mud-buddy/" npm run test:live-site`.

Manual checks:

- Open the live site on mobile and desktop and read it like a homeowner.
- Click `Analyze my usage`, `Try sample report`, `How to get the file`, official resources, X, and LinkedIn links.
- Run the real EBMUD workflow manually once: user logs in, downloads usage file, browser-local report renders.
- Confirm the public package ZIP does not include private usage files, private reports, local paths, traces, screenshots, or deployment state.

## Launch sequence

### Phase 1: Quiet app sanity pass

Share privately with 3-5 trusted people and ask:

- What do you think this does?
- Would you trust the browser-local upload promise?
- Could you find where to get your EBMUD usage file?
- What would stop you from trying it?

Fix only launch-blocking confusion, broken links, or privacy concerns.

Use [beta-test-plan.md](beta-test-plan.md) as the script and [mobile-qa-checklist.md](mobile-qa-checklist.md) for phone checks.

Do not broaden launch until at least one non-Dan real usage file has worked through the live browser app.

Do not add a backend, accounts, analytics, credential automation, or certified savings claims during quiet beta.

### Phase 2: Personal social launch

Post first on X, then LinkedIn, from Dan's personal account.

Goals:

- Tell the homeowner story, not just drop a repo link.
- Show that someone can use the live site directly.
- Ask for feedback from East Bay people, homeowners, gardeners, civic-tech folks, and AI builders.
- Keep the app independent unless EBMUD explicitly authorizes different language.

### Phase 3: Partner review

If the app is stable after quiet beta, share the [partner note](partner-note.md) with EBMUD or local conservation partners.

Ask for review of:

- customer safety language;
- official-resource routing;
- privacy claims;
- methodology wording;
- whether a browser-local customer education pilot would be useful.