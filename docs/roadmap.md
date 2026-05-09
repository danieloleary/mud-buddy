# Roadmap

## Immediate Launch Blocker

- Finish the homeowner-first QA pass on the live browser app: clearer copy, less maintainer/demo noise, stronger Material results, and one rendered desktop/mobile browser review.
- Keep the upload flow static and local: file picker, in-browser parsing, in-page report rendering, no backend upload, no browser storage, no private filename display.
- Validate parser parity against the Python generator, synthetic source policy, sample-data fetch boundaries, and no-network-after-upload checks.
- Keep `Analyze my CSV`, `Try sample data`, and `How to download your EBMUD CSV` as the primary public actions.

## 1.0 Public Launch

- Launch as **Mud Buddy for EBMUD - by Dan O'Leary** with the `help save 1 million gallons this year` mission.
- Keep claims framed as potential savings or helped-save, not verified EBMUD conservation totals.
- Preserve manual-login-only EBMUD browser assistance for AI-agent workflows.
- Validate with synthetic datasets, mock browser flow, browser upload tests, redaction/package scans, and Dan's explicit private local CSV gate.
- Publish through GitHub Pages and a GitHub release after the full release gate passes.

## Near Term After Launch

- Add a first-run wizard with `Download CSV`, `Analyze my CSV`, `Review next checks`, and `Share safely`.
- Add cleaner report export controls for `Print or save PDF`.
- Add baseline-confidence labels and fixture/toilet check worksheets.
- Add a helped-save estimate worksheet that stays local and avoids certified claims.
- Add public examples gallery using synthetic scenarios only.
- Add community feedback triage and a 1M-gallon progress page.
- Add report export as PDF or print-friendly HTML.

## Later

- Support smart-meter/hourly exports if available.
- Support additional utilities with similar CSV or Green Button exports.
- Build utility-template abstractions for other local-first civic data tools.
- Build community partner and local conservation professional workflows.
- Explore an optional hosted backend only if users ask for it and privacy/security requirements are fully defined.

