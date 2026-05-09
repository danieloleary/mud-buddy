from __future__ import annotations

import os
import stat
import shutil
import subprocess
import sys
from pathlib import Path
from public_release_policy import ALLOWED_CSV_PATHS, DENY_NAMES, IMAGE_SUFFIXES, KNOWN_PUBLIC_ASSETS, PACKAGE_DENY_SUFFIXES

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public-site"
STAGING = ROOT / "tests" / "output" / "public-package-staging"
ZIP_NAME = "mud-buddy-by-danno.zip"
ZIP_PATH = PUBLIC / ZIP_NAME

ROOT_FILES = [
    "README.md",
    "LICENSE",
    "SECURITY.md",
    "CONTRIBUTING.md",
    "CHANGELOG.md",
    "SUPPORT.md",
    "CODE_OF_CONDUCT.md",
    "CITATION.cff",
    "AGENTS.md",
    "CLAUDE.md",
    "DESIGN.md",
    "package.json",
    "package-lock.json",
    "index.html",
    "vite.config.js",
]
DIRS = [
    "src",
    "docs",
    "skills",
    "scripts",
    "public/assets",
    "tests/mock-ebmud-portal",
    ".github/workflows",
    ".github/ISSUE_TEMPLATE",
]
EXPLICIT_FILES = [
    "examples/sample-ebmud-usage.csv",
    ".github/dependabot.yml",
    ".github/pull_request_template.md",
]
def _force_remove(func, path, exc_info):
    try:
        os.chmod(path, stat.S_IWRITE)
        func(path)
    except Exception:
        raise


def clean(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path, onerror=_force_remove)
    path.mkdir(parents=True, exist_ok=True)


def is_known_public_asset(rel: Path) -> bool:
    return rel.parts == ("public", "assets", rel.name) and rel.name in KNOWN_PUBLIC_ASSETS


def allowed_file(path: Path) -> bool:
    rel = path.relative_to(ROOT)
    if any(part in DENY_NAMES for part in rel.parts):
        return False
    if path.suffix.lower() in IMAGE_SUFFIXES and not is_known_public_asset(rel):
        return False
    if path.suffix.lower() in PACKAGE_DENY_SUFFIXES and not is_known_public_asset(rel):
        return False
    if path.name.startswith(".") and path.name not in {"ci.yml", "pages.yml"}:
        return False
    if path.suffix.lower() == ".csv" and rel.as_posix() not in ALLOWED_CSV_PATHS:
        return False
    if path.name.lower().startswith("billing usage"):
        return False
    return True


def copy_file(src: Path, dst: Path) -> None:
    if not allowed_file(src):
        return
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)


def copy_dir(rel_dir: str) -> None:
    src_dir = ROOT / rel_dir
    if not src_dir.exists():
        return
    for src in src_dir.rglob("*"):
        if src.is_file() and allowed_file(src):
            copy_file(src, STAGING / src.relative_to(ROOT))


def copy_public_site() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    dist = ROOT / "dist"
    report = ROOT / "generated" / "sample-report"
    docs = ROOT / "docs"
    for rel in ["assets", "docs", "sample-report"]:
        target = PUBLIC / rel
        if target.exists():
            shutil.rmtree(target, onerror=_force_remove)
    if dist.exists():
        shutil.copytree(dist, PUBLIC, dirs_exist_ok=True)
    if report.exists():
        shutil.copytree(report, PUBLIC / "sample-report", dirs_exist_ok=True)
    if docs.exists():
        shutil.copytree(docs, PUBLIC / "docs", dirs_exist_ok=True, ignore=shutil.ignore_patterns("*.tmp", "*.bak"))


def build_zip() -> None:
    clean(STAGING)
    for rel in ROOT_FILES:
        src = ROOT / rel
        if src.exists():
            copy_file(src, STAGING / rel)
    for rel in EXPLICIT_FILES:
        src = ROOT / rel
        if src.exists():
            copy_file(src, STAGING / rel)
    for rel in DIRS:
        copy_dir(rel)

    if ZIP_PATH.exists():
        ZIP_PATH.unlink()
    py = sys.executable
    code = """
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
root = Path(r'''{staging}''')
zip_path = Path(r'''{zip_path}''')
with ZipFile(zip_path, 'w', ZIP_DEFLATED) as z:
    for path in sorted(root.rglob('*')):
        if path.is_file():
            z.write(path, path.relative_to(root).as_posix())
print(zip_path)
""".format(staging=str(STAGING), zip_path=str(ZIP_PATH))
    subprocess.run([py, "-c", code], check=True)


def main() -> None:
    copy_public_site()
    build_zip()
    print(f"Packaged public site: {PUBLIC}")
    print(f"Packaged launch ZIP: {ZIP_PATH}")


if __name__ == "__main__":
    main()
