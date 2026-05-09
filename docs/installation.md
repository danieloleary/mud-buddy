# Installation

Mud Buddy is a local-first project. The public repo is intended to be cloned and run on your own machine.

## Requirements

- Node.js 20 or newer.
- Python 3.10 or newer.
- Git.
- Playwright Chromium for browser smoke tests.

## Clone

```bash
git clone https://github.com/danieloleary/mud-buddy.git
cd mud-buddy
```

## Install

```bash
npm ci
npx playwright install chromium
```

## Run The Demo Site

```bash
npm run generate:sample
npm run dev
```

Open the Vite URL shown in your terminal.

## Generate A Private Local Report

```bash
python scripts/generate_report.py "path/to/your-ebmud-export.csv" --out "my-water-report"
```

Open `my-water-report/index.html` locally.

## Generate A Public-Safe Report

```bash
python scripts/generate_report.py "path/to/your-ebmud-export.csv" --out "my-public-report" --redact
```

Run a redaction scan before sharing anything publicly.
