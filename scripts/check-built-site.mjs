import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const dist = new URL('../dist/', import.meta.url);
const built = path => readFileSync(new URL(path, dist), 'utf8');
const home = built('index.html');
const records = built('records/index.html');

for (const page of [home, records]) {
  assert.ok(page.includes('Arca Computer, Inc.'));
  assert.ok(page.includes('href="https://github.com/arcacomputer/oss"'));
  assert.ok(!page.includes('href="/icon.svg"'));
}
const sections = ['contributions', 'current-work', 'past-work', 'projects', 'records'];
const positions = sections.map(id => home.indexOf(`id="${id}"`));
assert.ok(positions.every((offset, index) => offset >= 0 && (!index || offset > positions[index - 1])),
  'Selected contributions appear before company software and the public record');
assert.ok(!home.includes('data-explorer-record'), 'The complete archive lives on its own page');
assert.ok(!home.includes('astro-island'), 'The editorial homepage works without hydration');
const profileChoices = home.match(/<input[^>]*name="ssh-example"[^>]*>/g) ?? [];
for (const value of ['same', 'mapped']) {
  assert.ok(profileChoices.some(input => input.includes(`value="${value}"`)), `Missing profile comparison choice ${value}`);
}
for (const asset of ['santiago-720.webp', 'santiago-1440.webp', 'fonts/instrument-serif-italic-latin.woff2']) {
  assert.ok(existsSync(new URL(asset, dist)), `Missing showcase asset ${asset}`);
}
for (const asset of ['santiago-720.webp', 'santiago-1440.webp']) assert.ok(home.includes(`/${asset}`));
for (const marker of ['Public records', 'data-explorer-record', 'data-project-category', 'id="ledger"', 'id="activity"', 'id="repository-inventory"']) {
  assert.ok(records.includes(marker), `Missing public archive marker ${marker}`);
}
for (const asset of ['activity.json', 'github-repositories.json', 'openclaw-prs.json', 'oss.json', 'llms.txt', 'robots.txt', 'sitemap.xml', 'og.png', '404.html', '_headers']) {
  assert.ok(existsSync(new URL(asset, dist)), `${asset} must be built`);
}
assert.ok(built('robots.txt').includes('Sitemap: https://oss.arcabot.ai/sitemap.xml'));
for (const url of ['https://oss.arcabot.ai', 'https://oss.arcabot.ai/records/']) {
  assert.ok(built('sitemap.xml').includes(`<loc>${url}</loc>`));
}
console.log('Verified the contribution showcase, full archive, published assets, sitemap, and 404.');
