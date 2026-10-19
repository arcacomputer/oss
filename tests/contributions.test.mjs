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
  assert.deepEqual(project.curatedEvidence, [{ label: "open PR #1", url: "https://github.com/org/test-project/pull/1" }]);
  assert.deepEqual(project.openItems.map((item) => item.number), [1]);
  assert.deepEqual(project.mergedItems.map((item) => item.number), [2]);
  assert.deepEqual(project.closedItems.map((item) => item.number), [3]);
  assert.deepEqual(project.creditItems.map((item) => item.number), [4]);
  assert.deepEqual(project.reviewedItems.map((item) => item.number), [5]);
  assert.deepEqual(project.allReceipts.map((item) => item.number), [5, 4, 3, 2, 1]);
  assert.equal(project.lastUpdated, "2026-10-05T10:00:00Z");
  assert.deepEqual(events, before);
});

test("latest feed states and newer ledger snapshots prevent stale open and merged claims", () => {
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

test("directory categories follow the latest verified update across reopened PRs and stale ledger states", () => {
  const events = [
    event(1, "closed", "2026-10-18T10:00:00Z", { updatedAt: "2026-10-19T10:00:00Z" }),
    event(2, "merged", "2026-10-18T10:00:00Z", { updatedAt: "2026-10-19T10:00:00Z" }),
    event(3, "closed", "2026-10-01T10:00:00Z"),
    event(3, "open", "2026-07-01T10:00:00Z", { updatedAt: "2026-10-19T10:00:00Z" }),
    event(4, "open", "2026-10-01T10:00:00Z"),
  ];
  const ledger = [
    pr(1, "open", "2026-10-17T10:00:00Z"),
    pr(2, "closed", "2026-10-17T10:00:00Z"),
    pr(4, "closed", "2026-10-19T10:00:00Z"),
  ];
  const project = getContributionDirectory(events, ledger, []).active[0];
  assert.deepEqual(project.openItems.map((item) => item.number), [3]);
  assert.deepEqual(project.mergedItems.map((item) => item.number), [2]);
  assert.deepEqual(project.closedItems.map((item) => item.number), [4, 1]);
  assert.deepEqual(project.allReceipts.map((item) => item.number), [4, 2, 1, 3]);
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

test("curated labels and links cannot create a contribution project without an in-scope receipt", () => {
  const historical = program({
    name: "Historical Project", url: "https://github.com/org/historical", status: "3 merged contributions",
    evidence: "https://github.com/org/historical/pull/1", evidenceLabel: "merged PR #1",
    additionalEvidence: [{ label: "merged PR #2", url: "https://github.com/org/historical/pull/2" }],
  });
  const directory = getContributionDirectory([
    event(1, "merged", "2023-12-11T22:30:48Z", {
      repository: "org/historical",
      url: "https://github.com/org/historical/pull/1",
      actor: "felirami",
    }),
  ], [], [historical, program()]);
  assert.equal(directory.active.length, 0);
  assert.equal(directory.past.length, 0);
});

test("contribution history excludes unknown authors and work created before the Arca cutoff", () => {
  const cutoff = "2026-02-12T00:00:00Z";
  const recent = "2026-10-01T10:00:00Z";
  const beforeCutoff = "2026-02-11T23:59:59Z";
  const events = [
    event(1, "merged", cutoff),
    event(2, "open", recent, { actor: "untracked-user" }),
    event(3, "merged", beforeCutoff),
    event(4, "merged", recent, { createdAt: beforeCutoff }),
    event(5, "merged", beforeCutoff, { type: "upstream_credit", role: "co-author" }),
    event(6, "approved", recent, {
      type: "review_submitted", role: "reviewer", actor: "arcacomputer",
      url: "https://github.com/org/test-project/pull/6#pullrequestreview-106",
    }),
    event(7, "merged", recent, { type: "upstream_credit", role: "co-author", actor: "felirami" }),
    event(8, "approved", recent, {
      type: "review_submitted", role: "reviewer",
      url: "https://github.com/org/test-project/pull/8#pullrequestreview-108",
    }),
  ];
  const ledger = [
    pr(9, "merged", recent, { author: undefined }),
    pr(10, "open", recent, { author: "untracked-user" }),
    pr(11, "merged", recent, { createdAt: beforeCutoff }),
    pr(12, "merged", beforeCutoff),
    pr(13, "open", cutoff),
  ];
  const directory = getContributionDirectory(events, ledger, []);
  assert.equal(directory.active.length, 1);
  assert.equal(directory.past.length, 1);
  const project = directory.past[0];
  assert.deepEqual(project.allReceipts.map((item) => item.number).sort((a, b) => a - b), [1, 7, 8, 13]);
  assert.deepEqual(project.mergedItems.map((item) => item.number), [1]);
  assert.deepEqual(project.openItems.map((item) => item.number), [13]);
  assert.equal(project.openItems[0].actor, "felirami");
});

test("configured contribution scope controls author identities and the inclusive start date", () => {
  const events = [
    event(1, "merged", "2026-10-01T00:00:00Z", { actor: "Verified-Contributor" }),
    event(2, "merged", "2026-09-30T23:59:59Z", { actor: "verified-contributor" }),
    event(3, "merged", "2026-10-02T00:00:00Z"),
  ];
  const directory = getContributionDirectory(events, [], [], {
    authors: ["verified-contributor"],
    since: "2026-10-01",
  });
  assert.equal(directory.past.length, 1);
  assert.deepEqual(directory.past[0].mergedItems.map((item) => item.number), [1]);
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

test("committed snapshots expose in-scope upstream projects without legacy curated history", async () => {
  const feed = JSON.parse(await read("../public/activity.json"));
  const ledger = JSON.parse(await read("../public/openclaw-prs.json"));
  const imports = {
    activityJson: feed,
    openClawLedgerJson: ledger,
    ossIndex: JSON.parse(await read("../public/oss.json")),
    repositoryInventoryJson: JSON.parse(await read("../public/github-repositories.json")),
  };
  let dataSource = await read("../lib/data.ts");
  for (const [name, value] of Object.entries(imports)) {
    dataSource = dataSource.replace(
      new RegExp(`^import ${name} .*;$`, "m"),
      () => `const ${name} = ${JSON.stringify(value)};`,
    );
  }
  const { supportPrograms } = await import(moduleUrl(dataSource));
  const directory = getContributionDirectory(feed.events, ledger.pullRequests, supportPrograms);
  assert.deepEqual(directory.active.map((item) => item.name).sort(), ["Apache Kafka", "Buzz", "Django", "Hermes Agent", "OpenClaw"]);
  assert.ok(directory.past.some((item) => item.name === "elizaOS"));
  assert.ok(!directory.past.some((item) => item.name === "SlimeVR CheeseCake"));
  assert.ok(directory.active.some((item) => item.repository === "apache/kafka"));
  assert.ok(directory.past.some((item) => item.repository === "huggingface/tokenizers"));
  const mergedCount = directory.past.reduce((total, project) => total + project.mergedItems.length, 0);
  assert.equal(mergedCount, 26, "only actual authored merged PR receipts count; curated labels and credits add no synthetic merges");
  const clickClack = directory.past.find((item) => item.name === "ClickClack");
  assert.equal(clickClack.mergedItems.length, 0);
  assert.equal(clickClack.creditItems.length, 2);
  assert.equal(clickClack.closedItems.length, 1);
});
