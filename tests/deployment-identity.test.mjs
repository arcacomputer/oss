import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('production deploy is pinned to the company account and verifies identity before upload', async () => {
  const workflow = await readFile(new URL('../.github/workflows/deploy-cloudflare.yml', import.meta.url), 'utf8');
  assert.match(workflow, /CLOUDFLARE_ACCOUNT_ID:\s*e320a5a80611f9a30148d452929b1fb1/);
  const identity = workflow.indexOf('Verify production account');
  const upload = workflow.indexOf('Upload exact Worker version');
  assert.ok(identity >= 0 && identity < upload, 'authenticate the exact account before any upload');
  assert.match(workflow, /api\.cloudflare\.com\/client\/v4\/accounts\//);
  assert.match(workflow, /result\.id/);
});
