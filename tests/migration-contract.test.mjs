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

test('preserves the observed single-page rendering and public assets', () => {
  assert.ok(existsSync(join(root, 'src/pages/index.astro')));
  assert.match(read('src/layouts/BaseLayout.astro'), /Arca OSS — public software, upstream work, receipts/);
  const css = read('src/styles/global.css');
  assert.match(css, /font-family:\s*Arial,\s*Helvetica,\s*sans-serif/);
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

test('improves long-page mobile navigation without changing the visual system', () => {
  const home = read('src/react-pages/Home.tsx');
  const css = read('src/styles/global.css');
  assert.match(home, /<details className="mobile-section-nav"/);
  assert.match(home, /ledger\.pullRequests\.slice\(0, LEDGER_INITIAL_LIMIT\)/);
  assert.match(home, /<details className="ledger-more"/);
  assert.match(home, /className="section-return"/);
  assert.match(css, /\.mobile-section-nav summary[^}]*min-height:\s*44px/s);
  assert.match(css, /\.ledger-more summary[^}]*min-height:\s*44px/s);
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
