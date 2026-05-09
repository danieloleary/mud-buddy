from __future__ import annotations

import argparse
import csv
import hashlib
import random
from copy import deepcopy
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT = ROOT / "tests" / "output" / "synthetic-flavors"
SEED = 51794549
ACCOUNT = "PUBLIC-SYNTHETIC"
METER = "SYNTH-METER"

FLAVORS = [
    "normal-baseline",
    "large-family-growth",
    "irrigation-summer-heavy",
    "irrigation-fall-heavy",
    "new-landscaping-ramp",
    "dying-plants-water-more",
    "possible-toilet-leak",
    "continuous-baseline-creep",
    "winter-spike",
    "usage-drop-conservation",
    "erratic-controller",
    "high-peer-comparison",
    "top-20-close",
    "low-efficient",
    "missing-gpd-row",
    "na-gpd-row",
    "short-read-period",
    "long-read-period",
    "partial-year",
    "flatline-meter-check",
]

EXPECTED_INVALID = {
    "missing-gpd-row": 1,
    "na-gpd-row": 1,
}


def find_default_source() -> Path:
    downloads = Path.home() / "Downloads"
    candidates = sorted(downloads.glob("Billing Usage*.csv"), key=lambda p: p.stat().st_mtime if p.exists() else 0, reverse=True)
    if candidates:
        return candidates[0]
    return ROOT / "examples" / "sample-ebmud-usage.csv"


def read_rows(path: Path):
    with path.open(newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
        fields = f.seek(0) or list(csv.DictReader(path.open(newline="", encoding="utf-8-sig")).fieldnames or [])
    with path.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        return list(reader), list(reader.fieldnames or [])


def parse_int(value, default=0):
    try:
        return int(float(str(value).replace(',', '').strip()))
    except Exception:
        return default


def parse_float(value, default=0.0):
    try:
        return float(str(value).replace(',', '').strip())
    except Exception:
        return default


def date_value(row):
    return datetime.strptime(row["Reading Date"], "%Y-%m-%d")


def season_factor(date: datetime, flavor: str) -> float:
    month = date.month
    summer = month in {6, 7, 8, 9}
    fall = month in {9, 10, 11}
    winter = month in {12, 1, 2}
    if flavor == "irrigation-summer-heavy" and summer:
        return 1.65
    if flavor == "irrigation-fall-heavy" and fall:
        return 1.55
    if flavor == "new-landscaping-ramp" and date >= datetime(2025, 3, 1):
        return 1.15 + min(0.45, ((date - datetime(2025, 3, 1)).days / 365) * 0.45)
    if flavor == "dying-plants-water-more" and date >= datetime(2025, 5, 1):
        return 1.4 if summer or fall else 1.18
    if flavor == "winter-spike" and winter and date.year >= 2025:
        return 1.55
    return 1.0


def flavor_gpd(base: int, date: datetime, idx: int, total: int, flavor: str, rng: random.Random) -> int | None | str:
    noise = rng.uniform(-0.045, 0.045)
    value = max(35, base * (1 + noise) * season_factor(date, flavor))
    progress = idx / max(1, total - 1)

    if flavor == "large-family-growth":
        value *= 1.0 + 0.42 * progress
    elif flavor == "possible-toilet-leak":
        value += 45 if date >= datetime(2025, 1, 1) else 10
    elif flavor == "continuous-baseline-creep":
        value += 8 + 58 * progress
    elif flavor == "usage-drop-conservation":
        value *= 1.16 - 0.42 * progress
    elif flavor == "erratic-controller":
        value *= [0.82, 1.34, 0.95, 1.65, 0.76][idx % 5]
    elif flavor == "high-peer-comparison":
        value *= 1.3
    elif flavor == "top-20-close":
        value *= 0.72
    elif flavor == "low-efficient":
        value *= 0.58
    elif flavor == "flatline-meter-check":
        value = 168 + rng.uniform(-2, 2)

    if flavor == "missing-gpd-row" and idx == total // 2:
        return None
    if flavor == "na-gpd-row" and idx == total // 2:
        return "N/A"
    return int(round(value))


def mutate_rows(source_rows, fields, flavor: str):
    rng = random.Random(SEED + int(hashlib.sha256(flavor.encode()).hexdigest()[:8], 16))
    rows = sorted(deepcopy(source_rows), key=date_value)

    if flavor == "partial-year":
        rows = rows[-6:]
    total = len(rows)
    out = []
    start_date = datetime(2021, 1, 5)

    for idx, row in enumerate(rows):
        original_date = date_value(row)
        synthetic_date = start_date + timedelta(days=round(idx * 58 + rng.uniform(-5, 5)))
        if flavor == "partial-year":
            synthetic_date = datetime(2026, 1, 5) + timedelta(days=round(idx * 31))

        base_gpd = parse_int(row.get("Customer GPD"), 155)
        gpd = flavor_gpd(base_gpd, synthetic_date, idx, total, flavor, rng)

        days = parse_int(row.get("Days in Read Period"), 58) or 58
        if flavor == "short-read-period" and idx % 4 == 1:
            days = 27
        elif flavor == "long-read-period" and idx % 4 == 2:
            days = 74
        else:
            days = max(25, min(75, int(round(days + rng.uniform(-3, 3)))))

        if isinstance(gpd, int):
            ccf = max(1, int(round(gpd * days / 748)))
            avg = max(50, int(round(gpd * (1.04 + rng.uniform(-0.16, 0.18)))))
            top = max(35, int(round(gpd * (0.61 + rng.uniform(-0.08, 0.08)))))
        else:
            ccf = row.get("CCF") or ""
            avg = parse_int(row.get("Average Households GPD"), 190)
            top = parse_int(row.get("Top 20% GPD"), 115)

        if flavor == "high-peer-comparison" and isinstance(gpd, int):
            avg = max(40, int(round(gpd * 0.78)))
            top = max(30, int(round(gpd * 0.52)))
        if flavor == "top-20-close" and isinstance(gpd, int):
            avg = int(round(gpd * 1.2))
            top = int(round(gpd * 0.95))
        if flavor == "low-efficient" and isinstance(gpd, int):
            avg = int(round(gpd * 1.75))
            top = int(round(gpd * 1.18))

        new = {field: "" for field in fields}
        new.update(row)
        new["Account Number"] = ACCOUNT
        new["Reading Date"] = synthetic_date.strftime("%Y-%m-%d")
        new["Days in Read Period"] = str(days)
        new["Meter Reading"] = ""
        new["CCF"] = "" if gpd is None else str(ccf)
        new["Customer GPD"] = "" if gpd is None else str(gpd)
        new["Average Households GPD"] = str(avg)
        new["Top 20% GPD"] = str(top)
        new["WaterScore"] = "efficient" if isinstance(gpd, int) and gpd <= top else ("average" if isinstance(gpd, int) and gpd <= avg else "high")
        new["Meter Class"] = "SFR"
        new["Meter"] = METER
        out.append(new)

    return out


def write_csv(path: Path, fields, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def validate_no_private(path: Path, private_terms: list[str]):
    text = path.read_text(encoding="utf-8")
    lowered = text.lower()
    for term in private_terms:
        if term and term.lower() in lowered:
            raise SystemExit(f"private source term leaked into {path}: {term}")


def main():
    parser = argparse.ArgumentParser(description="Generate ignored synthetic EBMUD CSV flavor fixtures.")
    parser.add_argument("--source", type=Path, default=None)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()

    source = args.source or find_default_source()
    if not source.exists():
        raise SystemExit(f"source CSV not found: {source}")

    source_rows, fields = read_rows(source)
    required = {"Account Number", "Reading Date", "Days in Read Period", "CCF", "Customer GPD", "Average Households GPD", "Top 20% GPD", "WaterScore"}
    missing = sorted(required - set(fields))
    if missing:
        raise SystemExit(f"source CSV missing expected columns: {', '.join(missing)}")

    source_accounts = sorted({str(r.get("Account Number", "")).strip() for r in source_rows if str(r.get("Account Number", "")).strip()})
    private_terms = [str(source), source.name, *source_accounts]
    manifest = []
    args.out.mkdir(parents=True, exist_ok=True)
    for flavor in FLAVORS:
        rows = mutate_rows(source_rows, fields, flavor)
        path = args.out / f"{flavor}.csv"
        write_csv(path, fields, rows)
        validate_no_private(path, private_terms)
        manifest.append({"flavor": flavor, "file": path.name, "rows": len(rows), "expectedInvalid": EXPECTED_INVALID.get(flavor, 0)})

    manifest_path = args.out / "manifest.json"
    import json
    manifest_path.write_text(json.dumps({"seed": SEED, "count": len(manifest), "flavors": manifest}, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {len(manifest)} synthetic flavors in {args.out}")


if __name__ == "__main__":
    main()
