import assert from "node:assert/strict";
import test from "node:test";
import * as activity from "./update-public-activity.mjs";

const sha = "a".repeat(40);
const landed = "b".repeat(40);
const date = "2026-10-01T00:00:00Z";
const origin = "https://github.com/community/tool/pull/1";
const credit = {
  project: "Tool", url: "https://github.com/community/tool/pull/2",
  originPullRequest: origin, actor: "arcabotai", prAuthor: "maintainer",
  mergedAt: date, mergeCommit: sha, implementationCommit: landed,
  credit: "commit author", outcome: "incorporated",
  provenanceText: "Salvages #1 by @arcabotai with authorship preserved",
  landedCommits: [{ sha: landed, author: { name: "Cad from Arca", email: "cad@arcabot.ai" } }],
};
const index = {
  contributionIdentities: [{ login: "arcabotai", since: "2026-02-12" }],
  mergedUpstreamCredits: [credit],
};
function githubImpl(overrides = {}) {
  return async (pathname) => {
    if (pathname.includes("/pulls/")) return {
      merged: true, merged_at: date, merge_commit_sha: sha, title: "Replacement",
      user: { login: "maintainer" }, body: credit.provenanceText,
      base: { repo: { private: false } }, ...overrides.pull,
    };
    if (pathname.includes("/commits/")) return {
      sha: landed, commit: { author: credit.landedCommits[0].author, message: "implementation" }, ...overrides.commit,
    };
    if (pathname.includes("/compare/")) return { status: "ahead", merge_base_commit: { sha: landed }, ...overrides.compare };
    throw new Error(`Unexpected request: ${pathname}`);
  };
}

test("refresh fails closed when a configured merged credit has no landed authorship evidence", async () => {
  await assert.rejects(activity.collectCredits({ ...index, mergedUpstreamCredits: [{ ...credit, landedCommits: [] }] }, {
    githubImpl: githubImpl(),
  }), /landed.*evidence/i);
});

test("verified replacement attaches a separate outcome while the original stays closed-unmerged", async () => {
  const credits = await activity.collectCredits(index, { githubImpl: githubImpl() });
  const original = { id: "original", type: "upstream_pr_state", url: origin,
    repository: "community/tool", number: 1, state: "closed", occurredAt: date,
    evidence: { mergeCommit: null } };
  const refreshed = activity.mergeEvents([original, ...credits, ...credits]);
  assert.equal(refreshed.length, 2, "one receipt per replacement");
  const event = refreshed.find((event) => event.id === "original");
  assert.equal(event.state, "closed");
  assert.equal(event.evidence.mergeCommit, null);
  assert.equal(event.contributionOutcome.kind, "incorporated");
  assert.equal(event.contributionOutcome.receipts[0].url, credit.url);
  assert.deepEqual(event.contributionOutcome.receipts[0].landedCommits, credit.landedCommits);
  assert.equal(credits[0].evidence.prAuthor, "maintainer");
  assert.equal(credits[0].actor, "arcabotai");
  const stale = activity.mergeEvents([original], refreshed);
  assert.equal(stale[0].contributionOutcome, undefined, "old acceptance cannot survive absent verified evidence");
});

const manual = {
  project: "Tool", originPullRequest: origin, url: origin, actor: "arcabotai",
  title: "Manual fix", integratedAt: date, credit: "commit author",
  landedCommits: [{ ...credit.landedCommits[0], branch: "main", targetCommit: sha }],
};
function manualGithub(overrides = {}) {
  const base = githubImpl(overrides);
  return async (pathname) => {
    if (pathname.includes("/pulls/")) return { merged: false, state: "closed", merged_at: null, base: { repo: { private: false } } };
    if (pathname.includes("/commits/")) return {
      sha: landed, commit: { author: credit.landedCommits[0].author, committer: { date }, message: `Manual fix\n\nMerged-from: ${origin}` }, ...overrides.commit,
    };
    return base(pathname);
  };
}

test("manual integration retains one contribution with multiple branch commits, never a PR merge", async () => {
  assert.equal(typeof activity.collectManualIntegrations, "function");
  const manualIndex = { ...index, manuallyIntegratedContributions: [{ ...manual, landedCommits: [
    ...manual.landedCommits, { ...manual.landedCommits[0], branch: "stable" },
  ] }] };
  const events = await activity.collectManualIntegrations(manualIndex, { githubImpl: manualGithub() });
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "upstream_manual_integration");
  assert.equal(events[0].state, "integrated");
  assert.equal(events[0].evidence.landedCommits.length, 2);
  const original = { id: "origin", type: "upstream_pr_state", url: origin, state: "closed", occurredAt: date };
  const joined = activity.mergeEvents([original, ...events]);
  assert.equal(joined.find((e) => e.id === "origin").contributionOutcome.kind, "manually_integrated");
  const { validateContributionClaims } = await import('./contribution-claims.mjs');
  assert.deepEqual(await validateContributionClaims({ ...manualIndex, mergedUpstreamCredits:[] }, JSON.parse(JSON.stringify({ events:joined })), { githubImpl:manualGithub() }), { creditedMerges:0, manualIntegrations:1, incorporatedOrigins:1 });
  for (const overrides of [
    { commit: { commit: { author: credit.landedCommits[0].author, message: "no origin trailer" } } },
    { compare: { status: "diverged" } },
  ]) await assert.rejects(activity.collectManualIntegrations(manualIndex, { githubImpl: manualGithub(overrides) }));
});

test("durable claim validator rejects snapshot drift and recomputes outcomes from verified receipts", async () => {
  const { validateContributionClaims } = await import('./contribution-claims.mjs').catch((error) => {
    if (error.code === 'ERR_MODULE_NOT_FOUND') return {};
    throw error;
  });
  assert.equal(typeof validateContributionClaims, 'function');
  const credits = await activity.collectCredits(index, { githubImpl: githubImpl() });
  const feed = { events: activity.mergeEvents([{ id:'origin', type:'upstream_pr_state', url:origin, repository:'community/tool', number:1, state:'closed', occurredAt:date }, ...credits]) };
  assert.deepEqual(await validateContributionClaims(index, feed, { githubImpl: githubImpl() }), { creditedMerges:1, manualIntegrations:0, incorporatedOrigins:1 });
  const corrupt = structuredClone(feed);
  corrupt.events.find(e=>e.id==='origin').contributionOutcome.receipts[0].url = 'https://github.com/community/tool/pull/999';
  await assert.rejects(validateContributionClaims(index, corrupt, { githubImpl: githubImpl() }));
  await assert.rejects(validateContributionClaims(index, { events:feed.events.filter(event=>event.id!=='origin') }, { githubImpl:githubImpl() }), /original PR/);
  const falsifiedOriginal = structuredClone(feed);
  falsifiedOriginal.events.find(event=>event.id==='origin').state='merged';
  delete falsifiedOriginal.events.find(event=>event.id==='origin').contributionOutcome;
  await assert.rejects(validateContributionClaims(index, falsifiedOriginal, { githubImpl:githubImpl() }), /original PR/);
  await assert.rejects(validateContributionClaims(index, feed, { githubImpl: githubImpl({ pull:{ merged:false, merged_at:null } }) }));
});

test("credit validation rejects unknown roles and malformed landed receipt identifiers", async () => {
  for (const patch of [
    { credit: 'acknowledged' },
    { credit: undefined },
    { landedCommits: [{ ...credit.landedCommits[0], sha:'not-a-sha' }] },
    { landedCommits: [{ sha:landed }] },
  ]) await assert.rejects(activity.collectCredits({ ...index, mergedUpstreamCredits:[{ ...credit, ...patch }] }, { githubImpl:githubImpl() }));
  const coauthored = { ...credit, credit:'co-author' };
  await assert.rejects(activity.collectCredits({ ...index, mergedUpstreamCredits:[coauthored] }, { githubImpl:githubImpl() }), /co-author trailer/);
  assert.equal((await activity.collectCredits({ ...index, mergedUpstreamCredits:[coauthored] }, { githubImpl:githubImpl({ commit:{ sha:landed, commit:{ message:'Co-authored-by: Cad from Arca <cad@arcabot.ai>' } } }) })).length,1);
});

test("replacement receipts reject open synthetic merges, missing origin credit, wrong authors and unlanded commits", async () => {
  for (const overrides of [
    { pull: { merged: false, merged_at: null, state: "open" } },
    { pull: { merged: false } },
    { pull: { body: "related fix, no reuse credit" } },
    { pull: { user: { login: "other" } } },
    { commit: { commit: { author: { name: "Other", email: "other@example.org" }, message: "implementation" } } },
    { compare: { status: "diverged" } },
    { compare: { merge_base_commit: { sha } } },
  ]) {
    await assert.rejects(activity.collectCredits(index, { githubImpl: githubImpl(overrides) }));
  }
});
