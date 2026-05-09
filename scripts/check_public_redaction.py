from __future__ import annotations

import argparse
import re
import tempfile
from pathlib import Path
from zipfile import ZipFile, BadZipFile

TEXT_SUFFIXES = {
    ".html", ".css", ".js", ".mjs", ".py", ".md", ".json", ".yml", ".yaml",
    ".txt", ".csv", ".svg", ".xml", ".toml", ".cff"
}
SESSION_TERM_ALLOWED = {
    "README.md", "AGENTS.md", "SECURITY.md", "security-review.md", "browser-control-safety.md",
    "use-with-ai-tools.md", "privacy.md", "public-sharing-checklist.md", "installation.md",
    "acceptance-criteria.md", "plan-and-status.md", "launch-plan.md", "release-checklist.md",
    "roadmap.md", "backlog.md", "CLAUDE.md", "SKILL.md", "main.js", "SUPPORT.md",
    "social-card.svg", "browser_workflow.md", "check_public_redaction.py", "privacy_safety.yml",
    "ebmud_workflow_docs.yml", "bug_report.yml", "feature_request.yml", "pull_request_template.md"
}
ALLOWED_SVG_ASSETS = {
    "assets/hero-civic-water.svg",
    "assets/workflow-csv-report.svg",
    "assets/privacy-local-first.svg",
    "assets/ebmud-resource-directory.svg",
    "assets/readme-banner.svg",
    "assets/social-card.svg",
    "assets/github-social-card.svg",
    "assets/report-preview-redacted.svg",
    "assets/csv-export-boundary.svg",
    "assets/public-sharing-checklist-card.svg",
    "assets/sample-report-montage.svg",
    "assets/irrigation-season-story.svg",
    "assets/leak-check-next-steps.svg",
    "assets/ai-agent-safe-handoff.svg",
    "assets/hero-civic-water.webp",
    "assets/github-social-card.png",
    "assets/report-preview-redacted.webp",
    "assets/sample-report-montage.webp",
    "assets/irrigation-season-story.webp",
    "assets/leak-check-next-steps.webp",
    "assets/privacy-local-first.webp",
    "assets/ebmud-resource-directory.webp",
    "assets/favicon-32.png",
    "assets/apple-touch-icon.png",
    "public/assets/hero-civic-water.svg",
    "public/assets/workflow-csv-report.svg",
    "public/assets/privacy-local-first.svg",
    "public/assets/ebmud-resource-directory.svg",
    "public/assets/readme-banner.svg",
    "public/assets/social-card.svg",
    "public/assets/github-social-card.svg",
    "public/assets/report-preview-redacted.svg",
    "public/assets/csv-export-boundary.svg",
    "public/assets/public-sharing-checklist-card.svg",
    "public/assets/sample-report-montage.svg",
    "public/assets/irrigation-season-story.svg",
    "public/assets/leak-check-next-steps.svg",
    "public/assets/ai-agent-safe-handoff.svg",
    "public/assets/hero-civic-water.webp",
    "public/assets/github-social-card.png",
    "public/assets/report-preview-redacted.webp",
    "public/assets/sample-report-montage.webp",
    "public/assets/irrigation-season-story.webp",
    "public/assets/leak-check-next-steps.webp",
    "public/assets/privacy-local-first.webp",
    "public/assets/ebmud-resource-directory.webp",
    "public/assets/favicon-32.png",
    "public/assets/apple-touch-icon.png",
}
FORBIDDEN_LITERALS = []
PATTERNS = [
    ("windows_local_path", re.compile(r"[A-Za-z]:\\Users\\[^\s'\"<>]+", re.I)),
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
IMAGE_SUFFIXES = {".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp"}
CSV_HEADER_PATTERNS = [
    re.compile(r"Reading Date,Days in Read Period", re.I),
    re.compile(r"Customer GPD", re.I),
    re.compile(r"Average Households GPD", re.I),
    re.compile(r"Top 20% GPD", re.I),
    re.compile(r"Account Number,Reading Date", re.I),
]


def is_text(path: Path) -> bool:
    return path.suffix.lower() in TEXT_SUFFIXES


def should_allow_session_terms(path: Path) -> bool:
    names = {part for part in path.parts}
    return bool(names & SESSION_TERM_ALLOWED) or path.name.startswith("index-")


def is_allowed_image(rel: str) -> bool:
    if rel in ALLOWED_SVG_ASSETS:
        return True
    if re.match(r"(?:sample-report/)?0[1-5]_[a-z_]+\.svg$", rel):
        return True
    return False


def scan_file(path: Path, root: Path, failures: list[str]) -> None:
    rel = path.relative_to(root).as_posix()
    lower = path.name.lower()
    if path.suffix.lower() in IMAGE_SUFFIXES and not is_allowed_image(rel):
        failures.append(f"unapproved public image asset present: {rel}")
    if path.suffix.lower() in BROWSER_ARTIFACT_SUFFIXES and lower != "mud-buddy-by-danno.zip":
        failures.append(f"browser/test artifact present: {rel}")
    if path.suffix.lower() == ".csv" and rel != "examples/sample-ebmud-usage.csv":
        failures.append(f"non-sample CSV present: {rel}")
    if lower.startswith("billing usage"):
        failures.append(f"real-looking billing export filename present: {rel}")
    parts = rel.split("/")
    forbidden_dirs = {".herenow", "node_modules", "dist", "generated", "test-results", "playwright-report"}
    has_tests_output = any(parts[i] == "tests" and i + 1 < len(parts) and parts[i + 1] == "output" for i in range(len(parts)))
    if any(part in forbidden_dirs for part in parts) or has_tests_output:
        failures.append(f"generated/private directory artifact present: {rel}")
    if not is_text(path):
        return
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except OSError as exc:
        failures.append(f"could not read {rel}: {exc}")
        return
    if path.suffix.lower() != ".csv" and "examples/sample-ebmud-usage.csv" not in rel:
        csv_hits = sum(1 for pattern in CSV_HEADER_PATTERNS if pattern.search(text))
        data_row_hits = len(re.findall(r"(?m)^\s*(?:PUBLIC-[A-Z-]+|\d{6,}|[^,\n]{1,40}),\d{4}-\d{2}-\d{2},\d{1,3},[^\n]*,", text))
        if csv_hits >= 2 and data_row_hits >= 2:
            failures.append(f"raw EBMUD-like CSV content embedded in public text artifact: {rel}")
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
