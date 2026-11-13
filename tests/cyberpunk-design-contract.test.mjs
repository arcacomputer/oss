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

test('source-index opening is structural, preserving the static evidence path', () => {
  const home = read('src/react-pages/Home.tsx');
  assert.match(home, /className="hero-line-signal hero-line"/);
  assert.match(home, /<span className="hero-line">Built here\.<\/span>/);
  assert.doesNotMatch(home, /<em>|button-lime|var\(--lime\)/);
  for (const id of ['content', 'projects', 'contributions', 'current-work', 'past-work', 'records', 'activity', 'ledger', 'about']) {
    assert.ok(home.includes(`id="${id}"`), `Missing original destination #${id}`);
  }
  assert.match(home, /href="#records" data-section-link="records"/);
  assert.match(read('src/scripts/interactions.ts'), /const sections = \["projects", "contributions", "records"\]/);
  assert.match(home, /<details className="history-records">/);
  assert.match(home, /<ReceiptEvidence event=\{event\} \/>/);
  assert.match(home, /\{explorer\}/);
  assert.match(home, /<noscript>/);
});

test('social assets and browser chrome share the source-index identity', () => {
  const og = read('public/og.svg');
  const icon = read('public/icon.svg');
  const layout = read('src/layouts/BaseLayout.astro');
  assert.ok(og.includes('width="1200" height="630"'), 'OG uses the real social-card canvas');
  for (const svg of [og, icon]) {
    assert.ok(svg.includes(token('bg')), 'Asset shares the document background');
    assert.ok(svg.includes(token('signal')), 'Asset shares the signal color');
    assert.ok(!/Georgia|#173b2f|#f6f5ef|#d5f478|<animate|<script|https?:\/\/(?!www\.w3\.org)/i.test(svg), 'No legacy palette, external dependencies or motion');
  }
  assert.ok(og.includes('Built here.') && og.includes('upstream.'), 'OG matches the visible hero');
  assert.ok(!/\b\d+ (projects|PRs|merges|contributions)\b/.test(og), 'No frozen mutable counts');
  assert.ok(layout.includes('name="theme-color" content="#080c14"'), 'Browser chrome is dark');
  assert.ok(layout.includes('name="color-scheme" content="dark"'), 'Native document controls are dark');
});
