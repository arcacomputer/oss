import assert from 'node:assert/strict';
import { applyContributionOutcomes, collectCredits, collectManualIntegrations } from './update-public-activity.mjs';

/** Reuse refresh verification so CI and scheduled refresh have the same acceptance boundary. */
export async function validateContributionClaims(index, feed, options = {}) {
  const verified = [
    ...await collectCredits(index, options),
    ...await collectManualIntegrations(index, options),
  ];
  const types = new Set(['upstream_credit', 'upstream_manual_integration']);
  const retained = feed.events.filter(event => types.has(event.type));
  assert.equal(retained.length, verified.length, 'Contribution receipt count differs from verified curated evidence');
  assert.equal(new Set(retained.map(event => event.id)).size, retained.length, 'Duplicate contribution receipts');
  for (const expected of verified) {
    assert.deepEqual(retained.find(event => event.id === expected.id), expected, `${expected.url}: public receipt differs from verified evidence`);
    const original = feed.events.find(event => event.type === 'upstream_pr_state' && event.url === expected.evidence.originPullRequest && event.state === 'closed');
    assert.ok(original && !original.evidence?.mergeCommit, `${expected.url}: original PR must retain a closed-unmerged receipt`);
    assert.ok(!feed.events.some(event => event.type === 'upstream_pr_state' && event.url === expected.evidence.originPullRequest && event.state === 'merged'), `${expected.url}: original PR cannot be relabelled merged`);
  }
  const rebuilt = applyContributionOutcomes([...feed.events.filter(event => !types.has(event.type)), ...verified]);
  for (const event of feed.events) {
    const expected = rebuilt.find(item => item.id === event.id);
    assert.deepEqual(event.contributionOutcome, expected?.contributionOutcome, `${event.url}: unsupported contribution outcome`);
  }
  return {
    creditedMerges: verified.filter(event => event.type === 'upstream_credit').length,
    manualIntegrations: verified.filter(event => event.type === 'upstream_manual_integration').length,
    incorporatedOrigins: rebuilt.filter(event => event.contributionOutcome).length,
  };
}
