import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

function luminance(hex) {
  const channels = hex.match(/[\da-f]{2}/gi).map(value => parseInt(value, 16) / 255);
  const linear = channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

test('small public-record label clears WCAG AA against its section background', async () => {
  const css = await readFile(new URL('../src/styles/global.css', import.meta.url), 'utf8');
  const resolveHex = (value) => {
    if (!value) return undefined;
    if (/^#[\da-f]{6}$/i.test(value)) return value;
    const token = value.match(/^var\((--[a-z-]+)\)$/i)?.[1];
    return token ? css.match(new RegExp(`${token}:\\s*(#[\\da-f]{6})`, 'i'))?.[1] : undefined;
  };
  const foreground = resolveHex(
    css.match(/\.records-heading \.eyebrow\s*\{[^}]*color:\s*([^;]+)/i)?.[1]?.trim()
    || css.match(/\.eyebrow\s*\{[^}]*color:\s*([^;]+)/i)?.[1]?.trim(),
  );
  const background = resolveHex(css.match(/\.records-section\s*\{[^}]*background:\s*([^;]+)/i)?.[1]?.trim());
  assert.ok(foreground && background, 'record label and background resolve to explicit color tokens');
  const values = [luminance(foreground), luminance(background)].sort((a, b) => a - b);
  const ratio = (values[1] + 0.05) / (values[0] + 0.05);
  assert.ok(ratio >= 4.5, `small record-label contrast ${ratio.toFixed(2)} must be at least 4.5:1`);
});
