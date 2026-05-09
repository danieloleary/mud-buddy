#!/usr/bin/env python3
"""Generate a scrollable EBMUD water usage report from an EBMUD CSV export.

The script intentionally uses only the Python standard library so it can run in
minimal Codex environments without pandas/matplotlib.
"""

from __future__ import annotations

import argparse
import csv
import html
import json
import math
import os
from datetime import datetime
from pathlib import Path

GAL_PER_CCF = 748

C = {
    "teal": "#39b9c6",
    "blue": "#2166a5",
    "navy": "#18324a",
    "gold": "#f2b31b",
    "coral": "#e96f47",
    "green": "#7c9d35",
    "gray": "#6d7780",
    "light": "#f5f7f8",
    "line": "#d9e0e5",
    "ink": "#263238",
}


def num(value):
    text = "" if value is None else str(value).strip()
    if not text or text.upper() in {"N/A", "NA"}:
        return None
    try:
        return float(text.replace(",", ""))
    except ValueError:
        return None


def season_for(month: int) -> str:
    if month in (12, 1, 2):
        return "Winter"
    if month in (3, 4, 5):
        return "Spring"
    if month in (6, 7, 8, 9):
        return "Summer"
    return "Fall"


def parse_rows(csv_path: Path):
    raw = list(csv.DictReader(csv_path.open(newline="", encoding="utf-8-sig")))
    rows = []
    invalid = []
    for r in raw:
        ccf = num(r.get("CCF"))
        gpd = num(r.get("Customer GPD"))
        days = num(r.get("Days in Read Period"))
        avg = num(r.get("Average Households GPD"))
        top = num(r.get("Top 20% GPD"))
        date_text = r.get("Reading Date")
        if ccf is None or gpd is None or days is None or not date_text:
            invalid.append(r)
            continue
        try:
            date = datetime.strptime(date_text, "%Y-%m-%d")
        except ValueError:
            invalid.append(r)
            continue
        rows.append(
            {
                "date": date,
                "year": date.year,
                "month": date.month,
                "season": season_for(date.month),
                "days": days,
                "ccf": ccf,
                "gallons": ccf * GAL_PER_CCF,
                "gpd": gpd,
                "avg": avg,
                "top": top,
                "score": r.get("WaterScore", ""),
                "account": r.get("Account Number", ""),
            }
        )
    rows.sort(key=lambda r: r["date"])
    if not rows:
        raise SystemExit("No valid EBMUD usage rows found.")
    return raw, rows, invalid


def bucket_public_value(value, bucket=25):
    if value is None:
        return None
    return round(float(value) / bucket) * bucket


def publicize_rows(rows):
    """Return bucketed month-level rows for public sharing.

    Public mode keeps the story useful while removing exact period-level usage,
    exact bill-cycle dates, and raw occupancy-sensitive highs/lows.
    """
    public_rows = []
    for r in rows:
        nr = dict(r)
        nr["date"] = datetime(r["date"].year, r["date"].month, 15)
        nr["days"] = 30
        nr["gpd"] = bucket_public_value(r["gpd"], 25)
        nr["avg"] = bucket_public_value(r.get("avg"), 25)
        nr["top"] = bucket_public_value(r.get("top"), 25)
        nr["ccf"] = bucket_public_value(r["ccf"], 5)
        nr["gallons"] = nr["ccf"] * GAL_PER_CCF
        nr["score"] = "bucketed"
        public_rows.append(nr)
    return public_rows


def estimate_baseline(rows):
    recent_year = max(r["year"] for r in rows)
    candidates = [
        r["gpd"]
        for r in rows
        if r["year"] >= recent_year - 1 and r["season"] in {"Winter", "Spring"}
    ]
    if len(candidates) < 3:
        candidates = [r["gpd"] for r in rows if r["season"] in {"Winter", "Spring"}]
    if not candidates:
        return round(sum(r["gpd"] for r in rows) / len(rows))
    return round(sum(candidates) / len(candidates))


def esc(value) -> str:
    return html.escape(str(value), quote=True)


def svg_start(width, height):
    return [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        '<rect width="100%" height="100%" fill="white"/>',
        "<style>text{font-family:Arial,Helvetica,sans-serif;fill:#263238}.title{font-size:30px;font-weight:700}.sub{font-size:17px;fill:#6d7780}.small{font-size:13px;fill:#6d7780}.label{font-size:15px}.bold{font-weight:700}.grid{stroke:#e8edf1;stroke-width:1}.axis{stroke:#ccd5dc;stroke-width:1}.note{font-size:14px;fill:#6d7780}</style>",
    ]


def save_svg(path: Path, parts):
    parts.append("</svg>")
    path.write_text("\n".join(parts), encoding="utf-8")


def text(parts, x, y, value, cls="label", fill=None, anchor="start", weight=None):
    style = []
    if fill:
        style.append(f"fill:{fill}")
    if weight:
        style.append(f"font-weight:{weight}")
    attr = f' style="{";".join(style)}"' if style else ""
    parts.append(
        f'<text x="{x:.1f}" y="{y:.1f}" class="{cls}" text-anchor="{anchor}"{attr}>{esc(value)}</text>'
    )


def rect(parts, x, y, w, h, fill, stroke="none", rx=0, opacity=None):
    op = f' opacity="{opacity}"' if opacity is not None else ""
    parts.append(
        f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" fill="{fill}" stroke="{stroke}"{op}/>'
    )


def line(parts, x1, y1, x2, y2, stroke, width=1):
    parts.append(
        f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{stroke}" stroke-width="{width}"/>'
    )


def circle(parts, x, y, r, fill, stroke="white", sw=2):
    parts.append(
        f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'
    )


def path(parts, d, stroke, fill="none", width=2):
    parts.append(
        f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{width}" stroke-linejoin="round" stroke-linecap="round"/>'
    )


def polygon(parts, points, fill, opacity=1):
    pts = " ".join(f"{x:.1f},{y:.1f}" for x, y in points)
    parts.append(f'<polygon points="{pts}" fill="{fill}" opacity="{opacity}"/>')


def scales(rows, x0, y0, w, h, ymax):
    xs = [r["date"].timestamp() for r in rows]
    min_x, max_x = min(xs), max(xs)

    def sx(date):
        x = date.timestamp()
        return x0 + ((x - min_x) / (max_x - min_x)) * w if max_x != min_x else x0 + w / 2

    def sy(value):
        return y0 + h - (value / ymax) * h

    return sx, sy


def grid(parts, x0, y0, w, h, ymax, ticks=5):
    for i in range(ticks + 1):
        value = ymax * i / ticks
        y = y0 + h - (value / ymax) * h
        line(parts, x0, y, x0 + w, y, C["line"], 1)
        text(parts, x0 - 12, y + 5, f"{value:.0f}", "small", anchor="end")
    line(parts, x0, y0 + h, x0 + w, y0 + h, "#ccd5dc", 1.2)
    line(parts, x0, y0, x0, y0 + h, "#ccd5dc", 1.2)


def line_path(points):
    return " ".join(("M" if i == 0 else "L") + f" {x:.1f} {y:.1f}" for i, (x, y) in enumerate(points))


def render_timeline(out_dir, rows, baseline, title, public_mode=False):
    width, height = 1500, 760
    parts = svg_start(width, height)
    text(parts, 60, 60, title, "title")
    text(parts, 60, 90, "GPD normalizes billing-period length and makes the real trend easier to see.", "sub")
    x0, y0, w, h = 105, 165, 1290, 450
    ymax = max(260, math.ceil(max(max(r["gpd"], r.get("avg") or 0, r.get("top") or 0) for r in rows) / 50) * 50)
    sx, sy = scales(rows, x0, y0, w, h, ymax)
    grid(parts, x0, y0, w, h, ymax)
    rect(parts, x0, sy(baseline + 10), w, sy(max(0, baseline - 10)) - sy(baseline + 10), C["gold"], opacity=0.16)
    for key, color, line_width in [("avg", "#aab4bd", 2.4), ("top", C["blue"], 2.4), ("gpd", C["teal"], 3.2)]:
        pts = [(sx(r["date"]), sy(r[key])) for r in rows if r.get(key) is not None]
        if pts:
            path(parts, line_path(pts), color, width=line_width)
    for r in rows:
        circle(parts, sx(r["date"]), sy(r["gpd"]), 5.5, C["teal"])
    peak = max(rows, key=lambda r: r["gpd"])
    text(parts, sx(peak["date"]) + 10, sy(peak["gpd"]) - 12, "Peak bucket" if public_mode else f"Peak: {peak['gpd']:.0f} GPD", "small", C["coral"], weight="700")
    for year in range(min(r["year"] for r in rows), max(r["year"] for r in rows) + 1):
        x = sx(datetime(year, 1, 1))
        text(parts, x, y0 + h + 30, str(year), "small", anchor="middle")
    text(parts, 60, 710, (f"Public mode buckets visible values; baseline bucket centers around {baseline:.0f} GPD." if public_mode else f"Estimated current baseline band centers around {baseline:.0f} GPD."), "note")
    save_svg(out_dir / "01_timeline.svg", parts)


def render_stack(out_dir, rows, baseline):
    width, height = 1500, 760
    parts = svg_start(width, height)
    text(parts, 60, 60, "Indoor baseline vs outdoor lift", "title")
    text(parts, 60, 90, "Separates likely everyday household use from seasonal yard water.", "sub")
    x0, y0, w, h = 105, 165, 1290, 450
    ymax = max(260, math.ceil(max(r["gpd"] for r in rows) / 50) * 50)
    sx, sy = scales(rows, x0, y0, w, h, ymax)
    grid(parts, x0, y0, w, h, ymax)
    base = [(sx(r["date"]), sy(min(r["gpd"], baseline))) for r in rows]
    total = [(sx(r["date"]), sy(r["gpd"])) for r in rows]
    polygon(parts, [(x0, y0 + h)] + base + [(sx(rows[-1]["date"]), y0 + h)], C["teal"], 0.82)
    polygon(parts, base + total[::-1], C["gold"], 0.82)
    path(parts, line_path(total), C["navy"], width=3)
    rect(parts, 1030, 125, 330, 115, C["light"], "#d5dde3", 8)
    text(parts, 1050, 158, "How to read this", "label", C["navy"], weight="700")
    text(parts, 1050, 190, "Teal = household baseline", "small")
    text(parts, 1050, 212, "Gold = likely outdoor lift", "small")
    save_svg(out_dir / "02_driver_stack.svg", parts)


def render_bars(out_dir, rows):
    seasons = ["Winter", "Spring", "Summer", "Fall"]
    cols = [C["blue"], C["teal"], C["gold"], C["coral"]]
    values = []
    for season in seasons:
        vals = [r["gpd"] for r in rows if r["season"] == season]
        values.append(sum(vals) / len(vals) if vals else 0)
    parts = svg_start(1150, 760)
    text(parts, 60, 60, "Is this seasonal or irrigation-related?", "title")
    text(parts, 60, 90, "Summer and fall often reveal outdoor watering behavior.", "sub")
    x0, y0, w, h = 110, 150, 900, 470
    ymax = max(220, math.ceil(max(values) / 50) * 50)
    grid(parts, x0, y0, w, h, ymax)
    bar_w = 120
    gap = (w - len(seasons) * bar_w) / (len(seasons) + 1)
    for i, (label, value, color) in enumerate(zip(seasons, values, cols)):
        x = x0 + gap + i * (bar_w + gap)
        y = y0 + h - (value / ymax) * h
        rect(parts, x, y, bar_w, (value / ymax) * h, color, rx=6)
        text(parts, x + bar_w / 2, y - 14, f"{value:.0f} GPD", "label", anchor="middle", weight="700")
        text(parts, x + bar_w / 2, y0 + h + 32, label, "label", anchor="middle")
    save_svg(out_dir / "03_seasonality.svg", parts)


def render_years(out_dir, rows):
    by_year = {}
    for r in rows:
        by_year.setdefault(r["year"], []).append(r)
    years = sorted(by_year)
    gallons = [sum(r["gallons"] for r in by_year[y]) for y in years]
    parts = svg_start(1150, 760)
    text(parts, 60, 60, "Did this year change?", "title")
    text(parts, 60, 90, "Annual totals show whether a shift is isolated or persistent.", "sub")
    x0, y0, w, h = 110, 150, 900, 470
    ymax = max(gallons) * 1.18
    grid(parts, x0, y0, w, h, ymax)
    bar_w = min(100, (w / max(1, len(years))) * 0.55)
    gap = (w - len(years) * bar_w) / (len(years) + 1)
    top_year = years[gallons.index(max(gallons))]
    for i, year in enumerate(years):
        value = gallons[i]
        x = x0 + gap + i * (bar_w + gap)
        y = y0 + h - (value / ymax) * h
        color = C["coral"] if year == top_year else C["teal"]
        rect(parts, x, y, bar_w, (value / ymax) * h, color, rx=6)
        text(parts, x + bar_w / 2, y - 30, f"{value/1000:.0f}k gal", "small", anchor="middle", weight="700")
        text(parts, x + bar_w / 2, y - 12, f"{sum(r['ccf'] for r in by_year[year]):.0f} CCF", "small", anchor="middle")
        text(parts, x + bar_w / 2, y0 + h + 32, str(year), "label", anchor="middle")
    save_svg(out_dir / "04_year_over_year.svg", parts)


def public_text(value, fallback="Not included in public report"):
    text_value = "" if value is None else str(value).strip()
    return fallback if not text_value else text_value


def render_context(out_dir, household, irrigation, redacted=False):
    parts = svg_start(1150, 760)
    text(parts, 60, 60, "What should you check first?", "title")
    text(parts, 60, 90, "Use lived context so normal household changes do not get overdiagnosed.", "sub")
    if redacted:
        household = "Household details are intentionally generalized in this public-safe report."
        irrigation = "Yard and irrigation context is summarized without address-level detail."
    blocks = [
        ("Household baseline", household or "Ask about occupancy, family size, toilets, laundry, showers, and daytime use.", C["teal"]),
        ("Irrigation / yard", irrigation or "Ask about watering schedules, plant stress, system age, leaks, and yard projects.", C["coral"]),
        ("Best first checks", "Toilet dye tests, meter test with irrigation off, controller audit, irrigation walk-through.", C["gold"]),
    ]
    for i, (title, body, color) in enumerate(blocks):
        y = 160 + i * 170
        rect(parts, 80, y, 990, 120, C["light"], "#d5dde3", 10)
        circle(parts, 128, y + 60, 22, color, sw=0)
        text(parts, 170, y + 45, title, "label", C["navy"], weight="700")
        for j, chunk in enumerate(wrap(body, 95)):
            text(parts, 170, y + 75 + j * 20, chunk, "small")
    save_svg(out_dir / "05_context.svg", parts)


def wrap(text_value, length):
    words = str(text_value).split()
    lines, current = [], []
    for word in words:
        if sum(len(w) + 1 for w in current) + len(word) > length and current:
            lines.append(" ".join(current))
            current = [word]
        else:
            current.append(word)
    if current:
        lines.append(" ".join(current))
    return lines


def write_index(out_dir, rows, invalid, baseline, args):
    total_ccf = sum(r["ccf"] for r in rows)
    total_gal = total_ccf * GAL_PER_CCF
    avg_gpd = sum(r["gpd"] for r in rows) / len(rows)
    report_mode = "Public anonymized summary" if getattr(args, "public_mode", False) else ("Public-safe redacted report" if args.redact else "Private local report")
    sections = [
        ("Your water-use timeline", "01_timeline.svg", "Use gallons per day to see real changes independent of billing-period length."),
        ("Indoor baseline vs outdoor lift", "02_driver_stack.svg", "Estimate everyday household use versus seasonal yard or irrigation lift."),
        ("Is this seasonal?", "03_seasonality.svg", "Summer and fall often reveal irrigation behavior."),
        ("Did this year change?", "04_year_over_year.svg", "Spot persistent shifts rather than one-off bills."),
        ("What should you check first?", "05_context.svg", "Blend the data with household size, daytime use, toilets, laundry, showers, plants, and irrigation reality."),
    ]
    title = ("Mud Buddy Public Water Use Summary" if getattr(args, "public_mode", False) else (args.title or "EBMUD Water Usage Report"))
    address = "Location and account identifiers removed for public sharing" if getattr(args, "public_mode", False) else ("EBMUD service-area home" if args.redact else (args.address or "Home water account"))
    source_label = "Public aggregated source; original filename removed" if getattr(args, "public_mode", False) else ("Redacted local CSV" if args.redact else args.csv.name)
    privacy_note = (
        "Public/anonymized summary generated locally. Dates and visible usage values are bucketed; identifiers, raw CSV rows, and detailed context are removed."
        if getattr(args, "public_mode", False)
        else ("Public-safe summary generated locally from user-provided EBMUD-style usage data; identifiers removed. Use --public for broader sharing." if args.redact else "Private local report generated from a user-provided CSV. Review before sharing.")
    )
    html_text = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{esc(title)}</title>
  <style>
    :root {{ --ink:#263238; --muted:#66747d; --paper:#f5f7f8; --line:#d9e0e5; --navy:#18324a; --teal:#39b9c6; --gold:#f2b31b; }}
    * {{ box-sizing: border-box; }}
    body {{ margin:0; background:var(--paper); color:var(--ink); font-family:Arial,Helvetica,sans-serif; line-height:1.45; }}
    header {{ background:#fff; border-bottom:1px solid var(--line); padding:34px 24px 28px; position:sticky; top:0; z-index:2; }}
    .wrap, section, footer {{ max-width:1180px; margin:0 auto; }}
    h1 {{ margin:0 0 8px; font-size:clamp(30px,4vw,48px); line-height:1.05; }}
    .dek {{ color:var(--muted); font-size:18px; max-width:850px; margin:0; }}
    .mode {{ display:inline-flex; align-items:center; gap:8px; margin:0 0 14px; color:var(--navy); font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; }}
    .mode::before {{ content:""; width:10px; height:10px; border-radius:999px; background:var(--gold); }}
    .stats {{ display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin-top:22px; }}
    .stat {{ border:1px solid var(--line); border-radius:8px; padding:14px; background:#fff; }}
    .stat strong {{ display:block; font-size:23px; color:var(--navy); }}
    .stat span {{ display:block; color:var(--muted); font-size:13px; margin-top:3px; }}
    main {{ padding:28px 24px 70px; }}
    section {{ background:#fff; border:1px solid var(--line); border-radius:8px; margin-bottom:28px; overflow:hidden; }}
    .head {{ padding:24px 28px 10px; border-bottom:1px solid var(--line); }}
    h2 {{ margin:0; font-size:clamp(22px,2.5vw,30px); }}
    p {{ color:var(--muted); }}
    .copy {{ padding:0 28px; max-width:900px; }}
    figure {{ margin:0; padding:18px; }}
    img {{ display:block; width:100%; height:auto; border:1px solid var(--line); border-radius:6px; background:#fff; }}
    footer {{ color:var(--muted); font-size:13px; padding:0 24px 48px; }}
    @media (max-width:760px) {{ header {{ position:static; }} .stats {{ grid-template-columns:repeat(2,minmax(0,1fr)); }} }}
  </style>
</head>
<body>
  <header><div class="wrap">
    <div class="mode">{esc(report_mode)}</div>
    <h1>{esc(title)}</h1>
    <p class="dek">{esc(address)}. Plain-English read of household baseline, irrigation lift, benchmarks, unusual periods, and next checks.</p>
    <div class="stats">
      <div class="stat"><strong>{("~" if getattr(args, "public_mode", False) else "")}{total_ccf:.0f} CCF</strong><span>{"Bucketed total" if getattr(args, "public_mode", False) else "Total valid history"}</span></div>
      <div class="stat"><strong>{("~" if getattr(args, "public_mode", False) else "")}{total_gal/1000:.0f}k gal</strong><span>Approximate gallons</span></div>
      <div class="stat"><strong>{len(rows)}</strong><span>Valid billing periods</span></div>
      <div class="stat"><strong>{("~" if getattr(args, "public_mode", False) else "")}{baseline:.0f} GPD</strong><span>{"Baseline bucket" if getattr(args, "public_mode", False) else "Baseline estimate"}</span></div>
    </div>
  </div></header>
  <main>
"""
    for heading, image, copy in sections:
        html_text += f"""    <section>
      <div class="head"><h2>{esc(heading)}</h2></div>
      <p class="copy">{esc(copy)}</p>
      <figure><img src="{esc(image)}" alt="{esc(heading)}" /></figure>
    </section>
"""
    html_text += f"""  </main>
  <footer>{esc(privacy_note)} Source: {esc(source_label)}. Excluded invalid rows: {len(invalid)}. Baseline split is explanatory, not a formal water audit. Not affiliated with EBMUD.</footer>
</body>
</html>
"""
    (out_dir / "index.html").write_text(html_text, encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Generate an EBMUD Buddy report.")
    parser.add_argument("csv", type=Path, help="EBMUD billing usage CSV export")
    parser.add_argument("--out", type=Path, default=Path("ebmud_buddy_report"), help="Output directory")
    parser.add_argument("--title", default="EBMUD Water Usage Report")
    parser.add_argument("--address", default="")
    parser.add_argument("--household", default="", help="Known household context")
    parser.add_argument("--irrigation", default="", help="Known irrigation/yard context")
    parser.add_argument("--redact", action="store_true", help="Remove direct identifiers; not full anonymization")
    parser.add_argument("--public", dest="public_mode", action="store_true", help="Generate a public/anonymized summary with bucketed dates and usage values")
    parser.add_argument("--summary-json", action="store_true", help="Print machine-readable summary")
    args = parser.parse_args()

    args.csv = args.csv.expanduser().resolve()
    args.out = args.out.expanduser().resolve()
    os.makedirs(args.out, exist_ok=True)
    if args.public_mode:
        args.redact = True
    raw, rows, invalid = parse_rows(args.csv)
    baseline = estimate_baseline(rows)
    if args.public_mode:
        baseline = bucket_public_value(baseline, 25)
        rows = publicize_rows(rows)
    for r in rows:
        r["base_est"] = min(r["gpd"], baseline)
        r["outdoor_lift"] = max(0, r["gpd"] - baseline)

    render_timeline(args.out, rows, baseline, "Public Water Use Timeline" if args.public_mode else "Water Use Timeline", args.public_mode)
    render_stack(args.out, rows, baseline)
    render_bars(args.out, rows)
    render_years(args.out, rows)
    render_context(args.out, args.household, args.irrigation, args.redact)
    write_index(args.out, rows, invalid, baseline, args)

    summary = {
        "output": str(args.out.resolve()),
        "index": str((args.out / "index.html").resolve()),
        "valid_rows": len(rows),
        "invalid_rows": len(invalid),
        "total_ccf": round(sum(r["ccf"] for r in rows), 2),
        "total_gallons": round(sum(r["gallons"] for r in rows)),
        "avg_gpd": round(sum(r["gpd"] for r in rows) / len(rows), 1),
        "baseline_gpd": baseline,
    }
    if args.summary_json:
        print(json.dumps(summary, indent=2))
    else:
        print(f"Report written: {summary['index']}")
        print(f"Valid rows: {summary['valid_rows']} | Invalid rows: {summary['invalid_rows']}")
        print(f"Total: {summary['total_ccf']} CCF / {summary['total_gallons']} gallons | Baseline: {baseline} GPD")


if __name__ == "__main__":
    main()

