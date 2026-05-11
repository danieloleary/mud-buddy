# Mud Buddy Browser-Local Launch Plan

## Target launch window

Current target: ship publicly on **Tuesday, May 12, 2026** if the final quiet-beta checks are clean. Use **Wednesday, May 13, 2026** as the backup launch day if any real-user confusion, parser issue, mobile layout issue, or EBMUD-safety wording concern appears.

Default posture:

- Launch Tuesday if the app feels boringly solid.
- Wait until Wednesday if one more sleep would make the public story clearer.
- Do not slip for nice-to-have polish. Slip only for trust, privacy, parsing, mobile usability, or official-resource safety.

## Launch thesis

Mud Buddy is a small, useful example of AI-assisted civic tech: a browser-local tool that helps EBMUD customers turn usage data into a private water-saving briefing, practical recommendations, and first checks that may save money and water.

Core message:

> Upload your EBMUD usage data in the browser. Mud Buddy gives you a private plain-English water-saving briefing, practical recommendations, and first checks for saving money and water without sending the file to a server.

Important wording:

- Say `potential savings`, `helped-save`, and `patterns worth checking`.
- Don't say certified savings, official EBMUD analysis, leak diagnosis, billing advice, or plumbing inspection.
- Don't imply EBMUD affiliation, approval, endorsement, partnership, or co-branding unless EBMUD authorizes it in writing.
- Lead with the app: `Start my water check`, `Try sample report`, and `How to get the file`.
- Lead with privacy: no EBMUD password, no server upload, no credential automation, public sharing only with `--public`.

## One-line launch pitch

Upload your EBMUD usage data. Mud Buddy shows what changed, what to check first, and where you might save money and water in under a minute.

## Three-line launch pitch

Mud Buddy is a free browser-local helper for EBMUD customers.
Upload your usage data, get a private water-saving briefing, and see the first practical checks for irrigation, fixture creep, bill spikes, and official EBMUD next steps.
No server upload, no password, no account changes, and no official EBMUD claims.

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
- `MUD_BUDDY_REAL_CSV="C:\Users\danie\Downloads\Billing Usage for 84355595214.csv" npm run test:local-real-csv`
- Browser upload test proves a homeowner can upload a usage file and see the in-page report.
- Editorial contract proves the public page leads with homeowner copy, analyzer, sample data, usage-file help, privacy, and official EBMUD resources instead of maintainer/test language.
- Synthetic source policy proves default QA fixtures come from committed sample data, not Dan's Downloads folder.
- Sample-data network test proves the demo button fetches only the local synthetic usage file.
- Browser privacy test proves account number, meter ID, filename, local path, and raw rows don't appear in the browser report.
- No-network-after-upload test proves uploaded usage-file analysis doesn't make network requests.
- GitHub Actions CI green on `main`.
- GitHub Pages deploy green on `main`.
- Live site smoke checks:
  - `MUD_BUDDY_URL="https://danieloleary.github.io/mud-buddy/" npm run test:landing`
  - `MUD_BUDDY_URL="https://danieloleary.github.io/mud-buddy/" npm run test:browser-upload`

Current proof as of May 11, 2026:

- Full local `npm run validate` passed after the report/pitch polish pass.
- Dan's private EBMUD usage file parsed locally: 32 valid rows, 1 invalid row, 483 CCF, 182 GPD baseline.
- GitHub CI and GitHub Pages deploy passed on `main`.
- Live GitHub Pages smoke passed for landing and browser upload.

Manual checks:

- Open the live site on mobile and desktop and read it like a homeowner.
- Click `Analyze my usage`, `Try sample report`, `How to get the file`, official resources, X, and LinkedIn links.
- Run the real EBMUD workflow manually once: user logs in, downloads usage file, browser-local report renders.
- Confirm the public package ZIP doesn't include private usage files, private reports, local paths, traces, screenshots, or deployment state.

## Launch sequence

### Monday, May 11: Quiet app sanity pass

Share privately with 3-5 trusted people, ideally including at least one EBMUD customer who is not Dan. Ask:

- What do you think this does?
- Would you trust the browser-local upload promise?
- Could you find where to get your EBMUD usage file?
- What would stop you from trying it?
- Did the report tell you what to check first?
- Did any joke, recommendation, or water-saving claim feel too strong?

Fix only launch-blocking confusion, broken links, or privacy concerns.

Use [beta-test-plan.md](beta-test-plan.md) as the script and [mobile-qa-checklist.md](mobile-qa-checklist.md) for phone checks.

Don't broaden launch until at least one non-Dan real usage file has worked through the live browser app, or Dan explicitly accepts launching as a personal beta with that limitation disclosed.

Don't add a backend, accounts, analytics, credential automation, or certified savings claims during quiet beta.

### Tuesday, May 12: Public launch if green

Post first on X, then LinkedIn, from Dan's personal account.

Goals:

- Tell the homeowner story, not just drop a repo link.
- Show that someone can use the live site directly.
- Ask for feedback from East Bay people, homeowners, gardeners, civic-tech folks, and AI builders.
- Keep the app independent unless EBMUD explicitly authorizes different language.

Suggested X post:

> I built Mud Buddy, a tiny browser-local helper for EBMUD customers.
>
> Upload your usage data, get a private water-saving briefing, and see what to check first: irrigation, fixture creep, bill spikes, and official EBMUD next steps.
>
> No server upload. No password. Built with love in Lafayette.
>
> Goal: help neighbors save money and millions of gallons, one home at a time.
>
> https://danieloleary.github.io/mud-buddy/

Suggested LinkedIn post:

> I built Mud Buddy as a small example of AI-assisted civic tech for East Bay homeowners.
>
> The idea is simple: EBMUD customers already have useful usage data, but most people do not want to stare at utility charts or spreadsheets. Mud Buddy turns that export into a private, browser-local water-saving briefing: what changed, what to check first, where water may be hiding, and when to use official EBMUD resources directly.
>
> It does not ask for your EBMUD password. It does not upload your file to a server. It is not an official EBMUD analysis or leak diagnosis. It is a practical first pass for homeowners who want to save money, keep plants alive, and waste less water.
>
> Built with love in Lafayette, CA. I would love feedback from East Bay homeowners, gardeners, conservation folks, civic-tech builders, and anyone at EBMUD who wants to make customer water data easier to act on.
>
> Live app: https://danieloleary.github.io/mud-buddy/
> Repo: https://github.com/danieloleary/mud-buddy

### Wednesday, May 13: Backup launch or second wave

Use Wednesday if Tuesday's quiet feedback reveals any launch-blocking issue. If Tuesday launches cleanly, use Wednesday for:

- Replying to feedback;
- Fixing the first repeated confusion in the app or README;
- Opening GitHub issues for real bugs;
- Sharing a shorter follow-up post with one screenshot or one water-saving example;
- Sending the partner note to EBMUD or a conservation contact.

### Partner review

If the app is stable after quiet beta, share the [partner note](partner-note.md) with EBMUD or local conservation partners.

Ask for review of:

- Customer safety language;
- Official-resource routing;
- Privacy claims;
- Methodology wording;
- Whether a browser-local customer education pilot would be useful.

## Go / no-go checklist

Go if:

- Live app loads on desktop and mobile.
- Sample report works.
- One private real usage file works locally.
- Public copy says browser-local, no password, not affiliated with EBMUD.
- No private CSV, account number, meter ID, address, local path, traces, or private reports are public.
- The first report screen tells a homeowner what to check first.

No-go if:

- A real user cannot find how to get the EBMUD usage file.
- Mobile upload/report layout clips or hides the main action.
- Any copy implies official EBMUD approval, diagnosis, billing advice, or certified savings.
- Any browser upload path sends the selected file over the network.
- Dan feels he would need to explain too much before someone can try it.
