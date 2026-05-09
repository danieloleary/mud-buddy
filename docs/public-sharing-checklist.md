# Public Sharing Checklist

Water usage data can reveal household routines. Before publishing or sharing any Mud Buddy artifact, confirm every item below.

- No name.
- No service address.
- No account number.
- No meter ID.
- No raw usage-file rows.
- No local file paths.
- No exact absence or vacation pattern.
- No authenticated EBMUD screenshots.
- No private household screenshots in social previews.
- Social card uses synthetic/sample data only.
- No deployment-state files, claim URLs, API keys, or tokens.
- Visible disclaimer says the project is not affiliated with EBMUD.

Recommended command before sharing the packaged public site:

```bash
npm run package:public
npm run test:redaction
```

For personal/private reports, keep the output local unless you intentionally create a separate public/anonymized report with `--public`.

