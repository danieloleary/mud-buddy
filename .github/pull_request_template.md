# Pull Request Checklist

## Summary

- What changed?

## Privacy and safety

- [ ] No real EBMUD CSV rows, service addresses, account numbers, meter IDs, private filenames, local paths, credentials, session data, or authenticated screenshots are included.
- [ ] Public artifacts use `--public` when they come from usage data.
- [ ] Browser-control changes preserve manual login and credential/session hard stops.
- [ ] Claims stay modest: possible leak clues and patterns worth checking, not official diagnosis.

## Docs and official resources

- [ ] README/docs still say Mud Buddy is not affiliated with EBMUD.
- [ ] Official account, billing, emergency, rebate, conservation, outage, pressure, assistance, and water-quality actions route to EBMUD resources.
- [ ] Public links are GitHub Pages-safe and do not point to authenticated/session URLs.

## Tests

- [ ] `npm run validate` passes locally or in CI.
