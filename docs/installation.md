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

It is OK to provide the downloaded EBMUD CSV to this local command or to a local coding agent helping in this repo. Do not provide credentials, MFA codes, cookies, localStorage, sessionStorage, auth headers, or session tokens.

```bash
python scripts/generate_report.py "path/to/your-ebmud-export.csv" --out "my-water-report"
```

Open `my-water-report/index.html` locally.

## Generate A Public-Safe Report

```bash
python scripts/generate_report.py "path/to/your-ebmud-export.csv" --out "my-public-report" --public
npm run test:redaction
```

Run a redaction scan before sharing anything publicly. `--redact` removes direct identifiers, but `--public` is the sharing-safe mode because it also buckets visible dates and usage values.
