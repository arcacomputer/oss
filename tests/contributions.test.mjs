import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const moduleUrl = (source) => {
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
};
const presentationUrl = moduleUrl(await read("../lib/presentation.ts"));
const { getContributionDirectory } = await import(moduleUrl(
  (await read("../lib/contributions.ts")).replace('from "./presentation"', `from "${presentationUrl}"`),
));

function event(number, state, occurredAt, extra = {}) {
  return {
    id: `pr:${number}:${state}:${occurredAt}`,
    type: "upstream_pr_state",
    project: "test-project",
    repository: "org/test-project",
    number,
    title: `Contribution ${number}`,
    summary: `Contribution is ${state}`,
    url: `https://github.com/org/test-project/pull/${number}`,
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
    url: `https://github.com/org/test-project/pull/${number}`,
    state,
    updatedAt,
    mergedAt: state === "merged" ? updatedAt : null,
    headSha: "example",
    ratingLabel: null,
    statusLabel: null,
    ...extra,
  };
}

function program(extra = {}) {
  return {
    name: "Test Project",
    url: "https://github.com/org/test-project",
    logo: "/upstream/test.png",
    role: "upstream contributor",
    scope: "runtime reliability · tests",
    status: "active",
    evidence: "https://github.com/org/test-project/pull/1",
    evidenceLabel: "open PR #1",
    note: "Independent upstream contributions.",
    ...extra,
  };
}

test("project directory groups current work and history independently, with curated project metadata", () => {
  const events = [
    event(1, "open", "2026-10-01T10:00:00Z"),
    event(2, "merged", "2026-10-02T10:00:00Z"),
    event(3, "closed", "2026-10-03T10:00:00Z"),
    event(4, "merged", "2026-10-04T10:00:00Z", { type: "upstream_credit", role: "co-author" }),
    event(5, "changes_requested", "2026-10-05T10:00:00Z", {
      type: "review_submitted", role: "reviewer", url: "https://github.com/org/test-project/pull/5#pullrequestreview-111",
    }),
  ];
  const before = structuredClone(events);
  const directory = getContributionDirectory(events, [], [program()]);
  assert.equal(directory.active.length, 1);
  assert.equal(directory.past.length, 1);
  const project = directory.active[0];
  assert.equal(project, directory.past[0]);
  assert.equal(project.name, "Test Project");
  assert.equal(project.logo, "/upstream/test.png");
  assert.equal(project.description, "runtime reliability · tests");
  assert.equal(project.note, "Independent upstream contributions.");
  assert.deepEqual(project.openItems.map((item) => item.number), [1]);
  assert.deepEqual(project.mergedItems.map((item) => item.number), [2]);
  assert.deepEqual(project.closedItems.map((item) => item.number), [3]);
  assert.deepEqual(project.creditItems.map((item) => item.number), [4]);
  assert.deepEqual(project.reviewedItems.map((item) => item.number), [5]);
  assert.deepEqual(project.allReceipts.map((item) => item.number), [5, 4, 3, 2, 1]);
  assert.equal(project.lastUpdated, "2026-10-05T10:00:00Z");
  assert.deepEqual(events, before);
});

test("latest feed states and authoritative ledger snapshots prevent stale open and merged claims", () => {
  const events = [
    event(1, "open", "2026-10-01T10:00:00Z"),
    event(1, "closed", "2026-10-03T10:00:00Z", { url: "https://github.com/org/test-project/pull/1/?utm_source=feed" }),
    event(2, "open", "2026-10-01T10:00:00Z"),
    event(3, "merged", "2026-10-01T10:00:00Z"),
    event(3, "merged", "2026-10-02T10:00:00Z"),
  ];
  const ledger = [
    pr(2, "merged", "2026-10-04T10:00:00Z"),
    pr(3, "closed", "2026-10-03T10:00:00Z"),
    pr(4, "open", "2026-10-05T10:00:00Z"),
    pr(4, "closed", "2026-10-02T10:00:00Z"),
  ];
  const before = structuredClone({ events, ledger });
  const project = getContributionDirectory(events, ledger, []).active[0];
  assert.equal(project.name, "Test Project");
  assert.deepEqual(project.openItems.map((item) => item.number), [4]);
  assert.deepEqual(project.mergedItems.map((item) => item.number), [2]);
  assert.deepEqual(project.closedItems.map((item) => item.number), [1, 3]);
  assert.equal(project.allReceipts.length, 4);
  assert.equal(project.mergedItems[0].actor, "felirami");
  assert.deepEqual({ events, ledger }, before);
});

test("review receipts stay distinct from PR states and never establish current work or an authored merge", () => {
  const first = event(1, "approved", "2026-10-02T10:00:00Z", {
    type: "review_submitted", role: "reviewer", url: "https://github.com/org/test-project/pull/1#pullrequestreview-101",
  });
  const second = event(1, "changes_requested", "2026-10-03T10:00:00Z", {
    type: "review_submitted", role: "reviewer", url: "https://github.com/org/test-project/pull/1#pullrequestreview-102",
  });
  const directory = getContributionDirectory([first, second], [], []);
  assert.equal(directory.active.length, 0);
  assert.equal(directory.past[0].mergedItems.length, 0);
  assert.equal(directory.past[0].reviewedItems.length, 2);
  assert.equal(directory.past[0].allReceipts.length, 2);
  assert.equal(directory.past[0].role, "upstream reviewer");
});

test("curated older merged receipts remain discoverable without manufacturing dated events or totals", () => {
  const historical = program({
    name: "Historical Project", url: "https://github.com/org/historical", status: "3 merged contributions",
    evidence: "https://github.com/org/historical/pull/1", evidenceLabel: "merged PR #1",
    additionalEvidence: [{ label: "merged PR #2", url: "https://github.com/org/historical/pull/2" }],
  });
  const directory = getContributionDirectory([], [], [historical, program()]);
  assert.equal(directory.active.length, 0);
  assert.equal(directory.past.length, 1);
  assert.equal(directory.past[0].name, "Historical Project");
  assert.equal(directory.past[0].curatedEvidence.length, 2);
  assert.equal(directory.past[0].mergedItems.length, 0);
  assert.equal(directory.past[0].allReceipts.length, 0);
  assert.equal(directory.past[0].lastUpdated, "");
});

test("owned repositories and releases never appear as upstream contribution projects", () => {
  const events = [
    ...["arcabotai", "Arcacomputer", "felirami"].map((owner, index) => event(index, "open", "2026-10-01T10:00:00Z", {
      repository: `${owner}/owned`, url: `https://github.com/${owner}/owned/pull/${index}`,
    })),
    event(5, "released", "2026-10-05T10:00:00Z", { type: "release", role: "publisher" }),
    event(6, "closed", "2026-10-06T10:00:00Z", { repository: "community/another-project", project: "another-project" }),
  ];
  const directory = getContributionDirectory(events, [pr(7, "merged", "2026-10-07T10:00:00Z", {
    url: "https://github.com/arcacomputer/owned/pull/7",
  })], []);
  assert.equal(directory.active.length, 0);
  assert.deepEqual(directory.past.map((item) => item.repository), ["community/another-project"]);
  assert.equal(directory.past[0].name, "Another Project");
  assert.equal(directory.past[0].closedItems[0].state, "closed");
});

test("committed snapshots expose active projects plus all historic upstream projects, including curated SlimeVR", async () => {
  const feed = JSON.parse(await read("../public/activity.json"));
  const ledger = JSON.parse(await read("../public/openclaw-prs.json"));
  const dataSource = (await read("../lib/data.ts"))
    .replace(/^import activityJson .*;$/m, "const activityJson = {};")
    .replace(/^import openClawLedgerJson .*;$/m, "const openClawLedgerJson = {};");
  const { supportPrograms } = await import(moduleUrl(dataSource));
  const directory = getContributionDirectory(feed.events, ledger.pullRequests, supportPrograms);
  assert.deepEqual(directory.active.map((item) => item.name).sort(), ["Buzz", "Hermes Agent", "OpenClaw"]);
  assert.ok(directory.past.some((item) => item.name === "elizaOS"));
  assert.ok(directory.past.some((item) => item.name === "SlimeVR CheeseCake"));
  assert.ok(directory.past.some((item) => item.repository === "apache/kafka"));
  assert.ok(directory.past.some((item) => item.repository === "huggingface/tokenizers"));
  const mergedCount = directory.past.reduce((total, project) => total + project.mergedItems.length, 0);
  assert.equal(mergedCount, 26, "only actual authored merged PR receipts count; curated labels and credits add no synthetic merges");
  const clickClack = directory.past.find((item) => item.name === "ClickClack");
  assert.equal(clickClack.mergedItems.length, 0);
  assert.equal(clickClack.creditItems.length, 2);
  assert.equal(clickClack.closedItems.length, 1);
});
