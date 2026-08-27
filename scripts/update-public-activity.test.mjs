import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPullRequestQuery,
  isInternalRepository,
  mergeEvents,
  normalizePullRequest,
  payloadFor,
} from "./update-public-activity.mjs";

const pull = {
  number: 107243,
  title: "preserve canonical cache rows",
  html_url: "https://github.com/openclaw/openclaw/pull/107243",
  state: "closed",
  created_at: "2026-07-14T01:00:00Z",
  closed_at: "2026-07-14T16:40:36Z",
  merged_at: "2026-07-14T16:40:36Z",
  merge_commit_sha: "c1191cdf",
  user: { login: "felirami" },
  head: { sha: "e35ddb3c" },
  base: { repo: { full_name: "openclaw/openclaw", name: "openclaw" } },
};

test("search query excludes owned repository namespaces before pagination", () => {
  const query = buildPullRequestQuery(
    { login: "felirami", since: "2026-02-12" },
    new Set(["arcabotai", "felirami", "arcacomputer"]),
  );
  assert.match(query, /author:felirami/);
  assert.match(query, /created:>=2026-02-12/);
  assert.match(query, /-user:arcabotai/);
  assert.match(query, /-user:felirami/);
  assert.match(query, /-user:arcacomputer/);
});

test("internal repositories are excluded by owner", () => {
  const owners = new Set(["arcabotai", "felirami", "arcacomputer"]);
  assert.equal(isInternalRepository("arcabotai/oss", owners), true);
  assert.equal(isInternalRepository("felirami/castaway", owners), true);
  assert.equal(isInternalRepository("arcacomputer/hypersnapweb", owners), true);
  assert.equal(isInternalRepository("openclaw/openclaw", owners), false);
});

test("merged PRs keep exact upstream state and receipt", () => {
  const event = normalizePullRequest(pull);
  assert.equal(event.id, "github:pr:openclaw/openclaw:107243:merged");
  assert.equal(event.actor, "felirami");
  assert.equal(event.state, "merged");
  assert.equal(event.occurredAt, pull.merged_at);
  assert.equal(event.evidence.headSha, pull.head.sha);
  assert.equal(event.evidence.mergeCommit, pull.merge_commit_sha);
});

test("open PRs ignore GitHub's mutable synthetic merge commit", () => {
  const event = normalizePullRequest({
    ...pull,
    state: "open",
    closed_at: null,
    merged_at: null,
    merge_commit_sha: "mutable-test-merge",
  });
  assert.equal(event.state, "open");
  assert.equal(event.evidence.mergeCommit, null);
});

test("prior state transitions remain visible for monitored PRs", () => {
  const merged = normalizePullRequest(pull);
  const opened = {
    ...merged,
    id: "github:pr:openclaw/openclaw:107243:open",
    state: "open",
    occurredAt: pull.created_at,
    evidence: { ...merged.evidence, mergeCommit: "old-synthetic-merge" },
  };
  const result = mergeEvents([merged], [opened]);
  assert.deepEqual(result.map((event) => event.state), ["merged", "open"]);
  assert.equal(result[1].evidence.mergeCommit, null);
});

test("the public feed keeps more than fifty receipts", () => {
  const events = Array.from({ length: 60 }, (_, index) => ({
    ...normalizePullRequest(pull),
    id: `receipt-${index}`,
    number: index,
    occurredAt: `2026-07-${String((index % 28) + 1).padStart(2, "0")}T00:00:00Z`,
  }));
  assert.equal(mergeEvents(events).length, 60);
});

test("generatedAt changes only when public event content changes", () => {
  const event = normalizePullRequest(pull);
  const previous = {
    schemaVersion: 1,
    generatedAt: "2026-07-17T00:00:00Z",
    events: [event],
  };
  assert.equal(payloadFor([event], previous, "2026-07-18T00:00:00Z").generatedAt, previous.generatedAt);
  assert.equal(
    payloadFor([{ ...event, title: "changed" }], previous, "2026-07-18T00:00:00Z").generatedAt,
    "2026-07-18T00:00:00Z",
  );
});
