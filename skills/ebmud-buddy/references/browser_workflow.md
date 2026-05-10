# Browser-Assisted EBMUD Workflow

Use this workflow only when the user explicitly asks Codex to help fetch their EBMUD data. Keep the trust boundary simple: the user logs into EBMUD directly; Codex helps only after login.

## Secure Sequence

1. Tell the user: "Please log into EBMUD yourself. Do not paste your password into Codex."
2. Open the official EBMUD My Water Report entry point or the user's already-open portal tab.
3. Wait until the user confirms they're logged in.
4. Navigate only to usage/reporting/export screens such as `Track Usage`.
5. Prefer official buttons labeled like `Download your data`, `Export`, or `CSV`.
6. After download, detect the local usage-file path, commonly in Chrome Downloads, and ask for permission before processing it.
7. Generate a local private report first. Generate a public-safe report with `--public` only when the user asks to share or publish.
8. At the end, remind the user to log out of EBMUD if this is a shared computer.

## Browser-Control Script Contract

- Automation may open the portal and wait.
- The human completes username, password, MFA, CAPTCHA, security questions, consent screens, and "remember this device" choices.
- Automation resumes only after user confirmation or a clearly post-login usage page.
- Prefer download-event detection over scraping tables from authenticated pages.
- If a usage file is downloaded or uploaded/provided by the user, process the local file with the same report generator used by manual workflows.

## Hard Stops

- Don't ask for or store usernames, passwords, MFA codes, cookies, localStorage, sessionStorage, auth headers, or session tokens.
- Don't bypass CAPTCHA, MFA, rate limits, bot detection, or access controls.
- Don't scrape account pages if the official usage export is available.
- Don't alter billing, autopay, contact, household-profile, service, or account settings.
- Don't publish or commit raw usage files, screenshots of logged-in pages, account numbers, meter IDs, service addresses, or exact absence/vacation patterns.
- If the portal layout changes or a page is unclear, stop and ask the user to manually download the usage file.

## Public Sharing Checklist

Before publishing or sharing a report, verify:

- No name.
- No service address.
- No account number.
- No meter ID.
- No raw usage-file.
- No local file paths.
- No exact absence/vacation pattern.
- Footer says the report isn't affiliated with EBMUD and isn't a formal water audit.

## Official Resource Routing

If the issue looks urgent, billing-related, pressure/outage-related, water-quality-related, rebate-related, or assistance-related, direct the user to official EBMUD resources instead of over-interpreting Mud Buddy data. Mud Buddy helps interpret exported usage patterns. Official account, billing, emergency, rebate, conservation, outage, pressure, assistance, and water-quality actions happen on EBMUD's site.

Use public EBMUD pages only, not authenticated or session-specific URLs.
