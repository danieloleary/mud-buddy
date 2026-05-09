# Security Review

Mud Buddy by Danno is a local-first utility data tool for EBMUD-style CSV exports. It is not affiliated with EBMUD and is not a formal water audit, leak detector, plumbing inspection, billing tool, or official utility analysis.

## Threat Model

Water usage data can reveal household routines, occupancy patterns, irrigation behavior, fixture problems, vacation timing, and service address details. The main risks are accidental public sharing, over-collection during browser assistance, and publishing raw artifacts inside demo bundles.

## Consent Boundaries

- The user controls login, MFA, CAPTCHA, security questions, and consent prompts.
- Codex may assist only after the user confirms they are logged in.
- Codex should navigate only to usage/export/download screens.
- If the portal layout changes or a page is unclear, stop and ask the user to download the CSV manually.

## Data Minimization

- Process CSV files locally by default.
- Do not upload raw EBMUD CSVs to cloud services.
- Public reports should be generated with `--redact`.
- Public ZIPs must exclude private reports, real CSVs, here.now deployment state files, browser traces, and local download folders.

## Credential And Session Hard Stops

Mud Buddy refuses to ask for, store, scrape, log, export, or transmit EBMUD usernames, passwords, MFA codes, cookies, localStorage, sessionStorage, auth headers, session tokens, CAPTCHA responses, or security-question answers.

## Browser Session Risks

Browser assistance can accidentally expose sensitive account pages. The safe path is a mock-tested workflow plus real-portal restraint: user-supervised login, official CSV download controls only, no setting changes, no billing changes, no unattended scraping, and no screenshots of authenticated pages for public launch assets.

## Redaction Checklist

Before publishing, confirm the artifact contains:

- No name.
- No service address.
- No account number.
- No meter ID.
- No raw CSV rows.
- No local file paths.
- No exact absence/vacation pattern.
- A visible "not affiliated with EBMUD" disclaimer.

## What The Tool Refuses To Do

- Enter real EBMUD credentials.
- Bypass CAPTCHA, MFA, rate limits, bot detection, or access controls.
- Change account settings, billing preferences, autopay, contact info, or service details.
- Diagnose leaks as certified fact.
- Publish private utility data without explicit user intent and redaction checks.

