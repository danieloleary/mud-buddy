# Mobile QA Checklist

Run this on the live GitHub Pages site before broad launch:

https://danieloleary.github.io/mud-buddy/

## Devices

- iPhone Safari.
- Android Chrome if available.
- Desktop Chrome for comparison.

## First viewport

- Page loads without horizontal scrolling.
- Brand, headline, upload card, and `Try sample report` are visible or quickly reachable.
- The headline does not clip.
- The upload card does not feel like a secondary feature.
- Trust chips make sense: browser-local, no server upload, no EBMUD login secret.

## Sample flow

- Tap `Try sample report`.
- Report renders without console-visible breakage or layout jump.
- `Create another report` and `Print or save PDF` are visible in the report.
- Report sections are readable: `Start here`, `Other clues`, `Recommended next checks`, `This weekend`, `Key numbers`, charts, `Usage file notes`, and `When to use EBMUD directly`.

## Real usage file flow

- Tap `Find savings in 30 seconds`.
- File picker opens.
- Choose an EBMUD billing usage file.
- Report renders.
- The report does not show filename, local path, account number, meter ID, service address, or raw usage file rows.
- If the wrong file type is selected, the error message is clear and recoverable.

## Official links

- `How to get your usage file` scrolls to the guidance section.
- Official EBMUD resource links open public `ebmud.com` pages.
- Footer links work.

## Acceptance

Mobile launch is acceptable when:

- sample flow works;
- real usage file flow works at least once;
- no horizontal overflow appears;
- report actions are not hidden in blank space;
- privacy and non-affiliation language remain visible;
- the app feels like a utility, not a pitch deck.

