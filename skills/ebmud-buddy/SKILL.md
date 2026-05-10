---
name: ebmud-buddy
description: Analyze EBMUD water usage exports and create clear driver-focused summaries or visual reports. Use when Codex is asked to inspect East Bay Municipal Utility District / EBMUD billing usage data, water consumption files with CCF or gallons-per-day columns, WaterScore trends, irrigation seasonality, household baseline changes, leak/fixture clues, or to generate a scrollable water-usage report for a home.
---

# EBMUD Buddy

Analyze EBMUD usage exports by separating normalized usage trends from likely drivers: household baseline, irrigation/seasonal lift, average-household benchmarks, anomalies, and practical next actions. Keep the workflow local-first and privacy-preserving.

## Quick Start

Use the bundled generator for repeatable reports:

```bash
python scripts/ebmud_buddy_report.py "path/to/ebmud.csv" --out "path/to/output-folder"
```

For public-safe output:

```bash
python scripts/ebmud_buddy_report.py "path/to/ebmud.csv" --out "public-report" --public
```

Add user-provided context when available:

```bash
python scripts/ebmud_buddy_report.py "path/to/ebmud.csv" --out "report" --address "Redacted Example Home" --household "two adults home most days; young kids; frequent laundry" --irrigation "watering increased; older irrigation system; yard refresh planned"
```

Open `index.html` from the output folder. If the user asks to publish it, generate a redacted report first and use the `here-now` skill only after the user confirms the public-sharing checklist.

## Workflow

1. Parse the usage file and validate expected columns: `Reading Date`, `Days in Read Period`, `CCF`, `Customer GPD`, `Average Households GPD`, `Top 20% GPD`, and `WaterScore`.
2. Use `Customer GPD` as the primary trend metric because it normalizes billing-period length.
3. Estimate a current indoor/household baseline from recent winter/spring periods, then treat usage above that baseline as outdoor/seasonal lift.
4. Compare against the home itself first; use EBMUD average-household benchmarks second because neighborhood averages also rise during irrigation season.
5. Incorporate user context explicitly. Family size, work-from-home, toilet flushing, laundry, irrigation schedule changes, and yard projects can explain usage shifts.
6. Flag anomalies without overclaiming. March/early-spring high use, high WaterScore periods, and winter usage above baseline deserve follow-up, but context may explain them.
7. Recommend low-cost diagnostic checks before expensive fixes: toilet dye tests, meter test with irrigation off, controller schedule audit, irrigation inspection, then redesign.

For browser-assisted account workflows, read `references/browser_workflow.md` before opening or controlling an EBMUD portal tab.

## Interpretation Defaults

- `1 CCF = 748 gallons`.
- Winter: December-February. Spring: March-May. Summer: June-September. Fall: October-November.
- Use a context-aware current baseline when the household has changed; don't treat old lowest months as the user's current realistic target.
- If irrigation was intentionally increased and the system is failing, frame the target as "more plant health per gallon," not simply "use less water."
- Treat address, account number, meter ID, raw usage-file rows, and household occupancy clues as sensitive. Users may explicitly provide usage files for local analysis, but raw private usage data must never be published or committed. Default to private local reports; use `--public` before sharing.

For more detailed diagnostic heuristics, read `references/interpretation.md`.

## Output Style

Prefer a practical, friendly tone. The best report tells a causal story:

- What changed?
- What is probably normal household growth?
- What is likely irrigation or system inefficiency?
- Which periods deserve attention?
- What should the homeowner check next?

## Public vs private report modes

- Private/local default: `python scripts/ebmud_buddy_report.py path/to/your-ebmud-export.csv --out generated/my-private-report`.
- Identifier redaction only: add `--redact`; this removes direct identifiers but isn't full anonymization.
- Public sharing mode: add `--public`; this also buckets dates and usage values, removes detailed context, and labels the output public/anonymized.

When working from the Mud Buddy repo root instead of an installed skill folder, use `python scripts/generate_report.py ...`.
