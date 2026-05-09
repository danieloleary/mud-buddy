# Data Schema

Mud Buddy expects EBMUD-style billing usage CSV exports. The parser is intentionally conservative and skips rows that are incomplete or invalid.

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

## Redaction Behavior

Use `--redact` for public-safe output. Public reports should remove address, account number, meter ID, raw CSV rows, local file paths, and exact absence/vacation patterns.
