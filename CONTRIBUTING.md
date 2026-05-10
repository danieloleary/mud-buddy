# Contributing

Thanks for helping make Mud Buddy clearer, safer, and more useful for EBMUD customers.

## Development Setup

```bash
npm ci
npx playwright install chromium
npm run generate:sample
npm run dev
```

## Before Opening A PR

```bash
npm run build
npm run package:public
npm run test:landing
npm run test:report
npm run test:browser-flow
npm run test:redaction
```

## Data Safety

Use only synthetic or fully redacted examples. Don't commit real EBMUD exports, addresses, account numbers, meter IDs, authenticated screenshots, browser traces, `.env` files, `.herenow` state, or generated private reports.

## Claim Style

Mud Buddy can flag possible leak clues and patterns worth checking. Don't describe it as an official EBMUD tool, certified water audit, billing authority, or diagnostic leak detector.
