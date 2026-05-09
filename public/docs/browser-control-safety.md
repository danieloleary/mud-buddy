# Browser Control Safety

Mud Buddy supports an agent-assisted browser workflow, but the human always completes login. Browser control exists to help after the human is already logged in and has confirmed the agent may continue.

Mud Buddy explains your CSV. EBMUD handles official account, billing, emergency, rebate, conservation, outage, pressure, assistance, and water-quality actions.

## Allowed Flow

1. Open the official EBMUD portal or use the tab the user already opened.
2. Ask the user to log in manually. Do not request credentials in chat.
3. Wait for explicit user confirmation that login is complete.
4. Navigate only to usage, report, Track Usage, export, or CSV download screens.
5. Prefer official controls labeled `Download your data`, `Export`, or `CSV`.
6. Detect the downloaded CSV in the browser download location, usually Chrome Downloads, or ask the user for the CSV path.
7. Ask before processing the detected CSV.
8. Generate a private local report first.
9. Generate a public-safe report with `--public` only after the user asks to publish/share.

## Official Resource Routing

If the issue looks urgent, billing-related, pressure/outage-related, water-quality-related, rebate-related, or assistance-related, stop interpreting the CSV as if it can resolve the issue and route the user to official EBMUD resources. Mud Buddy can explain patterns worth checking, but official account, billing, emergency, rebate, conservation, outage, pressure, assistance, and water-quality actions happen on EBMUD's site.

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

## Codex End-to-End Workflow

Use this flow when a user wants Codex or another local browser-control agent to help from EBMUD export through report generation.

1. Start from the local Mud Buddy repo.
2. Run setup if needed: `npm ci` and `npx playwright install chromium`.
3. Start the app if you want the local UI: `npm run dev`.
4. Open the official EBMUD portal in the browser.
5. The user logs in manually. The agent must not request, type, store, read, screenshot, or transmit credentials, MFA codes, CAPTCHA answers, cookies, localStorage, sessionStorage, auth headers, or session tokens.
6. After the user explicitly confirms login is complete, the agent may navigate only to usage, report, Track Usage, export, or CSV download screens.
7. The agent may click official export/download controls for the EBMUD usage CSV if labels and destination are clear.
8. The user may provide the downloaded CSV to Mud Buddy or to the local agent in this repo.
9. Generate the private report locally: `python scripts/generate_report.py "path/to/your-ebmud-export.csv" --out "generated/my-private-report"`.
10. Open `generated/my-private-report/index.html` locally.
11. Only if the user explicitly wants a shareable artifact, generate public output and run the redaction scan: `python scripts/generate_report.py "path/to/your-ebmud-export.csv" --out "generated/public-report" --public && npm run test:redaction`.

If the portal layout is ambiguous, a page looks sensitive, or Codex would need session data to proceed, stop and ask the user to download the CSV manually.

## Hard Stops

- No usernames, passwords, MFA codes, CAPTCHA responses, cookies, localStorage, sessionStorage, auth headers, or session tokens.
- No CAPTCHA, MFA, bot detection, rate-limit, or access-control bypass.
- No unattended real-portal scraping or background polling of authenticated pages.
- No billing, autopay, contact, service, household-profile, or account-setting changes.
- No public screenshots of authenticated pages.
- Stop if labels, destinations, or portal layout are unclear.

## Mock Portal Testing

Automated tests use `tests/mock-ebmud-portal/` with synthetic data only. The mock portal includes a manual-login boundary, deterministic CSV download, and local report generation so browser automation can be tested without touching real EBMUD credentials or private data.
