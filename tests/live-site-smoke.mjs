import { waitFor, withBrowserPage, captureConsoleErrors } from './support/browser-harness.mjs';

const url = process.env.MUD_BUDDY_URL || 'https://danieloleary.github.io/mud-buddy/';

await waitFor(url, 120);

await withBrowserPage(url, { viewport: { width: 1280, height: 900 } }, async (page) => {
  const errors = captureConsoleErrors(page);
  await page.goto(url);
  await page.getByText('Upload your EBMUD usage data. Get beautiful analysis, recommendations, and more.').waitFor({ timeout: 10000 });
  await page.getByText('Try sample data').first().click();
  await page.getByRole('heading', { name: 'Report ready.' }).waitFor({ timeout: 10000 });
  for (const rel of [
    'sample-report/index.html',
    'docs/privacy.md',
    'assets/github-social-card.png',
    'assets/hero-civic-water.webp',
    'mud-buddy-by-danno.zip'
  ]) {
    const response = await fetch(new URL(rel, url));
    if (!response.ok) throw new Error(`Live site missing ${rel}: ${response.status}`);
  }
  if (errors.length) throw new Error('Live site console errors: ' + errors.join('\n'));
});

console.log(`live-site-smoke: OK ${url} landing, sample flow, docs, assets, and ZIP loaded`);
