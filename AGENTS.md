# AGENTS.md

Guidance for AI coding agents working on Mud Buddy.

## Product Boundary

Mud Buddy is a local-first EBMUD CSV report generator and public demo site. It is not affiliated with EBMUD and is not a formal water audit, leak detector, plumbing inspection, billing tool, or official utility analysis.

Mud Buddy helps interpret your exported CSV; official account, billing, emergency, rebate, and conservation actions happen on EBMUD's site.

## Safety Rules

- Never ask for, store, paste, scrape, log, export, or transmit EBMUD usernames, passwords, MFA codes, cookies, localStorage, sessionStorage, auth headers, session tokens, CAPTCHA responses, or security-question answers.
- User login to EBMUD is always manual. Browser assistance may resume only after the user confirms they are logged in.
- Do not change EBMUD billing, autopay, contact, account, service, household profile, or settings pages.
- Process raw CSV files locally by default. Users may explicitly provide or upload a CSV to Mud Buddy/local agents for analysis; treat it as sensitive and never publish or commit raw private CSV data.
- Before creating public artifacts, run redaction checks and confirm no address, account number, meter ID, raw CSV, local path, or exact absence/vacation pattern is present.
- If the issue looks urgent, billing-related, pressure/outage-related, water-quality-related, rebate-related, or assistance-related, route the user to official EBMUD resources instead of over-interpreting Mud Buddy data.

## Official EBMUD Resources

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

## Development Commands

Use documented scripts unless the user asks for something else:

```bash
npm ci
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

Install Playwright Chromium before browser tests when needed:

```bash
npx playwright install chromium
```

## Editing Guidance

Keep changes small and explain tradeoffs. Preserve the local-first privacy model. Avoid overclaiming: use "possible leak clues" and "patterns worth checking," not certified diagnosis.
