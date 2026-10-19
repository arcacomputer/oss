import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../lib/presentation.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { latestActivity, currentWork, contributionSummary } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

function event(number, state, occurredAt, extra = {}) {
  return {
    id: `pr:${number}:${state}:${occurredAt}`,
    type: "upstream_pr_state",
    project: "example",
    repository: "org/example",
    number,
    title: `Contribution ${number}`,
    summary: `Contribution is ${state}`,
    url: `https://github.com/org/example/pull/${number}`,
    occurredAt,
    actor: "arcabotai",
    role: "author",
    state,
    ...extra,
  };
}

function pr(number, state, updatedAt, extra = {}) {
  return {
    number,
    author: "felirami",
    title: `Ledger contribution ${number}`,
    url: `https://github.com/org/example/pull/${number}`,
    state,
    updatedAt,
    mergedAt: state === "merged" ? updatedAt : null,
    headSha: "example",
    ratingLabel: null,
    statusLabel: null,
    ...extra,
  };
}

test("latest activity resolves unsorted transitions and canonical URL variants without changing input", () => {
  const older = event(1, "open", "2026-10-01T10:00:00Z");
  const newest = event(1, "closed", "2026-10-03T09:00:00Z", {
    url: `${older.url}/?utm_source=feed#discussion`,
  });
  const other = event(2, "merged", "2026-10-02T10:00:00Z");
  const events = [older, newest, other];
  assert.deepEqual(latestActivity(events), [newest, other]);
  assert.deepEqual(events, [older, newest, other]);
});

test("distinct submitted reviews retain their receipts alongside the PR state", () => {
  const opened = event(1, "open", "2026-10-01T10:00:00Z");
  const firstReview = event(1, "changes_requested", "2026-10-02T10:00:00Z", {
    type: "review_submitted", role: "reviewer", url: `${opened.url}#pullrequestreview-101`,
  });
  const secondReview = event(1, "approved", "2026-10-03T10:00:00Z", {
    type: "review_submitted", role: "reviewer", url: `${opened.url}/?utm_source=feed#pullrequestreview-102`,
  });
  const events = [firstReview, opened, secondReview];
  assert.deepEqual(latestActivity(events), [secondReview, firstReview, opened]);
  assert.deepEqual(currentWork(events, []), [opened]);
});

test("merge totals deduplicate PR receipts and ledger entries while separating upstream credits", () => {
  const events = [
    event(1, "merged", "2026-10-01T10:00:00Z"),
    event(1, "merged", "2026-10-01T11:00:00Z", { url: "https://github.com/org/example/pull/1/" }),
    event(2, "merged", "2026-10-02T10:00:00Z", { type: "upstream_credit", role: "co-author" }),
    event(2, "merged", "2026-10-02T11:00:00Z", { type: "upstream_credit", role: "commit author" }),
    event(3, "merged", "2026-10-03T10:00:00Z", { type: "review_submitted", role: "reviewer" }),
    event(4, "open", "2026-10-04T10:00:00Z"),
    event(6, "changes_requested", "2026-10-06T10:00:00Z", { type: "review_submitted", role: "reviewer" }),
  ];
  const ledger = [pr(1, "merged", "2026-10-01T10:00:00Z"), pr(5, "merged", "2026-10-05T10:00:00Z")];
  assert.deepEqual(contributionSummary(events, ledger), {
    mergedCount: 2,
    mergedCreditCount: 1,
    openCount: 1,
  });
});

test("current work resolves closed transitions and lets the ledger override stale feed states", () => {
  const events = [
    event(1, "open", "2026-10-03T10:00:00Z"),
    event(2, "open", "2026-10-01T10:00:00Z"),
    event(2, "closed", "2026-10-02T10:00:00Z"),
    event(3, "closed", "2026-10-01T10:00:00Z"),
    event(4, "changes_requested", "2026-10-04T10:00:00Z", { type: "review_submitted", role: "reviewer" }),
    event(6, "open", "2026-10-01T10:00:00Z"),
  ];
  const ledger = [
    pr(1, "closed", "2026-10-01T10:00:00Z"),
    pr(3, "open", "2026-10-03T10:00:00Z", { arca: { currentWork: "Addressing maintainer feedback" } }),
    pr(5, "open", "2026-10-05T10:00:00Z"),
    pr(6, "merged", "2026-10-03T10:00:00Z"),
  ];
  const before = structuredClone({ events, ledger });
  const work = currentWork(events, ledger);
  assert.deepEqual(work.map((item) => item.number), [5, 3]);
  assert.ok(!work.some((item) => item.number === 4), "submitted reviews do not establish that a PR remains open");
  assert.equal(work.find((item) => item.number === 3).summary, "Addressing maintainer feedback");
  assert.equal(work.find((item) => item.number === 5).actor, "felirami");
  assert.deepEqual({ events, ledger }, before);
});

test("committed snapshots never advertise a closed or merged ledger PR as current work", async () => {
  const feed = JSON.parse(await readFile(new URL("../public/activity.json", import.meta.url), "utf8"));
  const ledger = JSON.parse(await readFile(new URL("../public/openclaw-prs.json", import.meta.url), "utf8"));
  const work = currentWork(feed.events, ledger.pullRequests);
  const closed = new Set(ledger.pullRequests.filter((item) => item.state !== "open").map((item) => item.url));
  assert.ok(work.length > 0);
  assert.ok(work.every((item) => !closed.has(item.url)));
  assert.ok(work.every((item) => item.type === "upstream_pr_state" && item.state === "open"));
  assert.equal(new Set(work.map((item) => item.url)).size, work.length);
  assert.equal(contributionSummary(feed.events, ledger.pullRequests).openCount, work.length);
});
