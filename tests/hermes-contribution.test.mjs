import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("Hermes Tailscale contribution preserves authored, credited, and release boundaries", async () => {
  const index = JSON.parse(await read("../public/oss.json"));
  const hermes = index.supportedProjects.find((item) => item.name === "Hermes Agent");
  const url = "https://github.com/NousResearch/hermes-agent/pull/97871";
  const pr = hermes.pullRequests.find((item) => item.url === url);
  assert.equal(pr.state, "merged");
  assert.equal(pr.author, "arcabotai");
  assert.equal(pr.mergedAt, "2026-09-29T02:32:26Z");
  assert.equal(pr.mergedBy, "OutThisLife");
  assert.equal(pr.mergeCommit, "e4956f5a122bef41d26724f85399a57f6834ed6a");
  assert.equal(pr.releaseStatus, "source-tag-verified");
  assert.deepEqual(hermes.sourceRelease, {
    tag: "v0.21.6",
    commit: "818c13be1dc4fd28987e1e881a9408224afd4535",
    url: "https://github.com/NousResearch/hermes-agent/releases/tag/v0.21.6",
    mergeCommits: [
      "e4956f5a122bef41d26724f85399a57f6834ed6a",
      "8b8ebc26bb5a433c1975615c7c8e4a0182d94f36",
    ],
    binaryReleaseStatus: "unverified",
  });
  assert.deepEqual(hermes.mergedCredits, [76400, 139854, 140249, 140984].map(number => `https://github.com/NousResearch/hermes-agent/pull/${number}`));
  assert.ok(!hermes.sourceRelease.mergeCommits.includes("837213a0548ea5088dda4499c8adb090f9be63b6"), "later incorporation is not retroactively part of v0.21.6");

  const activity = JSON.parse(await read("../public/activity.json"));
  const receipts = activity.events.filter((event) => event.url === url && event.state === "merged");
  assert.equal(receipts.length, 1, "derived merged-PR total must count this contribution once");
  assert.equal(receipts[0].type, "upstream_pr_state");
  assert.equal(receipts[0].evidence.mergeCommit, pr.mergeCommit);
  assert.equal(receipts[0].occurredAt, pr.mergedAt);

  const pageData = await read("../lib/data.ts");
  assert.ok(pageData.includes(url));
  assert.ok(pageData.includes("Both contributions are included in the v0.21.6 source tag"));
  assert.ok(pageData.includes("packaged Desktop binary inclusion is unverified"));
  assert.ok(pageData.includes("without exposing the one-time authentication URL"));
});
