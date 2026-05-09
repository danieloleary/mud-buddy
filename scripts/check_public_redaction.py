from __future__ import annotations

import argparse
import re
import tempfile
from pathlib import Path
from zipfile import ZipFile, BadZipFile

TEXT_SUFFIXES = {
    ".html", ".css", ".js", ".mjs", ".py", ".md", ".json", ".yml", ".yaml",
    ".txt", ".csv", ".svg", ".xml", ".toml"
}
SESSION_TERM_ALLOWED = {
    "README.md", "AGENTS.md", "SECURITY.md", "security-review.md", "browser-control-safety.md",
    "use-with-ai-tools.md", "privacy.md", "public-sharing-checklist.md", "installation.md",
    "acceptance-criteria.md", "CLAUDE.md", "SKILL.md", "main.js",
    "browser_workflow.md", "check_public_redaction.py"
}
FORBIDDEN_LITERALS = []
PATTERNS = [
    ("windows_local_path", re.compile(r"[A-Za-z]:\\\\Users\\\\[^\s'\"<>]+", re.I)),
    ("posix_local_path", re.compile(r"/(?:Users|home)/[^\s'\"<>]+", re.I)),
    ("email", re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.I)),
    ("phone", re.compile(r"\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b")),
    ("private_key", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")),
    ("github_token", re.compile(r"\b(?:ghp|github_pat|gho|ghs)_[A-Za-z0-9_]{20,}\b")),
    ("openai_key", re.compile(r"\bsk-[A-Za-z0-9_-]{20,}\b")),
    ("account_like_id", re.compile(r"\b\d{10,}\b")),
    ("street_address", re.compile(r"\b\d{2,6}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,5}\s+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Ct|Court|Blvd|Way|Place|Pl|Terrace|Ter)\b", re.I)),
]
SESSION_PATTERNS = [
    ("password", re.compile(r"\bpassword\b", re.I)),
    ("cookie", re.compile(r"\bcookie\b|\bcookies\b", re.I)),
    ("local_storage", re.compile(r"\blocalStorage\b", re.I)),
    ("session_storage", re.compile(r"\bsessionStorage\b", re.I)),
    ("auth_header", re.compile(r"Authorization:\s*Bearer", re.I)),
]
BROWSER_ARTIFACT_SUFFIXES = {".har", ".trace", ".webm", ".zip"}


def is_text(path: Path) -> bool:
    return path.suffix.lower() in TEXT_SUFFIXES


def should_allow_session_terms(path: Path) -> bool:
    names = {part for part in path.parts}
    return bool(names & SESSION_TERM_ALLOWED) or path.name.startswith("index-")


def scan_file(path: Path, root: Path, failures: list[str]) -> None:
    rel = path.relative_to(root).as_posix()
    lower = path.name.lower()
    if path.suffix.lower() in BROWSER_ARTIFACT_SUFFIXES and lower != "mud-buddy-by-danno.zip":
        failures.append(f"browser/test artifact present: {rel}")
    if path.suffix.lower() == ".csv" and rel != "examples/sample-ebmud-usage.csv":
        failures.append(f"non-sample CSV present: {rel}")
    if lower.startswith("billing usage"):
        failures.append(f"real-looking billing export filename present: {rel}")
    if any(part in {".herenow", "node_modules", "dist", "generated", "tests/output", "test-results", "playwright-report"} for part in path.parts):
        failures.append(f"generated/private directory artifact present: {rel}")
    if not is_text(path):
        return
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except OSError as exc:
        failures.append(f"could not read {rel}: {exc}")
        return
    hay = text.lower()
    for literal in FORBIDDEN_LITERALS:
        if literal.lower() in hay:
            failures.append(f"forbidden literal {literal!r} in {rel}")
    for name, pattern in PATTERNS:
        if pattern.search(text):
            failures.append(f"{name} pattern in {rel}")
    if not should_allow_session_terms(path):
        for name, pattern in SESSION_PATTERNS:
            if pattern.search(text):
                failures.append(f"session/credential term {name} outside safety docs in {rel}")


def scan_tree(root: Path, failures: list[str]) -> None:
    for path in root.rglob("*"):
        if path.is_file():
            scan_file(path, root, failures)


def scan_zip(zip_path: Path, failures: list[str]) -> None:
    try:
        with tempfile.TemporaryDirectory() as tmp:
            with ZipFile(zip_path) as z:
                names = z.namelist()
                bad = [n for n in names if n.startswith(("node_modules/", "dist/", "generated/", "public-site/", ".herenow/"))]
                for n in bad:
                    failures.append(f"forbidden ZIP member: {n}")
                z.extractall(tmp)
            scan_tree(Path(tmp), failures)
    except BadZipFile:
        failures.append(f"bad ZIP file: {zip_path}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Scan public Mud Buddy artifacts for private data and release-risk files.")
    parser.add_argument("--path", type=Path, default=Path("public-site"))
    parser.add_argument("--strict", action="store_true")
    parser.add_argument("--forbid", action="append", default=[])
    args = parser.parse_args()
    root = args.path.resolve()
    failures: list[str] = []
    FORBIDDEN_LITERALS.extend(args.forbid)
    if not root.exists():
        failures.append(f"path does not exist: {root}")
    else:
        scan_tree(root, failures)
        for zip_path in root.rglob("*.zip"):
            scan_zip(zip_path, failures)
    if failures:
        print("Public redaction scan failed:")
        for item in failures:
            print(f"- {item}")
        return 1
    print(f"Public redaction scan passed: {root}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
