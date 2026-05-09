# Use Mud Buddy With AI Coding Tools

Mud Buddy can work well with Claude Code, Codex, and Lovable when the instructions stay simple and the safety boundary is explicit.

Copy-paste safety rule for every tool:

> Work locally. Do not ask for, store, paste, scrape, log, export, or transmit EBMUD usernames, passwords, MFA codes, cookies, localStorage, sessionStorage, auth headers, session tokens, CAPTCHA responses, account numbers, meter IDs, service addresses, or raw private CSV rows in public artifacts. Ask before controlling a real browser. The user logs into EBMUD manually. Generate private local reports first. Use `--public` and redaction scans before sharing.

Mud Buddy helps interpret your exported CSV; official account, billing, emergency, rebate, and conservation actions happen on EBMUD's site.

## Claude Code

Paste this into Claude Code after opening the repo:

```text
Read README.md, AGENTS.md, CLAUDE.md, docs/privacy.md, docs/browser-control-safety.md, and docs/security-review.md. Help me generate a private local Mud Buddy report from an EBMUD CSV I explicitly provide. Do not handle credentials or session data. If browser control is needed, ask before controlling the browser and wait while I log in manually. Use the official CSV download only if the portal is clear. Run: python scripts/generate_report.py "path/to/your-ebmud-export.csv" --out "generated/my-private-report". For public sharing, use --public and run npm run test:redaction. For release checks, run npm run validate.
```

Useful Claude Code commands when appropriate: `/doctor`, `/debug`, `/diff`, and `/review`.

## Codex

Paste this into Codex after opening the repo:

```text
Follow AGENTS.md. Use the ebmud-buddy skill when available. Help me analyze an EBMUD usage CSV I explicitly provide or ask you to locate after manual login. Never ask for or handle credentials, MFA, CAPTCHA, cookies, localStorage, sessionStorage, auth headers, or session tokens. Ask before real browser control. After I log in manually, navigate only to usage, Track Usage, export, or CSV download screens. Ask before processing the downloaded CSV. Generate a private report first with: python scripts/generate_report.py "path/to/your-ebmud-export.csv" --out "generated/my-private-report". For public output, use --public and run npm run test:redaction. Before release, run npm run validate.
```

## Lovable

Lovable is best for prototyping UI ideas from a concise app brief. Do not assume it can directly import and safely operate this repo unless you set that workflow up yourself.

Pasteable app brief:

```text
Build a local-first static web app called Mud Buddy. It helps EBMUD customers understand an exported usage CSV with trends, seasonal irrigation lift, possible leak clues, and public-safe summaries. The app must say it is not affiliated with EBMUD and must never ask for passwords or session data. Include clear instructions to download the CSV manually from EBMUD, analyze locally, and use --public/redaction checks before sharing. Add official EBMUD resource links for account, billing, leaks/high bills, conservation/rebates, WaterSmart gardener, alerts/outages, water quality, customer assistance, and contact/emergency.
```

## Common setup and validation

```bash
npm ci
npx playwright install chromium
npm run generate:sample
npm run generate:synthetic
npm run build
npm run package:public
npm run test:landing
npm run test:report
npm run test:browser-flow
npm run test:privacy
npm run test:csv-provision
npm run test:synthetic
npm run test:docs
npm run test:redaction
npm run test:subpath
npm run validate
```

## Official EBMUD resources

If the issue looks urgent, billing-related, pressure/outage-related, water-quality-related, rebate-related, or assistance-related, route the user to official EBMUD resources instead of over-interpreting Mud Buddy data.

| Need | Official EBMUD page |
| --- | --- |
| Customer starting point | [Customers](https://www.ebmud.com/customers) |
| Account access and My Water Report entry points | [Your account](https://www.ebmud.com/customers/account) |
| Track Usage and My Water Report guidance | [My Water Report Program](https://www.ebmud.com/water/conservation-and-rebates/my-water-report-program) |
| Bills, rates, payment questions, and account help | [Billing questions](https://www.ebmud.com/customers/billing-questions) |
| Patterns worth checking, high use, and leak guidance | [Leaks and high bills](https://www.ebmud.com/customers/billing-questions/leaks-and-high-bills) |
| Conservation services and rebates | [Conservation and rebates](https://www.ebmud.com/water/conservation-and-rebates) |
| Landscape, irrigation, and water-wise garden help | [WaterSmart gardener](https://www.ebmud.com/water/conservation-and-rebates/watersmart-gardener) |
| Outages, service alerts, and emergency notices | [Alerts and outages](https://www.ebmud.com/customers/alerts) |
| Water-quality reports and safety information | [Water quality](https://www.ebmud.com/water/about-your-water/water-quality) |
| Bill support for eligible customers | [Customer Assistance Program](https://www.ebmud.com/customers/customer-assistance-program) |
| Contact, emergency, and official support | [Contact / emergency](https://www.ebmud.com/contact-us) |
