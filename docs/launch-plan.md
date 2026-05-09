# Mud Buddy Browser-Local Launch Plan

## Launch thesis

Mud Buddy for EBMUD - by Dan O'Leary is a small, useful example of AI-assisted civic tech: a browser-local tool that helps EBMUD customers understand their own water-use CSV, spot patterns worth checking, and maybe save water and money.

Core message:

> I built Mud Buddy so East Bay households can upload an EBMUD usage CSV in their browser, get a private plain-English water report, and find practical next checks without sending the CSV to a server.

Important wording:

- Say `potential savings`, `helped-save`, and `patterns worth checking`.
- Do not say certified savings, official EBMUD analysis, leak diagnosis, billing advice, or plumbing inspection.
- Lead with the app: `Analyze my CSV`, `Try sample data`, and `How to download your EBMUD CSV`.
- Lead with privacy: no EBMUD password, no server upload, no credential automation, public sharing only with `--public`.

## Launch assets

- Live app: https://danieloleary.github.io/mud-buddy/
- Repo: https://github.com/danieloleary/mud-buddy
- Sample report: https://danieloleary.github.io/mud-buddy/sample-report/index.html
- Social card: https://danieloleary.github.io/mud-buddy/assets/github-social-card.png
- X: https://x.com/danieloleary
- LinkedIn: https://www.linkedin.com/in/danieloleary/
- Canonical disclaimer: Not affiliated with EBMUD. Not a formal water audit, leak detector, plumbing inspection, billing tool, certified conservation measurement, or official EBMUD analysis.

## Release gates before broad social launch

Required gates:

- `npm run validate`
- `npm run test:local-real-csv`
- Browser upload test proves a homeowner can upload a CSV and see the in-page report.
- Editorial contract proves the public page leads with upload, sample data, CSV help, privacy, and official EBMUD resources instead of maintainer/test language.
- Synthetic source policy proves default QA fixtures come from committed sample data, not Dan's Downloads folder.
- Sample-data network test proves the demo button fetches only the local synthetic CSV.
- Browser privacy test proves account number, meter ID, filename, local path, and raw rows do not appear in the browser report.
- No-network-after-upload test proves uploaded CSV analysis does not make network requests.
- GitHub Actions CI green on `main`.
- GitHub Pages deploy green on `main`.
- Live site smoke check: landing, browser upload, sample data, sample report, docs, approved visual assets, ZIP.

Manual checks:

- Open the live site on mobile and desktop and read it like a homeowner.
- Click `Analyze my CSV`, `Try sample data`, `How to download your EBMUD CSV`, official resources, X, and LinkedIn links.
- Run the real EBMUD workflow manually once: user logs in, downloads CSV, browser-local report renders.
- Download the ZIP and confirm it does not include private CSVs, private reports, local paths, traces, screenshots, or deployment state.

## Launch sequence

### Phase 1: Quiet app sanity pass

Share privately with 3-5 trusted people and ask:

- What do you think this does?
- Would you trust the browser-local upload promise?
- Could you find where to get your EBMUD CSV?
- What would stop you from trying it?

Fix only launch-blocking confusion, broken links, or privacy concerns.

### Phase 2: Personal social launch

Post first on X, then LinkedIn, from Dan's personal account.

Goals:

- Tell the homeowner story, not just drop a repo link.
- Show that someone can use the live site directly.
- Ask for feedback from East Bay people, homeowners, gardeners, civic-tech folks, and AI builders.
- Invite one action: try sample data or upload your own EBMUD CSV locally.

### Phase 3: Community sharing

Use value-first posts, not repeated link drops.

Good communities:

- Local East Bay homeowner/gardening/conservation groups.
- `r/bayarea`, `r/eastbay`, `r/homeowners`, `r/landscaping`, `r/irrigation`, if rules allow and Dan has enough participation.
- Hacker News `Show HN` only after the upload flow is live and usable.
- Product Hunt later, after feedback and polish.

Community rules:

- Read each community's rules before posting.
- Do not post the same link everywhere at once.
- Make each post useful even without the link.
- For Reddit, avoid promotional repetition; Reddit Help describes spam as repeated/unwanted actions and cautions people whose contributions are mainly links to a business they benefit from.
- For Show HN, use the title format and only post because this is original work others can try.

## Launch copy

### X single post

I built Mud Buddy for EBMUD - a free browser-local tool for East Bay water customers.

Upload your EBMUD usage CSV, analyze it in your browser, and get a plain-English report about high bills, outdoor watering, normal use changes, and simple next checks.

No EBMUD password. No server upload. Not affiliated with EBMUD.

First goal: help households find 1M gallons of potential savings this year.

https://danieloleary.github.io/mud-buddy/

### X thread

1. I built Mud Buddy because my own EBMUD usage data was confusing, and household context mattered: kids, daytime use, irrigation, and a yard that needs work.

2. The app is simple: download your EBMUD usage CSV, upload it to Mud Buddy, and get a browser-local explanation of what changed.

3. It looks for patterns worth checking: normal use slowly rising, likely outdoor watering, unusual periods, similar-home context, and possible fixture/toilet clues.

4. It is not affiliated with EBMUD, not a leak detector, not billing advice, and not a plumbing inspection. Official account/billing/emergency/rebate actions happen on EBMUD's site.

5. The privacy boundary is the whole point: no EBMUD password, no credential automation, no server upload by default. Your CSV is read in your browser.

6. The first public mission is to help East Bay households find 1 million gallons of potential savings this year. Not certified savings, but practical patterns people can act on.

7. This feels like a good use of AI: helping people understand their own household data and make better water/money decisions. Try the sample data or your own CSV and send feedback.

### LinkedIn post

I shipped Mud Buddy for EBMUD - by Dan O'Leary, a free browser-local tool for EBMUD customers.

It turns an exported EBMUD water-use CSV into a plain-English report for homeowners: high-bill clues, irrigation-season lift, baseline changes, possible fixture checks, and practical next steps.

The goal is not to replace EBMUD, plumbers, or conservation experts. Mud Buddy is an interpretation layer that helps people understand their own usage data before deciding what to check next.

The privacy boundary is intentional:

- No EBMUD password needed.
- No credential automation.
- CSV analysis runs in the browser.
- No server upload for the primary app flow.
- Public sharing uses redacted/public output.
- Not affiliated with EBMUD.

The first public mission: help East Bay households find 1 million gallons of potential water savings this year.

This feels like a useful direction for AI: not replacing institutions, but helping people understand their own data and make better household decisions.

Feedback welcome, especially from East Bay homeowners, gardeners, conservation folks, and civic-tech builders.

https://danieloleary.github.io/mud-buddy/

### Show HN draft

Title:

```text
Show HN: Mud Buddy - Browser-local EBMUD water-use reports
```

Comment:

```text
Hi HN, I built Mud Buddy after digging into my own EBMUD water-use data and realizing the raw CSV was hard to interpret without household context.

It turns an EBMUD usage export into a browser-local, plain-English report: gallons-per-day trends, baseline changes, irrigation lift, peer context, possible fixture/leak clues, and practical next checks.

The privacy boundary is important: no EBMUD password, no credential automation, no server upload for the primary flow. It is not affiliated with EBMUD and is not a leak detector, billing tool, or official utility analysis.

The first public goal is to help East Bay households find 1M gallons of potential savings this year. I would love feedback on the product, privacy model, and whether this pattern could work for other utility data.
```

## Launch day checklist

- Confirm `npm run validate` passed on the release commit.
- Confirm `npm run test:local-real-csv` passed locally.
- Confirm GitHub Actions CI and Pages are green.
- Confirm live browser upload works with sample data and one private local CSV.
- Confirm live URLs return `200`.
- Confirm social card preview renders.
- Confirm X and LinkedIn profile links work.
- Create GitHub Release from the release tag.
- Add release notes from `CHANGELOG.md`.
- Post X single post.
- Post LinkedIn.
- Stay available for replies for 2-4 hours.
- Capture feedback into issues/backlog.

## Sources

- EBMUD service area: https://www.ebmud.com/about-us/who-we-are/service-area
- EBMUD FY2026 rate document: https://www.ebmud.com/download_file/force/34400/702?Rate_Document_for_FY_2026_Web.pdf=
- Product Hunt launch guide: https://www.producthunt.com/launch/
- HN Show guidelines: https://news.ycombinator.com/showhn.html
- Reddit Help Center spam policy: https://support.reddithelp.com/hc/en-us

