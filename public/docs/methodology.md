# Methodology

Mud Buddy reads EBMUD-style CSV exports and creates a visual report from billing-period data.

## Core Calculations

- `1 CCF = 748 gallons`.
- `Customer GPD` is the primary trend metric because it normalizes different billing-period lengths.
- Seasons are grouped as winter (`Dec-Feb`), spring (`Mar-May`), summer (`Jun-Sep`), and fall (`Oct-Nov`).
- Baseline is estimated from recent winter/spring periods when possible; it is a heuristic household pattern clue, not an official indoor-use classification.
- Seasonal or outdoor lift is estimated as usage above the baseline; it is a heuristic clue, not proof of irrigation, leak, or waste.
- Average-household benchmark values from the export are used only as context and are not a normalized customer comparison.

## Interpretation

Mud Buddy compares a home against its own history first. Average-household benchmarks are useful context, but they can hide personal changes because neighborhood usage also rises during irrigation season and every household is different.

The report can highlight patterns worth checking, such as:

- High winter or spring usage.
- Summer/fall irrigation lift.
- Fall usage staying high after peak heat.
- A one-period spike or high WaterScore.

## Caveats

Mud Buddy is not a formal water audit, plumbing inspection, leak detector, or official EBMUD analysis. It is a practical interpretation layer for homeowner decision-making.

