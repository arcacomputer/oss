import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = new URL('..', import.meta.url).pathname;
const read = (path) => readFileSync(join(root, path), 'utf8');

test('uses Astro static output and Cloudflare Workers Static Assets', () => {
  const pkg = JSON.parse(read('package.json'));
  const astro = read('astro.config.mjs');
  const wrangler = JSON.parse(read('wrangler.json'));
  assert.ok(pkg.dependencies.astro);
  assert.ok(pkg.dependencies['@astrojs/react']);
  assert.equal(pkg.dependencies.next, undefined);
  assert.match(astro, /output:\s*['"]static['"]/);
  assert.equal(wrangler.main, 'src/worker.mjs');
  assert.equal(wrangler.workers_dev, false);
  assert.equal(wrangler.preview_urls, false);
  assert.equal(wrangler.assets.directory, './dist');
  assert.equal(wrangler.assets.run_worker_first, true);
});

test('renders the showcase and public archive as static pages', () => {
  assert.ok(existsSync(join(root, 'src/pages/index.astro')));
  assert.ok(existsSync(join(root, 'src/pages/records.astro')));
  assert.ok(read('lib/site.ts').includes('Arca Computer, Inc.'));
  const css = read('src/styles/global.css');
  assert.match(css, /--sans:\s*"DM Sans",\s*Arial,\s*Helvetica,\s*sans-serif/);
  assert.match(css, /src:\s*url\("\/fonts\/dm-sans-latin\.woff2"\)/);
  for (const asset of ['activity.json', 'oss.json', 'llms.txt', 'robots.txt', 'sitemap.xml', 'og.png']) {
    assert.ok(existsSync(join(root, 'public', asset)), `${asset} must remain public`);
  }
});

test('uses committed evidence snapshots instead of framework ISR', () => {
  assert.ok(existsSync(join(root, 'public/openclaw-prs.json')));
  const data = read('lib/data.ts');
  assert.match(data, /openclaw-prs\.json/);
  assert.doesNotMatch(data, /fetch\(|revalidate/);
  const activityWorkflow = read('.github/workflows/refresh-public-activity.yml');
  assert.match(activityWorkflow, /cron:\s*["']17 \*\/6 \* \* \*["']/);
  assert.match(activityWorkflow, /public\/activity\.json/);
  const ledgerWorkflow = read('.github/workflows/refresh-openclaw-ledger.yml');
  assert.match(ledgerWorkflow, /cron:\s*["']37 \* \* \* \*["']/);
  assert.match(ledgerWorkflow, /refresh:ledger/);
  assert.match(ledgerWorkflow, /public\/openclaw-prs\.json/);
});

test('prevents Cloudflare beacon injection without weakening CSP', async () => {
  const { default: worker } = await import('../src/worker.mjs');
  const env = { ASSETS: { fetch: async () => new Response('<!doctype html>', { status: 200, headers: { 'Content-Type': 'text/html', 'Cache-Control': 'public, max-age=0, must-revalidate' } }) } };
  const response = await worker.fetch(new Request('https://oss.arcabot.ai/'), env);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control') || '', /no-transform/);
});

test('keeps accessible mobile navigation and expandable public records', () => {
  const records = read('src/react-pages/Records.tsx');
  const chrome = read('src/components/SiteChrome.tsx');
  const css = read('src/styles/global.css');
  assert.match(chrome, /<details className="mobile-section-nav"/);
  assert.match(records, /ledger\.pullRequests\.slice\(\s*0,\s*LEDGER_INITIAL_LIMIT\s*,?\s*\)/);
  assert.match(records, /<details className="ledger-more"/);
  assert.match(chrome, /className="section-return"/);
  assert.match(records, /id="past-work"/);
  assert.match(records, /id="current-work"/);
  const navigationHeight = css.match(/\.mobile-section-nav\s*(?:>\s*)?summary[^}]*min-height:\s*(\d+)px/s)?.[1];
  const ledgerHeight = css.match(/\.ledger-more\s*>\s*summary[^}]*min-height:\s*(\d+)px/s)?.[1];
  assert.ok(Number(navigationHeight) >= 44, 'mobile navigation retains its minimum touch target');
  assert.ok(Number(ledgerHeight) >= 66, 'ledger disclosure retains its larger touch target');
});

test('deploys exact main commits to Cloudflare without resyncing domains', () => {
  const workflow = read('.github/workflows/deploy-cloudflare.yml');
  assert.match(workflow, /wrangler versions upload/);
  assert.match(workflow, /--tag "\$GITHUB_SHA"/);
  assert.match(workflow, /wrangler versions deploy/);
  assert.match(workflow, /--version-tag "\$GITHUB_SHA"/);
  assert.match(workflow, /CLOUDFLARE_API_TOKEN/);
  assert.match(workflow, /CLOUDFLARE_ACCOUNT_ID/);
});

test('scheduled receipt refreshes dispatch a production deploy when data changes', () => {
  for (const path of [
    '.github/workflows/refresh-public-activity.yml',
    '.github/workflows/refresh-openclaw-ledger.yml',
  ]) {
    const workflow = read(path);
    assert.match(workflow, /actions:\s*write/);
    assert.match(workflow, /changed=true/);
    assert.match(workflow, /gh workflow run deploy-cloudflare\.yml --ref main/);
  }
});

test('serves the public records page with its query parameters on Cloudflare', async () => {
  const { default: worker } = await import('../src/worker.mjs');
  const seen = [];
  const env = { ASSETS: { fetch(request) {
    seen.push(new URL(request.url));
    return new Response('records', { headers: { 'Content-Type': 'text/html' } });
  } } };
  const redirect = await worker.fetch(new Request('https://oss.arcabot.ai/records?ce-role=author'), env);
  assert.equal(redirect.status, 308);
  assert.equal(redirect.headers.get('location'), 'https://oss.arcabot.ai/records/?ce-role=author');
  const response = await worker.fetch(new Request(redirect.headers.get('location')), env);
  assert.equal(await response.text(), 'records');
  assert.equal(seen[0].pathname, '/records/index.html');
  assert.equal(seen[0].search, '?ce-role=author');
  assert.match(response.headers.get('cache-control'), /no-transform/);
});
