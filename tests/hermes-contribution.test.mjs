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
  assert.equal(pr.releaseStatus, "unverified");
  assert.deepEqual(hermes.mergedCredits, ["https://github.com/NousResearch/hermes-agent/pull/76400"]);

  const activity = JSON.parse(await read("../public/activity.json"));
  const receipts = activity.events.filter((event) => event.url === url && event.state === "merged");
  assert.equal(receipts.length, 1, "derived merged-PR total must count this contribution once");
  assert.equal(receipts[0].type, "upstream_pr_state");
  assert.equal(receipts[0].evidence.mergeCommit, pr.mergeCommit);
  assert.equal(receipts[0].occurredAt, pr.mergedAt);

  const pageData = await read("../lib/data.ts");
  assert.ok(pageData.includes(url));
  assert.ok(pageData.includes("Release inclusion is unverified."));
  assert.ok(pageData.includes("without exposing the one-time authentication URL"));
});
