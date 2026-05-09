#!/usr/bin/env python3
from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SAMPLE = ROOT / "examples" / "sample-ebmud-usage.csv"
OUT = Path(tempfile.gettempdir()) / "mud-buddy-debug-sample-report"

if OUT.exists():
    shutil.rmtree(OUT)

cmd = [sys.executable, str(ROOT / "scripts" / "generate_report.py"), str(SAMPLE), "--out", str(OUT), "--redact"]
result = subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True)
print(result.stdout.strip())
if result.returncode:
    print(result.stderr, file=sys.stderr)
    raise SystemExit(result.returncode)
index = OUT / "index.html"
if not index.exists():
    raise SystemExit(f"Expected report was not created: {index}")
text = index.read_text(encoding="utf-8", errors="ignore")
print(f"debug_report_generation: created {index}")
print(f"debug_report_generation: html bytes={len(text.encode('utf-8'))}")
print("debug_report_generation: OK")
