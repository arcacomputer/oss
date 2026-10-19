import assert from "node:assert/strict";
import test from "node:test";
import {
  candidatePullRequestNumber,
  normalizeVerifiedLedgerRecord,
  refreshVerifiedLedger,
} from "./update-openclaw-ledger.mjs";

const identities = [
  { login: "felirami", role: "Arca founder", since: "2026-02-12" },
  { login: "arcabotai", role: "Arca agent identity", since: "2026-02-12" },
];
const curated = {
  number: 123,
  url: "https://github.com/openclaw/openclaw/pull/123",
  state: "open",
  author: "arcabotai",
  title: "Unverified remote title",
  headSha: "unverified-head",
  createdAt: "2026-10-01T00:00:00Z",
  ratingLabel: "gold shrimp",
  statusLabel: "ready for review",
  arca: { workStatus: "active repair", currentWork: "Curated implementation notes." },
};
const details = {
  number: 123,
  html_url: curated.url,
  title: "Verified upstream title",
  user: { login: "felirami" },
  state: "closed",
  draft: false,
  created_at: "2026-02-12T00:00:00Z",
  updated_at: "2026-10-19T09:10:00Z",
  closed_at: "2026-10-19T09:00:00Z",
  merged_at: "2026-10-19T09:00:00Z",
  merge_commit_sha: "verified-merge",
  head: { sha: "verified-head" },
  base: { sha: "verified-base", repo: { full_name: "openclaw/openclaw", private: false } },
};

test("ledger records use GitHub authors, dates, state and commits while retaining selected notes", () => {
  const record = normalizeVerifiedLedgerRecord(details, curated, identities);
  assert.equal(record.author, "felirami");
  assert.equal(record.identityRole, "Arca founder");
  assert.equal(record.title, details.title);
  assert.equal(record.url, details.html_url);
  assert.equal(record.state, "merged");
  assert.equal(record.createdAt, details.created_at);
  assert.equal(record.updatedAt, details.updated_at);
  assert.equal(record.mergedAt, details.merged_at);
  assert.equal(record.headSha, details.head.sha);
  assert.equal(record.mergeCommit, details.merge_commit_sha);
  assert.equal(record.ratingLabel, curated.ratingLabel);
  assert.equal(record.statusLabel, curated.statusLabel);
  assert.deepEqual(record.arca, curated.arca);
});

test("remote merged claims cannot turn an unmerged GitHub PR into a merged contribution", () => {
  const record = normalizeVerifiedLedgerRecord(
    { ...details, merged_at: null, merge_commit_sha: "synthetic-test-merge" },
    { ...curated, state: "merged", mergedAt: "2026-10-01T00:00:00Z" },
    identities,
  );
  assert.equal(record.state, "closed");
  assert.equal(record.mergedAt, null);
  assert.equal(record.mergeCommit, null);
});

test("missing or untracked GitHub authors and PRs created before the cutoff are excluded", () => {
  for (const changes of [
    { user: null },
    { user: {} },
    { user: { login: "someone-else" } },
    { created_at: "2026-02-11T23:59:59Z" },
    { created_at: undefined },
    { created_at: "invalid" },
  ]) {
    assert.equal(normalizeVerifiedLedgerRecord({ ...details, ...changes }, curated, identities), null);
  }
  const withoutExplicitDate = [{ login: "felirami", role: "Arca founder", since: null }];
  assert.equal(normalizeVerifiedLedgerRecord(
    { ...details, created_at: "2026-02-11T23:59:59Z" }, curated, withoutExplicitDate,
  ), null);
});

test("only canonical public OpenClaw PR details are publishable", () => {
  const invalid = [
    { ...details, base: { repo: { full_name: "openclaw/openclaw", private: true } } },
    { ...details, base: { repo: { full_name: "another/repository", private: false } } },
    { ...details, number: 124 },
    { ...details, html_url: "https://github.com/another/repository/pull/123" },
    { ...details, head: null },
    { ...details, updated_at: "invalid" },
  ];
  for (const value of invalid) assert.equal(normalizeVerifiedLedgerRecord(value, curated, identities), null);
});

test("external ledger candidates cannot select another host, repository, path or PR number", () => {
  assert.equal(candidatePullRequestNumber(curated), 123);
  for (const value of [
    null,
    {},
    { ...curated, number: "123" },
    { ...curated, number: -123 },
    { ...curated, number: 1.5 },
    { ...curated, number: 124 },
    { ...curated, url: "https://evil.example/openclaw/openclaw/pull/123" },
    { ...curated, url: "https://github.com/another/repository/pull/123" },
    { ...curated, url: "http://github.com/openclaw/openclaw/pull/123" },
    { ...curated, url: `${curated.url}?next=https://evil.example` },
    { ...curated, url: `${curated.url}#comment` },
    { ...curated, url: "https://user@github.com/openclaw/openclaw/pull/123" },
  ]) assert.equal(candidatePullRequestNumber(value), null);
});

test("refresh verifies only validated canonical candidates and stamps the verification time", async () => {
  const calls = [];
  const checkedAt = "2026-10-19T12:00:00Z";
  const remote = {
    generatedAt: "2026-10-01T00:00:00Z",
    source: "https://github.com/openclaw/openclaw",
    pullRequests: [
      curated,
      { ...curated, number: 124, url: "https://evil.example/pull/124" },
      { ...curated, number: 125, url: "https://github.com/openclaw/openclaw/pull/125" },
    ],
  };
  const ledger = await refreshVerifiedLedger(remote, identities, {
    checkedAt,
    github: async (path) => {
      calls.push(path);
      return path.endsWith("/123") ? details : {
        ...details, number: 125, html_url: remote.pullRequests[2].url,
        user: { login: "untracked-user" },
      };
    },
  });
  assert.deepEqual(calls, ["/repos/openclaw/openclaw/pulls/123", "/repos/openclaw/openclaw/pulls/125"]);
  assert.equal(ledger.generatedAt, checkedAt);
  assert.equal(ledger.checkedAt, checkedAt);
  assert.equal(ledger.upstreamGeneratedAt, remote.generatedAt);
  assert.deepEqual(ledger.authors, identities);
  assert.deepEqual(ledger.pullRequests.map((pr) => pr.number), [123]);
});

test("refresh fails before publishing when source structure is missing", async () => {
  await assert.rejects(refreshVerifiedLedger({}, identities), /no pullRequests array/);
  await assert.rejects(refreshVerifiedLedger({ pullRequests: [] }, []), /No contribution identities/);
});
