#!/usr/bin/env python3
"""Generate a scrollable EBMUD water usage report from an EBMUD usage file export.

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
import re
from datetime import datetime
from pathlib import Path

GAL_PER_CCF = 748
DECIMAL_RE = re.compile(r"^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$")

C = {
    "teal": "#004B73",
    "blue": "#2D333B",
    "navy": "#121417",
    "gold": "#D89A00",
    "coral": "#006DAA",
    "green": "#1A8F7A",
    "gray": "#5D6978",
    "light": "#FAF9F5",
    "line": "#E7EBEF",
    "ink": "#121417",
    "paper": "#F8F7F3",
    "terracotta_dark": "#004B73",
}


def num(value):
    text = "" if value is None else str(value).strip()
    if not text or text.upper() in {"N/A", "NA"}:
        return None
    if not DECIMAL_RE.match(text):
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
        if days <= 0 or ccf < 0 or gpd < 0:
            invalid.append(r)
            continue
        if avg is not None and avg < 0:
            avg = None
        if top is not None and top < 0:
            top = None
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
    if not any(r["ccf"] > 0 or r["gpd"] > 0 for r in rows):
        raise SystemExit("No positive water usage values found.")
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
        '<rect width="100%" height="100%" fill="#FAF9F5"/>',
        "<style>text{font-family:Inter,ui-sans-serif,system-ui,sans-serif;fill:#121417}.title{font-size:30px;font-weight:760}.sub{font-size:17px;fill:#5D6978}.small{font-size:13px;fill:#5D6978}.label{font-size:15px}.bold{font-weight:720}.grid{stroke:#E7EBEF;stroke-width:1}.axis{stroke:#D8DFE5;stroke-width:1}.note{font-size:14px;fill:#5D6978}</style>",
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


def average(values):
    clean = [v for v in values if v is not None]
    return sum(clean) / len(clean) if clean else None


def fmt_gallons(value):
    if value is None:
        return "n/a"
    if abs(value) >= 1000:
        return f"{value / 1000:.0f}k gal"
    return f"{value:.0f} gal"


def report_story(rows, invalid, baseline):
    peak = max(rows, key=lambda r: r["gpd"])
    avg_gpd = average([r["gpd"] for r in rows]) or 0
    warm = average([r["gpd"] for r in rows if r["season"] in {"Summer", "Fall"}])
    cool = average([r["gpd"] for r in rows if r["season"] in {"Winter", "Spring"}])
    outdoor_lift = max(0, (warm or avg_gpd) - (cool or baseline))
    peak_excess_gallons = max(0, peak["gpd"] - baseline) * peak["days"]
    outdoor_opportunity = sum(max(0, r["gpd"] - baseline) * r["days"] for r in rows)
    peer_avg = average([r.get("avg") for r in rows if r.get("avg") is not None])
    peer_delta = (avg_gpd - peer_avg) if peer_avg is not None else None
    baseline_drift = 0
    if len(rows) >= 6:
        first = average([r["gpd"] for r in rows[: max(3, len(rows) // 3)]]) or avg_gpd
        last = average([r["gpd"] for r in rows[-max(3, len(rows) // 3) :]]) or avg_gpd
        baseline_drift = last - first

    if outdoor_lift >= 45 or peak_excess_gallons >= 3000:
        start_title = "Check irrigation first."
        start_body = (
            f"The peak period sits about {peak['gpd'] - baseline:.0f} GPD above the normal-use estimate. "
            "That is the yard waving a little orange flag, not a guaranteed leak."
        )
        confidence = "Higher"
    elif baseline_drift >= 25:
        start_title = "Check the everyday baseline."
        start_body = (
            "The pattern looks less like one dramatic spike and more like normal daily use creeping up. "
            "That is where toilets, fixtures, schedule changes, and household routines hide."
        )
        confidence = "Medium"
    else:
        start_title = "Start with the boring wins."
        start_body = (
            "No single monster jumps out. That is good news. Do the cheap checks first: toilet dye test, "
            "meter-stillness test, and a quick irrigation controller review."
        )
        confidence = "Medium"

    checks = [
        "Run a toilet dye test. It costs almost nothing and catches sneaky flappers.",
        "Turn irrigation off and watch the meter. If it still moves, something is asking for water.",
        "Walk the irrigation zones. Look for misting, runoff, broken heads, soggy spots, and plants getting drama-queen dry.",
        "Compare the peak period with real-life changes: new landscaping, guests, kids, laundry, showers, or controller changes.",
        "Use EBMUD directly for billing, outage, pressure, water-quality, rebate, assistance, or emergency questions.",
    ]
    opportunities = [
        {
            "label": "Outdoor watering opportunity",
            "value": fmt_gallons(outdoor_opportunity),
            "copy": "If the outdoor lift is real waste, this is the big bucket to investigate.",
        },
        {
            "label": "Peak-period reality check",
            "value": fmt_gallons(peak_excess_gallons),
            "copy": "One high billing period can be normal yard rescue or an irrigation system doing improv comedy.",
        },
        {
            "label": "Normal daily use",
            "value": f"{baseline:.0f} GPD",
            "copy": "This is the everyday-use estimate. If it rises, hunt fixtures before blaming the lawn.",
        },
    ]
    evidence = [
        ("Peak period", f"{peak['date'].strftime('%b %Y')} at {peak['gpd']:.0f} GPD"),
        ("Normal-use estimate", f"{baseline:.0f} GPD"),
        ("Outdoor signal", f"{outdoor_lift:.0f} GPD warm-season lift" if outdoor_lift else "No strong seasonal lift"),
        ("Data quality", f"{len(rows)} usable periods, {len(invalid)} skipped"),
    ]
    if peer_delta is not None:
        evidence.append(("Export benchmark", f"{abs(peer_delta):.0f} GPD {'above' if peer_delta >= 0 else 'below'} average-household benchmark"))
    return {
        "start_title": start_title,
        "start_body": start_body,
        "confidence": confidence,
        "checks": checks,
        "opportunities": opportunities,
        "evidence": evidence,
    }


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
    story = report_story(rows, invalid, baseline)
    if getattr(args, "public_mode", False):
        max_gpd = max(r["gpd"] for r in rows)
        story["evidence"] = [
            ("Highest-use bucket", f"Warmer-season bucket near {max_gpd:.0f} GPD"),
            *[(label, value) for label, value in story["evidence"] if label != "Peak period"],
        ]
    report_mode = "Public anonymized summary" if getattr(args, "public_mode", False) else ("Public-safe redacted report" if args.redact else "Private local report")
    sections = [
        ("Water use over time", "01_timeline.svg", "Gallons per day keeps long and short billing periods from fooling your eyes."),
        ("Normal use vs outdoor lift", "02_driver_stack.svg", "Separate everyday household use from seasonal yard or irrigation lift."),
        ("Seasonal pattern", "03_seasonality.svg", "Summer and fall often reveal outdoor watering behavior."),
        ("Year-by-year view", "04_year_over_year.svg", "Spot persistent shifts instead of panicking over one odd bill."),
        ("Context checklist", "05_context.svg", "Blend the numbers with household changes, plants, toilets, fixtures, and irrigation reality."),
    ]
    title = ("Mud Buddy sample water report" if getattr(args, "public_mode", False) else (args.title or "Mud Buddy water report"))
    address = "Location and account identifiers removed for public sharing" if getattr(args, "public_mode", False) else ("EBMUD service-area home" if args.redact else (args.address or "Home water account"))
    source_label = "Public aggregated source; original filename removed" if getattr(args, "public_mode", False) else ("Redacted local CSV" if args.redact else args.csv.name)
    privacy_note = (
        "Public/anonymized summary generated locally. Dates and visible usage values are bucketed; identifiers, raw usage-file rows, and detailed context are removed."
        if getattr(args, "public_mode", False)
        else ("Public-safe summary generated locally from user-provided EBMUD-style usage data; identifiers removed. Use --public for broader sharing." if args.redact else "Private local report generated from a user-provided CSV. Review before sharing.")
    )
    evidence_html = "\n".join(
        f"""          <article class="mini-card"><span>{esc(label)}</span><strong>{esc(value)}</strong></article>"""
        for label, value in story["evidence"]
    )
    opportunities_html = "\n".join(
        f"""          <article class="opportunity-card"><span>{esc(item["label"])}</span><strong>{esc(item["value"])}</strong><p>{esc(item["copy"])}</p></article>"""
        for item in story["opportunities"]
    )
    checks_html = "\n".join(f"<li>{esc(item)}</li>" for item in story["checks"])
    html_text = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{esc(title)}</title>
  <style>
    :root {{
      --ink:#121417;
      --muted:#5D6978;
      --paper:#F8F7F3;
      --parchment:#F5F4ED;
      --porcelain:#FFFFFF;
      --line:#E7EBEF;
      --reservoir:#004B73;
      --terracotta:#006DAA;
      --terracotta-dark:#004B73;
      --mint:#1A8F7A;
      --amber:#D89A00;
      --radius:12px;
      --radius-sm:6px;
      --space-sm:8px;
      --space-md:12px;
      --space-lg:16px;
      --space-xl:24px;
      --space-xxl:32px;
    }}
    * {{ box-sizing: border-box; }}
    html {{ scroll-behavior:smooth; }}
    body {{ margin:0; background:var(--parchment); color:var(--ink); font-family:Inter,ui-sans-serif,system-ui,sans-serif; line-height:1.5; }}
    a {{ color:inherit; }}
    .topbar {{ position:sticky; top:0; z-index:4; display:flex; align-items:center; justify-content:space-between; gap:16px; padding:12px max(18px,calc((100vw - 1120px)/2)); border-bottom:1px solid var(--line); background:rgba(250,249,245,.94); backdrop-filter:blur(10px); }}
    .brand {{ display:flex; align-items:center; gap:10px; color:var(--ink); text-decoration:none; font-weight:820; }}
    .mark {{ width:40px; height:40px; display:grid; place-items:center; border-radius:12px; color:white; background:var(--terracotta); }}
    .mark::before {{ content:""; width:14px; height:20px; border-radius:60% 60% 60% 60%; background:white; transform:rotate(45deg); }}
    .topbar small {{ display:block; color:var(--muted); font-size:12px; font-weight:750; }}
    .topbar a.button {{ display:inline-flex; align-items:center; min-height:40px; padding:0 18px; border-radius:999px; background:var(--terracotta); color:white; font-size:14px; font-weight:780; text-decoration:none; }}
    .shell {{ width:min(100% - 32px,1120px); margin:0 auto; }}
    .hero {{ display:grid; grid-template-columns:minmax(0,1fr) minmax(270px,380px); gap:24px; align-items:start; padding-block:42px 28px; }}
    .hero-copy {{ padding-top:10px; }}
    .mode {{ display:inline-flex; align-items:center; gap:8px; min-height:32px; padding:0 12px; border:1px solid color-mix(in srgb,var(--reservoir) 28%,var(--line)); border-radius:999px; color:var(--reservoir); background:var(--porcelain); font-size:12px; font-weight:820; letter-spacing:.04em; text-transform:uppercase; }}
    .mode::before {{ content:""; width:9px; height:9px; border-radius:999px; background:var(--mint); }}
    h1 {{ max-width:720px; margin:16px 0 12px; font-size:clamp(38px,5.4vw,68px); line-height:.98; letter-spacing:-.055em; }}
    h2 {{ margin:0; font-size:clamp(24px,3vw,34px); line-height:1.08; letter-spacing:-.035em; }}
    h3 {{ margin:0 0 8px; font-size:20px; line-height:1.18; letter-spacing:-.02em; }}
    p {{ color:var(--muted); }}
    .dek {{ max-width:740px; margin:0; color:var(--muted); font-size:clamp(17px,1.6vw,20px); }}
    .hero-card, .material-card, section {{ border:1px solid var(--line); border-radius:var(--radius); background:var(--porcelain); }}
    .hero-card {{ padding:18px; }}
    .hero-card strong {{ display:block; color:var(--reservoir); font-size:15px; }}
    .hero-card p {{ margin:10px 0 0; font-size:14px; }}
    .stats {{ display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin-block:22px 0; }}
    .stat {{ border:1px solid var(--line); border-radius:var(--radius); padding:16px; background:var(--porcelain); }}
    .stat strong {{ display:block; color:var(--reservoir); font-size:clamp(24px,3vw,34px); line-height:1; letter-spacing:-.03em; }}
    .stat span {{ display:block; margin-top:8px; color:var(--muted); font-size:13px; font-weight:730; }}
    main {{ padding-block:0 72px; }}
    .start-card {{ display:grid; grid-template-columns:52px 1fr minmax(160px,220px); gap:16px; align-items:start; margin-block:22px; padding:22px; border:2px solid color-mix(in srgb,var(--terracotta) 64%,var(--line)); border-radius:16px; background:color-mix(in srgb,var(--porcelain) 88%,#F7D8CA); }}
    .start-icon {{ width:52px; height:52px; display:grid; place-items:center; border-radius:12px; background:var(--terracotta); }}
    .start-icon::before {{ content:""; width:24px; height:24px; border:3px solid white; border-radius:999px; }}
    .overline {{ margin:0 0 8px; color:var(--reservoir); font-size:12px; font-weight:850; letter-spacing:.1em; text-transform:uppercase; }}
    .start-card p {{ margin:0; color:var(--muted); font-size:16px; }}
    .confidence {{ padding:14px; border:1px solid var(--line); border-radius:12px; background:var(--porcelain); }}
    .confidence span {{ display:block; color:var(--muted); font-size:12px; font-weight:760; }}
    .confidence strong {{ display:block; color:var(--terracotta-dark); font-size:26px; }}
    .grid {{ display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-block:18px; }}
    .material-card {{ padding:20px; }}
    .mini-grid, .opportunity-grid {{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }}
    .opportunity-grid {{ grid-template-columns:repeat(3,minmax(0,1fr)); }}
    .mini-card, .opportunity-card {{ border:1px solid var(--line); border-radius:var(--radius); padding:14px; background:var(--paper); }}
    .mini-card span, .opportunity-card span {{ display:block; margin-bottom:6px; color:var(--reservoir); font-size:12px; font-weight:850; letter-spacing:.04em; text-transform:uppercase; }}
    .mini-card strong {{ color:var(--ink); font-size:15px; }}
    .opportunity-card strong {{ display:block; color:var(--terracotta-dark); font-size:clamp(25px,3vw,36px); line-height:1; }}
    .opportunity-card p {{ margin:10px 0 0; font-size:14px; }}
    .check-list {{ margin:10px 0 0; padding-left:22px; color:var(--muted); font-weight:700; }}
    .check-list li {{ margin:8px 0; }}
    .check-list li::marker {{ color:var(--terracotta); font-weight:900; }}
    section {{ margin-bottom:22px; overflow:hidden; }}
    .head {{ display:flex; align-items:flex-start; justify-content:space-between; gap:16px; padding:22px 24px; border-bottom:1px solid var(--line); }}
    .head p {{ max-width:760px; margin:8px 0 0; }}
    figure {{ margin:0; padding:16px; }}
    img {{ display:block; width:100%; height:auto; border:1px solid var(--line); border-radius:var(--radius-sm); background:var(--porcelain); }}
    .official {{ margin-top:22px; padding:20px; }}
    .official-links {{ display:flex; flex-wrap:wrap; gap:10px; margin-top:12px; }}
    .official-links a {{ display:inline-flex; align-items:center; min-height:36px; padding:0 12px; border:1px solid var(--line); border-radius:999px; color:var(--reservoir); background:var(--porcelain); font-size:14px; font-weight:760; text-decoration:none; }}
    footer {{ max-width:1120px; margin:0 auto; padding:0 16px 48px; color:var(--muted); font-size:13px; }}
    @media (max-width:880px) {{ .hero, .grid, .start-card {{ grid-template-columns:1fr; }} .stats, .opportunity-grid, .mini-grid {{ grid-template-columns:1fr 1fr; }} }}
    @media (max-width:620px) {{ .topbar a.button {{ display:none; }} .shell {{ width:min(100% - 28px,1120px); }} .stats, .opportunity-grid, .mini-grid {{ grid-template-columns:1fr; }} h1 {{ font-size:clamp(36px,10vw,48px); }} .head {{ display:block; }} }}
    @media print {{ .topbar {{ position:static; }} body {{ background:white; }} .hero-card, .material-card, section {{ break-inside:avoid; }} }}
  </style>
</head>
<body>
  <nav class="topbar" aria-label="Report navigation">
    <a class="brand" href="../" aria-label="Mud Buddy home"><span class="mark" aria-hidden="true"></span><span>Mud Buddy<small>sample report</small></span></a>
    <a class="button" href="../">Analyze your own usage</a>
  </nav>
  <header class="shell hero">
    <div class="hero-copy">
      <div class="mode">{esc(report_mode)}</div>
      <h1>{esc(title)}</h1>
      <p class="dek">{esc(address)}. A homeowner-friendly read of normal daily use, outdoor watering clues, benchmark context, weird periods, and what to check next.</p>
      <div class="stats" aria-label="Report summary statistics">
        <div class="stat"><strong>{("~" if getattr(args, "public_mode", False) else "")}{total_ccf:.0f}</strong><span>CCF in report window</span></div>
        <div class="stat"><strong>{("~" if getattr(args, "public_mode", False) else "")}{total_gal/1000:.0f}k</strong><span>Approximate gallons</span></div>
        <div class="stat"><strong>{len(rows)}</strong><span>Usable periods</span></div>
        <div class="stat"><strong>{("~" if getattr(args, "public_mode", False) else "")}{baseline:.0f}</strong><span>{"Baseline bucket" if getattr(args, "public_mode", False) else "GPD normal-use estimate"}</span></div>
      </div>
    </div>
    <aside class="hero-card">
      <strong>GPD means gallons per day.</strong>
      <p>That matters because billing periods are not always the same length. GPD is the “same-size ruler” for spotting what actually changed.</p>
    </aside>
  </header>
  <main>
    <div class="shell">
      <section class="start-card" aria-label="Start here">
        <span class="start-icon" aria-hidden="true"></span>
        <div>
          <p class="overline">Start here</p>
          <h2>{esc(story["start_title"])}</h2>
          <p>{esc(story["start_body"])} This is the backyard-science moment: do the cheap experiment, learn something, save the water heroics for the actual culprit.</p>
        </div>
        <div class="confidence"><span>Confidence</span><strong>{esc(story["confidence"])}</strong><span>Pattern clue, not official finding</span></div>
      </section>
      <div class="grid">
        <article class="material-card">
          <p class="overline">What Mud Buddy sees</p>
          <h2>Evidence before advice.</h2>
          <div class="mini-grid">{evidence_html}
          </div>
        </article>
        <article class="material-card">
          <p class="overline">Recommended next checks</p>
          <h2>Do the cheap experiments first.</h2>
          <ol class="check-list">{checks_html}</ol>
        </article>
      </div>
      <article class="material-card">
        <p class="overline">Money + water lab</p>
        <h2>Where savings may be hiding</h2>
        <div class="opportunity-grid">{opportunities_html}
        </div>
      </article>
    </div>
"""
    for heading, image, copy in sections:
        html_text += f"""    <section class="shell chart-section">
      <div class="head"><div><p class="overline">Chart</p><h2>{esc(heading)}</h2><p>{esc(copy)}</p></div></div>
      <figure><img src="{esc(image)}" alt="{esc(heading)}" /></figure>
    </section>
"""
    html_text += f"""    <article class="shell material-card official">
      <p class="overline">Official EBMUD resources</p>
      <h2>Use EBMUD directly when the next step is official.</h2>
      <p>Mud Buddy explains patterns in a usage file. EBMUD handles account, billing, emergency, rebate, conservation, outage, pressure, assistance, and water-quality actions.</p>
      <div class="official-links">
        <a href="https://www.ebmud.com/customers/billing-questions">Billing questions</a>
        <a href="https://www.ebmud.com/customers/billing-questions/leaks-and-high-bills">Leaks and high bills</a>
        <a href="https://www.ebmud.com/water/conservation-and-rebates">Conservation and rebates</a>
        <a href="https://www.ebmud.com/customers/alerts">Alerts and outages</a>
        <a href="https://www.ebmud.com/water/about-your-water/water-quality">Water quality</a>
        <a href="https://www.ebmud.com/contact-us">Contact / emergency</a>
      </div>
    </article>
  </main>
  <footer>{esc(privacy_note)} Source: {esc(source_label)}. Excluded invalid rows: {len(invalid)}. Baseline split is explanatory, not a formal water audit, leak diagnosis, billing decision, plumbing inspection, or official EBMUD analysis. Not affiliated with EBMUD.</footer>
</body>
</html>
"""
    (out_dir / "index.html").write_text(html_text, encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Generate an EBMUD Buddy report.")
    parser.add_argument("csv", type=Path, help="EBMUD billing usage export")
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

