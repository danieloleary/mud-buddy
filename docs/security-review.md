# Security Review

Mud Buddy is a browser-local utility data tool for EBMUD-style usage exports. It is not affiliated with, endorsed by, approved by, or officially reviewed by EBMUD unless EBMUD explicitly says so in writing. It is not a formal water audit, leak detector, plumbing inspection, billing tool, or official utility analysis.

## Threat Model

Water usage data can reveal household routines, occupancy patterns, irrigation behavior, fixture problems, vacation timing, and service address details. The main risks are accidental public sharing, over-collection during browser assistance, browser-report leakage, and publishing raw artifacts inside demo bundles.

## Consent Boundaries

- The user controls login, MFA, CAPTCHA, security questions, and consent prompts.
- Codex may assist only after the user confirms they are logged in.
- Codex should navigate only to usage/export/download screens.
- If the portal layout changes or a page is unclear, stop and ask the user to download the usage file manually.

## Browser-local app boundary

- The live app uses a file picker or drag/drop to read the user-selected usage file.
- The usage file is parsed in browser memory and rendered directly into the page.
- The app must not upload user usage-file data to a backend.
- The app must not store user usage-file data in localStorage, sessionStorage, IndexedDB, cookies, query strings, or URL fragments.
- The browser report should not display private filenames, account numbers, meter IDs, raw usage-file rows, local paths, or service addresses.

## Data Minimization

- Process usage files locally by default.
- Users may explicitly provide or upload an EBMUD usage file to Mud Buddy or a local AI coding agent for analysis.
- Do not publish, commit, or bundle raw private usage files.
- Public reports should be generated with `--public`; `--redact` is identifier-only.
- Public ZIPs must exclude private reports, real usage files, here.now deployment state files, browser traces, and local download folders.

## Credential And Session Hard Stops

Mud Buddy refuses to ask for, store, scrape, log, export, or transmit EBMUD usernames, passwords, MFA codes, cookies, localStorage, sessionStorage, auth headers, session tokens, CAPTCHA responses, or security-question answers.

## Browser Session Risks

Optional browser help can accidentally expose sensitive account pages. The safe path is a mock-tested workflow plus real-portal restraint: user-supervised login, official usage-file download controls only, no setting changes, no billing changes, no unattended scraping, and no screenshots of authenticated pages for public launch assets.

## Redaction Checklist

Before publishing, confirm the artifact contains:

- No name.
- No service address.
- No account number.
- No meter ID.
- No raw usage-file rows.
- No local file paths.
- No exact absence/vacation pattern.
- A visible "not affiliated with EBMUD" disclaimer.

## What The Tool Refuses To Do

- Enter real EBMUD credentials.
- Bypass CAPTCHA, MFA, rate limits, bot detection, or access controls.
- Change account settings, billing preferences, autopay, contact info, or service details.
- Diagnose leaks as certified fact.
- Publish private utility data without explicit user intent, `--public` output, and redaction checks.
