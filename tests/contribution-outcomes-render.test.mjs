import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const require = createRequire(import.meta.url);
const read = p => readFile(new URL(`../${p}`, import.meta.url), 'utf8');
const urls = new Map();
async function moduleFor(path) {
  if (urls.has(path)) return urls.get(path);
  let source = await read(path);
  if (path === 'lib/data.ts') {
    for (const [name, file] of Object.entries({ activityJson:'activity.json', openClawLedgerJson:'openclaw-prs.json', ossIndex:'oss.json', repositoryInventoryJson:'github-repositories.json' })) {
      source = source.replace(new RegExp(`^import ${name} .*;$`, 'm'), () => `const ${name} = ${awaitedJson[file]};`);
    }
  }
  for (const match of [...source.matchAll(/from "(@\/[^\"]+|\.\/presentation)"/g)]) {
    const dependency = match[1] === './presentation' ? 'lib/presentation.ts' : `${match[1].slice(2)}${match[1].includes('/Home') || match[1].includes('/GitHubTracking') ? '.tsx' : '.ts'}`;
    source = source.replaceAll(`from "${match[1]}"`, `from "${await moduleFor(dependency)}"`);
  }
  let output = ts.transpileModule(source, { compilerOptions: { module:ts.ModuleKind.ESNext, target:ts.ScriptTarget.ES2022, jsx:ts.JsxEmit.ReactJSX } }).outputText;
  output = output.replaceAll('"react/jsx-runtime"', JSON.stringify(`file://${require.resolve('react/jsx-runtime')}`));
  const url = `data:text/javascript;base64,${Buffer.from(output).toString('base64')}`;
  urls.set(path,url);
  return url;
}
const awaitedJson = {};
for (const name of ['activity.json','openclaw-prs.json','oss.json','github-repositories.json']) awaitedJson[name] = await read(`public/${name}`);
const { default: Home } = await import(await moduleFor('src/react-pages/Home.tsx'));
const html = renderToStaticMarkup(React.createElement(Home));
const rows = [...html.matchAll(/<li class="receipt">([\s\S]*?)<\/li>/g)].map(m=>m[1]);
const row = url => rows.find(r=>r.includes(`href="${url}"`));

test('visible origin rows show incorporation, linked replacement authors, landed authors and secondary closed status', () => {
  const origin = row('https://github.com/NousResearch/hermes-agent/pull/138681');
  assert.match(origin, /Incorporated via merged #139854/);
  assert.match(origin, /Original PR: closed without merge/);
  assert.match(origin, /href="https:\/\/github.com\/NousResearch\/hermes-agent\/pull\/139854"/);
  assert.match(origin, /teknium1/);
  assert.match(origin, /d589981249093ce1cd0e87e94b9aa98e593c54dd/);
  const partial = row('https://github.com/openclaw/clickclack/pull/78');
  assert.match(partial, /Partially incorporated via #91\/#92/);
  assert.match(partial, /Hermes-specific connector was declined/);
  const closed = row('https://github.com/NousResearch/hermes-agent/pull/140741');
  assert.match(closed, /status-closed/);
  assert.doesNotMatch(closed, /status-merged/);
});

test('manual integration appears as accepted past work without inflating PR merges or hiding original state', () => {
  const openssl = html.match(/<article class="history-project"[^>]*data-history-name="[^"]*openssl\/openssl[\s\S]*?<\/article>/)?.[0];
  assert.ok(openssl);
  assert.match(openssl, /data-history-kind="accepted/);
  assert.match(openssl, /Manually integrated upstream/);
  assert.match(openssl, /Luis Felipe Abarca/);
  for (const sha of ['4ddd1002cd41750ee644478a84306be2c59d775a','b9e34da583370a48cae42267e1191b961c095a5e']) assert.ok(openssl.includes(`/commit/${sha}`));
  assert.match(html, /1<small>manually integrated contribution/);
  assert.match(html, /8<small>additional credited merges/);
  assert.doesNotMatch(html, /Proposal without a merge/);
});
test('long outcome badges wrap without changing the existing status palette', async () => {
  const css = await read('src/styles/global.css');
  assert.match(css, /\.status-outcome\s*\{[^}]*white-space:\s*normal/s);
  assert.match(row('https://github.com/openclaw/clickclack/pull/78'), /status-merged status-outcome/);
});
