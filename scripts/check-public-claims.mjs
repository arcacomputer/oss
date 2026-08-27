import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const licensed = [
  { repository: "arcabotai/clawfix", spdx: "MIT" },
  { repository: "arcabotai/hypersnapdoctor", spdx: "MIT" },
  { repository: "arcabotai/a3stack", spdx: "MIT" },
  { repository: "arcabotai/ardea-knowledge-steward", contains: "Apache License\nVersion 2.0" },
  { repository: "arcabotai/arca-openclaw-contributions", spdx: "MIT" },
  { repository: "arcabotai/openclaw-tui-deliver-stuck-spinner", spdx: "MIT" },
  { repository: "felirami/orthovoxel-studio", spdx: "MIT" },
  { repository: "felirami/openchina", spdx: "MIT" },
  { repository: "arcacomputer/headlong-agent-findings", spdx: "MIT" },
  { repository: "arcacomputer/oss", spdx: "MIT" },
];

const elizaMergedBaseline = { felirami: 15, arcabotai: 1 };
const elizaArcabotPr = {
  number: 18101,
  author: "arcabotai",
  headSha: "cc591dbf8ad94e9180ecb655cea7eb42f96e97e2",
  mergeCommit: "bc0752eea6f3d84b38ba4dc0f8484bc09be29e15",
};
const slimeVrMergedPrs = [
  { number: 1, author: "felirami", headSha: "670a25491332ea444dab8419c54138172c7d704d", mergeCommit: "c8699d3565fe83927988167a4de217c4ea4ccb81" },
  { number: 6, author: "felirami", headSha: "f4a6de07da991a692889acc7dd77dd5aa9a08f4e", mergeCommit: "ee51f530e06f0385ae3ddc4a5256048cb2d55393" },
  { number: 9, author: "felirami", headSha: "d1b9939b3cc90d6e1831d291dae9cf44b322ba55", mergeCommit: "b8a4a2da6e3266131136ac96ae59257572a2d2a6" },
];

const prs = [104192, 104492, 104893, 105029];
const founderMergedPr = {
  number: 107243,
  author: "felirami",
  headSha: "e35ddb3ce365c07419365d5b799bbb45b65ac38e",
  mergeCommit: "c1191cdf2fbbea4cc9797d7f110a4e0acf50d3c7",
};
const crabboxMergedPr = {
  number: 1192,
  author: "arcabotai",
  headSha: "013974334b62a05b917fd605212175007d97412b",
  mergeCommit: "08a5f9ac92426369c2c3a6fcbdc8669802d41202",
};
const buzzOpenPr = {
  number: 3963,
  author: "arcabotai",
  headSha: "91d722e905d87d6b32ec3a6928fcbd11bf45fad4",
};
const buzzReview = {
  pullRequest: 3894,
  id: 4831913754,
  state: "CHANGES_REQUESTED",
  commitId: "180dbb825204d4f295c2d322d850611fd8b684e8",
};
const clickClackMergeCredits = [
  {
    number: 91,
    implementationCommit: "79d96964549d020143d50cbc4794ad460bf1ed87",
    mergeCommit: "3e1d2841a314c139c1f053605dbb6d94d9e81a07",
    changelogText: "Added SDK helpers for paginated realtime recovery and bounded latest thread-history windows. Thanks @arcabotai",
  },
  {
    number: 92,
    implementationCommit: "068ce38bf1e93e8caec8090dcbc573fb4a48bf45",
    mergeCommit: "064a46fc73e11dff15cc2af03e631a28b42ddef1",
    changelogText: "Added typed agent-progress SDK payloads while preserving workspace-wide presence events without channel or DM targets. Thanks @arcabotai",
  },
];
const hermesMergeCredit = {
  number: 76400,
  originPullRequest: 74779,
  mergeCommit: "8b8ebc26bb5a433c1975615c7c8e4a0182d94f36",
  implementationCommits: [
    "e1c1af9378d441e89a0e3cf4bd6979565168ef42",
    "84838ec21ba4b049d6ca66b1c1bf7f2fb5f42300",
    "e2095dd77ea4211a2c4ad75c9069193acca2a155",
    "ffd9a9e78fbf135e6029c921e67b53460a55044d",
    "c444915f21d3a85220adbdb64069626c7281b8d9",
  ],
};
const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "arca-oss-claim-validator",
  ...((process.env.GH_TOKEN || process.env.GITHUB_TOKEN)
    ? { Authorization: `Bearer ${process.env.GH_TOKEN || process.env.GITHUB_TOKEN}` }
    : {}),
};

async function github(path) {
  const response = await fetch(`https://api.github.com/${path}`, { headers });
  assert.equal(response.ok, true, `${path}: GitHub returned ${response.status}`);
  return response.json();
}

async function githubText(path) {
  const response = await fetch(`https://api.github.com/${path}`, {
    headers: { ...headers, Accept: "application/vnd.github.raw+json" },
  });
  assert.equal(response.ok, true, `${path}: GitHub returned ${response.status}`);
  return response.text();
}

for (const expected of licensed) {
  if (expected.spdx) {
    const license = await github(`repos/${expected.repository}/license`);
    assert.equal(license.license?.spdx_id, expected.spdx, `${expected.repository}: expected ${expected.spdx} license`);
  } else {
    const license = await githubText(`repos/${expected.repository}/contents/LICENSE`);
    assert.ok(license.includes(expected.contains), `${expected.repository}: expected explicit Apache-2.0 license notice`);
  }
}

for (const [author, count] of Object.entries(elizaMergedBaseline)) {
  const query = encodeURIComponent(`repo:elizaOS/eliza is:pr is:merged author:${author}`);
  const result = await github(`search/issues?q=${query}&per_page=100`);
  assert.ok(result.total_count >= count, `elizaOS: expected at least ${count} merged PRs by ${author}`);
}
const elizaPr = await github(`repos/elizaOS/eliza/pulls/${elizaArcabotPr.number}`);
assert.ok(elizaPr.merged_at, `elizaOS PR #${elizaArcabotPr.number}: expected merged state`);
assert.equal(elizaPr.user?.login, elizaArcabotPr.author, `elizaOS PR #${elizaArcabotPr.number}: author changed`);
assert.equal(elizaPr.head?.sha, elizaArcabotPr.headSha, `elizaOS PR #${elizaArcabotPr.number}: head changed`);
assert.equal(elizaPr.merge_commit_sha, elizaArcabotPr.mergeCommit, `elizaOS PR #${elizaArcabotPr.number}: merge commit changed`);

const slimeVrLicense = await github("repos/Sorakage033/SlimeVR-CheeseCake/license");
assert.equal(slimeVrLicense.license?.spdx_id, "Apache-2.0", "SlimeVR CheeseCake: expected Apache-2.0 license");
for (const expected of slimeVrMergedPrs) {
  const pr = await github(`repos/Sorakage033/SlimeVR-CheeseCake/pulls/${expected.number}`);
  assert.ok(pr.merged_at, `SlimeVR CheeseCake PR #${expected.number}: expected merged state`);
  assert.equal(pr.user?.login, expected.author, `SlimeVR CheeseCake PR #${expected.number}: author changed`);
  assert.equal(pr.head?.sha, expected.headSha, `SlimeVR CheeseCake PR #${expected.number}: head changed`);
  assert.equal(pr.merge_commit_sha, expected.mergeCommit, `SlimeVR CheeseCake PR #${expected.number}: merge commit changed`);
}

for (const number of prs) {
  const pr = await github(`repos/openclaw/openclaw/pulls/${number}`);
  const state = pr.merged_at ? "merged" : pr.state;
  assert.ok(["open", "closed", "merged"].includes(state), `PR #${number}: invalid state ${state}`);
}

const founderPr = await github(`repos/openclaw/openclaw/pulls/${founderMergedPr.number}`);
assert.ok(founderPr.merged_at, `OpenClaw PR #${founderMergedPr.number}: expected merged state`);
assert.equal(founderPr.user?.login, founderMergedPr.author, `OpenClaw PR #${founderMergedPr.number}: author changed`);
assert.equal(founderPr.head?.sha, founderMergedPr.headSha, `OpenClaw PR #${founderMergedPr.number}: head changed`);
assert.equal(founderPr.merge_commit_sha, founderMergedPr.mergeCommit, `OpenClaw PR #${founderMergedPr.number}: merge commit changed`);

const crabboxPr = await github(`repos/openclaw/crabbox/pulls/${crabboxMergedPr.number}`);
assert.ok(crabboxPr.merged_at, `Crabbox PR #${crabboxMergedPr.number}: expected merged state`);
assert.equal(crabboxPr.user?.login, crabboxMergedPr.author, `Crabbox PR #${crabboxMergedPr.number}: author changed`);
assert.equal(crabboxPr.head?.sha, crabboxMergedPr.headSha, `Crabbox PR #${crabboxMergedPr.number}: head changed`);
assert.equal(crabboxPr.merge_commit_sha, crabboxMergedPr.mergeCommit, `Crabbox PR #${crabboxMergedPr.number}: merge commit changed`);

const buzzPr = await github(`repos/block/buzz/pulls/${buzzOpenPr.number}`);
assert.equal(buzzPr.state, "open", `Buzz PR #${buzzOpenPr.number}: expected open state`);
assert.equal(buzzPr.user?.login, buzzOpenPr.author, `Buzz PR #${buzzOpenPr.number}: author changed`);
assert.equal(buzzPr.head?.sha, buzzOpenPr.headSha, `Buzz PR #${buzzOpenPr.number}: head changed`);

const buzzReviews = await github(`repos/block/buzz/pulls/${buzzReview.pullRequest}/reviews`);
const verifiedBuzzReview = buzzReviews.find((item) => item.id === buzzReview.id);
assert.ok(verifiedBuzzReview, `Buzz PR #${buzzReview.pullRequest}: Arca review not found`);
assert.equal(verifiedBuzzReview.user?.login, "arcabotai", `Buzz review #${buzzReview.id}: reviewer changed`);
assert.equal(verifiedBuzzReview.state, buzzReview.state, `Buzz review #${buzzReview.id}: state changed`);
assert.equal(verifiedBuzzReview.commit_id, buzzReview.commitId, `Buzz review #${buzzReview.id}: reviewed commit changed`);

const publicLedger = JSON.parse(
  await githubText("repos/arcabotai/arca-openclaw-contributions/contents/data/openclaw-prs.json?ref=main"),
);
assert.ok(publicLedger.pullRequests?.length >= 9, "OpenClaw public ledger: expected at least 9 Arca-era PRs");
assert.ok(publicLedger.authors?.some((identity) => identity.login === "arcabotai"), "OpenClaw public ledger: arcabotai identity missing");
assert.ok(publicLedger.authors?.some((identity) => identity.login === "felirami" && identity.since === "2026-02-12"), "OpenClaw public ledger: scoped felirami identity missing");
assert.ok(
  publicLedger.pullRequests.some((pr) => pr.number === founderMergedPr.number && pr.author === "felirami" && pr.state === "merged"),
  `OpenClaw public ledger: merged founder PR #${founderMergedPr.number} missing`,
);
assert.ok(
  !publicLedger.pullRequests.some((pr) => [4429, 4432, 4434].includes(pr.number)),
  "OpenClaw public ledger: pre-Arca personal PRs must stay excluded",
);

for (const expected of clickClackMergeCredits) {
  const pr = await github(`repos/openclaw/clickclack/pulls/${expected.number}`);
  assert.ok(pr.merged_at, `ClickClack PR #${expected.number}: expected merged state`);
  assert.equal(pr.merge_commit_sha, expected.mergeCommit, `ClickClack PR #${expected.number}: merge commit changed`);
  assert.equal(pr.user?.login, "steipete", `ClickClack PR #${expected.number}: expected maintainer-authored replacement PR`);
  assert.ok(pr.body?.includes("#78") || pr.body?.includes("pull/78"), `ClickClack PR #${expected.number}: origin PR #78 credit missing`);
  assert.ok(pr.body?.includes("@arcabotai"), `ClickClack PR #${expected.number}: @arcabotai credit missing`);

  const commit = await github(`repos/openclaw/clickclack/commits/${expected.implementationCommit}`);
  assert.ok(
    commit.commit?.message?.includes("Co-authored-by: Cad from Arca <cad@arcabot.ai>"),
    `ClickClack PR #${expected.number}: Cad co-author trailer missing`,
  );
}

const hermesPr = await github(`repos/NousResearch/hermes-agent/pulls/${hermesMergeCredit.number}`);
assert.ok(hermesPr.merged_at, `Hermes Agent PR #${hermesMergeCredit.number}: expected merged state`);
assert.equal(
  hermesPr.merge_commit_sha,
  hermesMergeCredit.mergeCommit,
  `Hermes Agent PR #${hermesMergeCredit.number}: merge commit changed`,
);
assert.equal(hermesPr.user?.login, "teknium1", `Hermes Agent PR #${hermesMergeCredit.number}: expected maintainer-authored merge PR`);
assert.ok(
  hermesPr.body?.includes(`#${hermesMergeCredit.originPullRequest}`) &&
    hermesPr.body?.includes("@arcabotai") &&
    hermesPr.body?.includes("authorship preserved"),
  `Hermes Agent PR #${hermesMergeCredit.number}: origin or preserved-authorship credit missing`,
);
for (const sha of hermesMergeCredit.implementationCommits) {
  const commit = await github(`repos/NousResearch/hermes-agent/commits/${sha}`);
  assert.equal(commit.commit?.author?.name, "Cad from Arca", `Hermes Agent commit ${sha}: Cad author name missing`);
  assert.equal(commit.commit?.author?.email, "cad@arcabot.ai", `Hermes Agent commit ${sha}: Cad author email missing`);
}

for (const expected of clickClackMergeCredits) {
  const clickClackChangelog = await githubText(
    `repos/openclaw/clickclack/contents/CHANGELOG.md?ref=${expected.implementationCommit}`,
  );
  assert.ok(
    clickClackChangelog.includes(expected.changelogText),
    `ClickClack PR #${expected.number}: exact-commit changelog credit missing`,
  );
}

const reviews = await github("repos/farcasterorg/hypersnap/pulls/10/reviews");
const review = reviews.find((item) => item.user?.login === "arcabotai");
assert.ok(review, "Hypersnap PR #10: arcabotai review not found");
assert.equal(review.state, "CHANGES_REQUESTED", "Hypersnap PR #10: expected CHANGES_REQUESTED review");
assert.equal(
  review.html_url,
  "https://github.com/farcasterorg/hypersnap/pull/10#pullrequestreview-4177281968",
  "Hypersnap PR #10: review URL changed",
);

const hypersnapPr = await github("repos/farcasterorg/hypersnap/pulls/10");
assert.ok(hypersnapPr.merged_at, "Hypersnap PR #10: expected merged upstream PR");

const activity = JSON.parse(
  await readFile(new URL("../public/activity.json", import.meta.url), "utf8"),
);
const activityTypes = new Set([
  "upstream_pr_state",
  "upstream_credit",
  "release",
  "project_published",
  "review_submitted",
]);
assert.equal(activity.schemaVersion, 1, "Public activity: unsupported schema version");
assert.equal(activity.cadence, "every 6 hours", "Public activity: cadence changed");
assert.ok(activity.events.length > 0 && activity.events.length <= 200, "Public activity: expected 1-200 bounded events");
assert.equal(new Set(activity.events.map((event) => event.id)).size, activity.events.length, "Public activity: duplicate event IDs");
for (const [index, event] of activity.events.entries()) {
  assert.ok(activityTypes.has(event.type), `Public activity ${event.id}: unsupported type`);
  assert.match(event.url, /^https:\/\/github\.com\//, `Public activity ${event.id}: evidence URL must be public GitHub`);
  assert.ok(!Number.isNaN(Date.parse(event.occurredAt)), `Public activity ${event.id}: invalid timestamp`);
  if (index > 0) {
    assert.ok(
      activity.events[index - 1].occurredAt >= event.occurredAt,
      `Public activity ${event.id}: events are not newest first`,
    );
  }
  if (event.type === "upstream_pr_state") {
    assert.ok(!event.repository.startsWith("arcabotai/"), `Public activity ${event.id}: internal arcabotai PR leaked upstream`);
    assert.ok(!event.repository.startsWith("felirami/"), `Public activity ${event.id}: internal felirami PR leaked upstream`);
    assert.ok(!event.repository.startsWith("arcacomputer/"), `Public activity ${event.id}: internal arcacomputer PR leaked upstream`);
  }
}
assert.ok(
  activity.events.some(
    (event) => event.repository === "openclaw/openclaw" && event.number === 107243 && event.actor === "felirami" && event.state === "merged",
  ),
  "Public activity: merged founder OpenClaw receipt missing",
);
assert.ok(
  activity.events.some(
    (event) => event.repository === "openclaw/crabbox" && event.number === 1192 && event.actor === "arcabotai" && event.state === "merged",
  ),
  "Public activity: merged Crabbox receipt missing",
);
assert.ok(
  activity.events.some(
    (event) => event.repository === "block/buzz" && event.number === 3963 && event.actor === "arcabotai" && event.state === "open",
  ),
  "Public activity: open Buzz PR receipt missing",
);
assert.deepEqual(
  activity.events
    .filter((event) => event.type === "upstream_credit" && event.repository === "openclaw/clickclack")
    .map((event) => event.number)
    .sort((a, b) => a - b),
  [91, 92],
  "Public activity: ClickClack merged credits changed",
);
assert.ok(
  activity.events.some(
    (event) =>
      event.type === "upstream_credit" &&
      event.repository === "NousResearch/hermes-agent" &&
      event.number === hermesMergeCredit.number &&
      event.state === "merged",
  ),
  "Public activity: Hermes Agent merged authorship receipt missing",
);
console.log(
  `Verified ${licensed.length} licensed repositories, at least ${Object.values(elizaMergedBaseline).reduce((sum, count) => sum + count, 0)} merged elizaOS PRs, ` +
    `${slimeVrMergedPrs.length} merged SlimeVR CheeseCake PRs, ${prs.length} sampled OpenClaw PR records, ` +
    `1 merged founder PR, 1 merged Crabbox PR, 1 open Buzz PR, ${publicLedger.pullRequests.length} live ledger records, ` +
    `${activity.events.length} public activity events, ${clickClackMergeCredits.length} merged ClickClack co-author credits, ` +
    `1 merged Hermes Agent authorship receipt, and 2 upstream reviews.`,
);
