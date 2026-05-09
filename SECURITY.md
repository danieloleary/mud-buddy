# Security Policy

Mud Buddy handles utility usage data, which can reveal household routines, occupancy patterns, irrigation behavior, and possible fixture issues. Treat real user data as sensitive.

## Supported Versions

Security fixes are accepted for the current public release line.

## Reporting A Vulnerability

Please open a private security advisory or contact the maintainer before publishing details. If no private channel is available yet, open a GitHub issue with only high-level impact and no private data, secrets, account numbers, addresses, raw CSV rows, or exploit payloads.

## Hard Boundaries

- Users may explicitly provide an EBMUD CSV to Mud Buddy or a local coding agent for private analysis.
- Do not submit real EBMUD credentials, MFA codes, cookies, session tokens, browser storage, auth headers, service addresses, account numbers, meter IDs, or raw customer CSV rows in vulnerability reports, public issues, public demos, ZIPs, screenshots, hosted artifacts, or third-party services.
- Do not include screenshots of authenticated EBMUD pages.
- Do not attempt CAPTCHA, MFA, bot-detection, rate-limit, or access-control bypass.
- Do not upload private utility data to third-party services without explicit user consent.

## Public Artifact Checklist

Before sharing a report, demo, ZIP, screenshot, or hosted page, confirm it contains no name, service address, account number, meter ID, raw CSV rows, local file paths, exact absence/vacation pattern, or deployment-state tokens. Use `--public` and run the redaction scan before sharing.
