import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const css = read('src/styles/global.css');
const explorer = read('src/styles/contribution-explorer.css');
const token = name => {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'));
  assert.ok(match, `Missing literal color token --${name}`);
  return match[1];
};
const luminance = hex => {
  const rgb = hex.slice(1).match(/../g).map(channel => {
    const n = parseInt(channel, 16) / 255;
    return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
};
const contrast = (a, b) => {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
};

test('dark signal palette keeps small text WCAG AA on every panel', () => {
  assert.equal(token('bg'), '#080c14');
  assert.equal(token('signal'), '#57e6ff');
  for (const foreground of ['text', 'muted', 'signal', 'violet', 'success', 'warning', 'closed']) {
    for (const surface of ['bg', 'surface', 'raised']) {
      const ratio = contrast(token(foreground), token(surface));
      assert.ok(ratio >= 4.5, `${foreground}/${surface}: ${ratio.toFixed(2)} < 4.5`);
    }
  }
  assert.ok(contrast(token('bg'), token('signal')) >= 4.5);
  assert.match(css, /color-scheme:\s*dark/);
  assert.doesNotMatch(css + explorer, /#(?:f6f6f0|f6f5ef|173b2f|d5f478)\b|Georgia|Times New Roman|--(?:paper|forest|sage)\b/i);
});

test('selected work and the full archive retain distinct static destinations', () => {
  const home = read('src/react-pages/Home.tsx');
  const archive = read('src/react-pages/Records.tsx');
  const chrome = read('src/components/SiteChrome.tsx');
  for (const id of ['content', 'projects', 'contributions', 'current-work', 'past-work', 'records', 'activity', 'ledger', 'about']) {
    assert.ok((home + chrome).includes(`id="${id}"`), `Missing original destination #${id}`);
  }
  assert.ok(home.includes('selectedContributions') && home.includes('selectedSoftware'));
  assert.match(chrome, /href="\/records\/"/);
  assert.match(archive, /<details className="history-records">/);
  assert.match(archive, /<ReceiptEvidence event=\{event\} \/>/);
  assert.match(archive, /\{explorer\}/);
  assert.match(archive, /<noscript>/);
});

test('the site identifies the company by name in the masthead and social artwork', () => {
  const og = read('public/og.svg');
  const layout = read('src/layouts/BaseLayout.astro');
  const chrome = read('src/components/SiteChrome.tsx');
  assert.ok(og.includes('width="1200" height="630"'));
  assert.ok(og.includes(token('bg')) && og.includes(token('signal')));
  assert.ok(og.includes('Arca Computer, Inc.') && og.includes('Open-source contributions'));
  assert.doesNotMatch(og, /<path|<image|<animate|<script/);
  assert.doesNotMatch(chrome, /<svg|<img|<Mark/);
  assert.ok(layout.includes('href="data:,"'));
  assert.ok(!/\b\d+ (projects|PRs|merges|contributions)\b/.test(og));
  assert.ok(layout.includes('name="theme-color" content="#080c14"'));
  assert.ok(layout.includes('name="color-scheme" content="dark"'));
});
