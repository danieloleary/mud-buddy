# Browser Control Safety

Mud Buddy can document a browser-assisted workflow, but the safe default is still manual CSV download. Browser control exists to help after the human is already logged in.

## Allowed Flow

1. Open the official EBMUD portal or use the tab the user already opened.
2. Ask the user to log in manually. Do not request credentials in chat.
3. Wait for explicit user confirmation that login is complete.
4. Navigate only to usage, report, Track Usage, export, or CSV download screens.
5. Prefer official controls labeled `Download your data`, `Export`, or `CSV`.
6. Detect the downloaded CSV and process it locally.
7. Generate a private local report first.
8. Generate a redacted public report only after the user asks to publish/share.

## Hard Stops

- No usernames, passwords, MFA codes, CAPTCHA responses, cookies, localStorage, sessionStorage, auth headers, or session tokens.
- No CAPTCHA, MFA, bot detection, rate-limit, or access-control bypass.
- No unattended real-portal scraping.
- No billing, autopay, contact, service, household-profile, or account-setting changes.
- No public screenshots of authenticated pages.
- Stop if labels, destinations, or portal layout are unclear.

## Mock Portal Testing

Automated tests use `tests/mock-ebmud-portal/` with synthetic data only. The mock portal includes a manual-login boundary and deterministic CSV download so browser automation can be tested without touching real EBMUD credentials or private data.

