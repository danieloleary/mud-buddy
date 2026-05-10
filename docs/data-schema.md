# Data Schema

Mud Buddy expects EBMUD-style billing usage file from EBMUDs. The parser is intentionally conservative and skips rows that are incomplete or invalid.

The usage file itself is allowed input for Mud Buddy or local agents when the user explicitly provides it. But it should still be treated as private household utility data and excluded from public reports, hosted artifacts, and ZIP packages.

## Expected Columns

Browser-local analysis requires:

- `Reading Date`
- `Days in Read Period`
- `CCF`
- `Customer GPD`

Recommended EBMUD context columns:

- `Average Households GPD`
- `Top 20% GPD`
- `WaterScore`

Additional columns may be present. Identifiers such as account number, service address, meter ID, name, phone, and email are treated as sensitive and shouldn't appear in public reports or browser-rendered output.

## Units

- `1 CCF = 748 gallons`.
- `Customer GPD` is the primary trend metric because it normalizes billing-period length.
- `GPD` means gallons per day.

## Invalid Rows

Rows are excluded if required numeric values are missing, `Customer GPD` is `N/A`, the date is missing, or the date can't be parsed as `YYYY-MM-DD`.

## Browser-local analysis

The public site parses usage file text in browser memory and returns summary metrics: valid rows, invalid rows, total CCF, total gallons, average GPD, baseline GPD, likely outdoor watering, peak period, peer comparison, and insights.

The browser report shouldn't render account numbers, meter IDs, filenames, raw usage-file rows, service addresses, local paths, or exact private identifiers.

## Public Mode

Use `--public` for public-safe generated HTML/SVG output. Public reports should remove or bucket address, account number, meter ID, raw usage-file rows, local file paths, exact billing-period clues, and exact absence/vacation patterns.

Use `--redact` only for identifier redaction in local/private workflows; it isn't full anonymization.

## Synthetic Flavor Fixtures

`npm run generate:synthetic` creates 20 ignored EBMUD-style usage file flavors under `tests/output/synthetic-flavors/`. By default, the generator derives shape from the committed synthetic sample usage file only. A real usage file can be used as an explicit local source with `--source`, but that source must remain private and ignored.

These files are for local tests only and mustn't be committed. The committed public sample remains `examples/sample-ebmud-usage.csv`.
