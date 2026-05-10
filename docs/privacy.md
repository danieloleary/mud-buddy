# Privacy

Mud Buddy is designed as a browser-local and local-first utility data workflow. Users may explicitly provide or upload an EBMUD usage file to Mud Buddy or a local AI coding agent for analysis, but credentials and browser session material remain out of scope.

## Defaults

- The public web app reads your selected usage file in your browser with the file picker.
- The browser-local analyzer doesn't upload your usage file to a Mud Buddy server.
- The browser-local analyzer doesn't store your usage file in localStorage, sessionStorage, IndexedDB, cookies, URLs, or a Mud Buddy account.
- No EBMUD username, password, MFA code, cookie, session token, auth header, localStorage value, or sessionStorage value should ever be pasted into Mud Buddy, Codex, Claude Code, Lovable, or another chat tool.
- Public demo reports use synthetic sample data.
- Publishing is opt-in and should use `--public` output plus redaction scanning.

## Browser-local analyzer

The live site supports `Find savings in 30 seconds` and `Try sample report`.

- `Find savings in 30 seconds` reads the selected file in memory and renders an in-page report.
- The report uses a generic source label and doesn't display the private filename.
- Identifier columns such as account number, meter, service address, name, email, and phone are ignored for browser display.
- Raw usage file rows aren't rendered into the page.
- The primary web app remains static on GitHub Pages.

## Public Sharing Checklist

Before sharing a report publicly, confirm it includes:

- No name.
- No service address.
- No account number.
- No meter ID.
- No raw usage file.
- No local file paths.
- No exact absence or vacation pattern.
- A visible "Not affiliated with EBMUD" disclaimer.

## Browser-Assisted Workflow

If Codex helps download data from EBMUD, the user logs in manually. Codex should only control the browser after login and only to find the official usage export/download flow. If the portal changes or a sensitive page is unclear, stop and download the usage file manually.

## Limitations

Water usage can reveal household routines, occupancy patterns, irrigation behavior, and possible leaks. Treat reports as sensitive unless generated with `--public` and checked with the redaction scan.
