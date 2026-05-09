from __future__ import annotations

import json

KNOWN_PUBLIC_ASSETS = {
    "hero-civic-water.svg",
    "workflow-csv-report.svg",
    "privacy-local-first.svg",
    "ebmud-resource-directory.svg",
    "readme-banner.svg",
    "social-card.svg",
    "github-social-card.svg",
    "report-preview-redacted.svg",
    "csv-export-boundary.svg",
    "public-sharing-checklist-card.svg",
    "sample-report-montage.svg",
    "irrigation-season-story.svg",
    "leak-check-next-steps.svg",
    "ai-agent-safe-handoff.svg",
    "hero-civic-water.webp",
    "github-social-card.png",
    "report-preview-redacted.webp",
    "sample-report-montage.webp",
    "irrigation-season-story.webp",
    "leak-check-next-steps.webp",
    "privacy-local-first.webp",
    "ebmud-resource-directory.webp",
    "mud-buddy-kawaii-mascot.webp",
    "favicon-32.png",
    "apple-touch-icon.png",
}

DENY_NAMES = {
    "node_modules",
    "dist",
    "generated",
    "public-site",
    ".herenow",
    ".git",
    "test-results",
    "playwright-report",
    "__pycache__",
}

PACKAGE_DENY_SUFFIXES = {".zip", ".har", ".trace", ".webm", ".png", ".jpg", ".jpeg", ".gif", ".webp"}
BROWSER_ARTIFACT_SUFFIXES = {".har", ".trace", ".webm", ".zip"}
IMAGE_SUFFIXES = {".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp"}
ALLOWED_CSV_PATHS = {"examples/sample-ebmud-usage.csv"}


def policy_json() -> str:
    return json.dumps(
        {
            "knownPublicAssets": sorted(KNOWN_PUBLIC_ASSETS),
            "denyNames": sorted(DENY_NAMES),
            "packageDenySuffixes": sorted(PACKAGE_DENY_SUFFIXES),
            "browserArtifactSuffixes": sorted(BROWSER_ARTIFACT_SUFFIXES),
            "imageSuffixes": sorted(IMAGE_SUFFIXES),
            "allowedCsvPaths": sorted(ALLOWED_CSV_PATHS),
        },
        indent=2,
    )


if __name__ == "__main__":
    print(policy_json())
