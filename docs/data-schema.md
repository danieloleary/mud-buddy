# Data Schema

Mud Buddy expects EBMUD-style billing usage CSV exports. The parser is intentionally conservative and skips rows that are incomplete or invalid.

The CSV itself is allowed input for Mud Buddy or local agents when the user explicitly provides it, but it should still be treated as private household utility data and excluded from public reports, hosted artifacts, and ZIP packages.

## Expected Columns

- `Reading Date`
- `Days in Read Period`
- `CCF`
- `Customer GPD`
- `Average Households GPD`
- `Top 20% GPD`
- `WaterScore`

Additional columns may be present. Identifiers such as account number, service address, meter ID, name, phone, and email are treated as sensitive and should not appear in public reports.

## Units

- `1 CCF = 748 gallons`.
- `Customer GPD` is the primary trend metric because it normalizes billing-period length.

## Invalid Rows

Rows are excluded if required numeric values are missing, `Customer GPD` is `N/A`, the date is missing, or the date cannot be parsed as `YYYY-MM-DD`.

## Public Mode

Use `--public` for public-safe output. Public reports should remove or bucket address, account number, meter ID, raw CSV rows, local file paths, exact billing-period clues, and exact absence/vacation patterns.

Use `--redact` only for identifier redaction in local/private workflows; it is not full anonymization.

## Synthetic Flavor Fixtures

`npm run generate:synthetic` creates 20 ignored EBMUD-style CSV flavors under `tests/output/synthetic-flavors/`. The generator may read Dan's local CSV as a shape/source pattern, but it replaces identifiers, dates, usage levels, account number, meter, filename context, and scenario behavior.

These files are for local tests only and must not be committed. The committed public sample remains `examples/sample-ebmud-usage.csv`.
