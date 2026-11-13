import assert from "node:assert/strict";
import test from "node:test";
import * as model from "../lib/contribution-explorer.mjs";

test("query state tolerates malformed and unknown values without losing Unicode search", () => {
  assert.equal(typeof model.readExplorerState, "function");
  const records = [{ project: "org/repo" }];
  assert.deepEqual(model.readExplorerState("?ce-q=%E0%A4%A&ce-project=unknown&ce-outcome=approved&ce-role=admin", records),
    { q: "�%A", project: "all", outcome: "all", role: "all" });
  assert.deepEqual(model.readExplorerState("?ce-q=%20Caf%C3%A9%20&ce-project=org%2Frepo&ce-outcome=credited&ce-role=credited&ce-q=ignored", records),
    { q: " Café ", project: "org/repo", outcome: "credited", role: "credited" });
  assert.deepEqual(model.readExplorerState("", records), { q: "", project: "all", outcome: "all", role: "all" });
});

test("share URLs round-trip filters and reset without dropping preview flags or anchors", () => {
  assert.equal(typeof model.explorerUrl, "function");
  const base = "https://preview.example/?preview=1&tag=a&tag=b&ce-q=old&ce-q=duplicate#past-work";
  const state = { q: "Café & runtime", project: "org/repo", outcome: "incorporated", role: "author" };
  const link = model.explorerUrl(base, state);
  assert.deepEqual(model.readExplorerState(new URL(link, base).search, [{ project: "org/repo" }]), state);
  assert.deepEqual(new URL(link, base).searchParams.getAll("tag"), ["a", "b"]);
  assert.equal(new URL(link, base).searchParams.get("preview"), "1");
  assert.equal(new URL(link, base).hash, "#past-work");
  assert.equal(model.explorerUrl(base, model.emptyExplorerState), "/?preview=1&tag=a&tag=b#past-work");
});

const event = (id, extra = {}) => ({ id, title: `Receipt ${id}`, number: id,
  actor: "arcabotai", role: "author", state: "closed", type: "upstream_pr_state",
  url: `https://github.com/org/repo/pull/${id}`, ...extra });
const events = [event("merged", { state: "merged" }),
  event("credit", { state: "merged", type: "upstream_credit", role: "co-author" }),
  event("review", { type: "review_submitted", state: "approved", role: "reviewer" }),
  event("incorporated", { contributionOutcome: { kind: "incorporated" } }),
  event("partial", { contributionOutcome: { kind: "partially_incorporated" } }),
  event("manual", { type: "upstream_manual_integration", state: "integrated" }),
  event("closed"), event("open", { state: "open" })];
const project = { repository: "org/repo", name: "Repo", description: "Runtime reliability",
  allReceipts: events, mergedItems: [events[0]], creditItems: [events[1]],
  reviewedItems: [events[2]], incorporatedItems: [events[3], events[4]],
  manualItems: [events[5]], closedItems: [events[6]] };

test("evidence hrefs only allow credential-free HTTPS GitHub receipts", () => {
  assert.equal(typeof model.safeEvidenceUrl, "function");
  const valid = "https://github.com/org/repo/pull/1#pullrequestreview-3";
  assert.equal(model.safeEvidenceUrl(valid), valid);
  for (const value of ["javascript:alert(1)", "//evil.test", "/local", "https://github.com.evil.test/x", "https://user:pass@github.com/o/r", "http://github.com/o/r", "not a url"]) {
    assert.equal(model.safeEvidenceUrl(value), undefined);
  }
});

test("filters intersect record-level project, outcome, role and case-insensitive search", () => {
  assert.equal(typeof model.filterExplorerRecords, "function");
  const records = model.projectExplorerRecords([project]);
  const filter = (extra) => model.filterExplorerRecords(records, { ...model.emptyExplorerState, ...extra }).map(r => r.id);
  assert.deepEqual(filter({ outcome: "merged" }), ["merged"]);
  assert.deepEqual(filter({ outcome: "closed" }), ["closed"]);
  assert.deepEqual(filter({ outcome: "incorporated" }), ["incorporated"]);
  assert.deepEqual(filter({ role: "credited" }), ["credit"]);
  assert.deepEqual(filter({ role: "reviewer", outcome: "merged" }), []);
  assert.deepEqual(filter({ q: " RUNTIME RELIABILITY ", role: "reviewer", project: "org/repo" }), ["review"]);
  assert.deepEqual(filter({ q: "#merged" }), ["merged"]);
  assert.deepEqual(filter({ project: "other/repo" }), []);
  assert.deepEqual(filter({ q: "[.*" }), []);
  assert.equal(filter({ q: "   " }).length, 7);
});

test("projects normalized history without upgrading states or counting open work", () => {
  const before = structuredClone(project);
  const records = model.projectExplorerRecords([project]);
  assert.deepEqual(records.map(r => [r.id, r.outcome, r.role]), [
    ["merged", "merged", "author"], ["credit", "credited", "credited"],
    ["review", "reviewed", "reviewer"], ["incorporated", "incorporated", "author"],
    ["partial", "partially-incorporated", "author"], ["manual", "integrated", "author"],
    ["closed", "closed", "author"],
  ]);
  assert.equal(records.length, 7, "records, not a count of accepted contributions");
  assert.deepEqual(project, before);
});
