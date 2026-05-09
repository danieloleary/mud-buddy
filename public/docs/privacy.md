# Privacy

Mud Buddy is designed as a local-first utility data workflow. Users may explicitly provide or upload an EBMUD CSV to Mud Buddy or a local AI coding agent for analysis, but credentials and browser session material remain out of scope.

## Defaults

- Your EBMUD export is processed on your machine unless you explicitly choose another workflow.
- No account is required for the local workflow.
- No EBMUD username, password, MFA code, cookie, session token, auth header, localStorage value, or sessionStorage value should ever be pasted into Mud Buddy, Codex, Claude Code, Lovable, or another chat tool.
- Public demo reports use synthetic sample data.
- Publishing is opt-in and should use `--public` output plus redaction scanning.

## Public Sharing Checklist

Before sharing a report publicly, confirm it includes:

- No name.
- No service address.
- No account number.
- No meter ID.
- No raw CSV.
- No local file paths.
- No exact absence or vacation pattern.
- A visible "Not affiliated with EBMUD" disclaimer.

## Browser-Assisted Workflow

If Codex helps download data from EBMUD, the user logs in manually. Codex should only control the browser after login and only to find the official usage export/download flow. If the portal changes or a sensitive page is unclear, stop and download the CSV manually.

## Limitations

Water usage can reveal household routines, occupancy patterns, irrigation behavior, and possible leaks. Treat reports as sensitive unless generated with `--public` and checked with the redaction scan.

