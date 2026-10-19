import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { github } from "./update-public-activity.mjs";

const SOURCE = "https://raw.githubusercontent.com/arcabotai/arca-openclaw-contributions/main/data/openclaw-prs.json";
const REPOSITORY = "openclaw/openclaw";
const DEFAULT_SINCE = "2026-02-12";

function isoNow() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** External ledger records can select PR numbers, never request destinations. */
export function candidatePullRequestNumber(record) {
  if (!record || !Number.isSafeInteger(record.number) || record.number < 1) return null;
  const canonicalUrl = `https://github.com/${REPOSITORY}/pull/${record.number}`;
  return record.url === canonicalUrl ? record.number : null;
}

export function normalizeVerifiedLedgerRecord(details, curated, identities) {
  const number = candidatePullRequestNumber(curated);
  if (
    number === null ||
    details?.number !== number ||
    details.html_url !== curated.url ||
    details.base?.repo?.full_name !== REPOSITORY ||
    details.base.repo.private !== false
  ) return null;

  const author = details.user?.login;
  const identity = typeof author === "string"
    ? identities.find((item) => item.login?.toLowerCase() === author.toLowerCase())
    : null;
  if (!identity) return null;
  const since = Date.parse(identity.since || DEFAULT_SINCE);
  if (!(Date.parse(details.created_at) >= since)) return null;
  if (
    !["open", "closed"].includes(details.state) ||
    typeof details.title !== "string" ||
    typeof details.head?.sha !== "string" ||
    !details.head.sha ||
    Number.isNaN(Date.parse(details.updated_at)) ||
    (details.merged_at && Number.isNaN(Date.parse(details.merged_at)))
  ) return null;

  const arca = curated.arca && typeof curated.arca === "object" && !Array.isArray(curated.arca)
    ? Object.fromEntries(
      ["workStatus", "workedOnVersion", "currentWork"]
        .filter((key) => typeof curated.arca[key] === "string")
        .map((key) => [key, curated.arca[key]]),
    )
    : null;
  return {
    number: details.number,
    author,
    identityRole: identity.role,
    title: details.title,
    url: details.html_url,
    state: details.merged_at ? "merged" : details.state,
    draft: Boolean(details.draft),
    createdAt: details.created_at,
    updatedAt: details.updated_at,
    closedAt: details.closed_at || null,
    mergedAt: details.merged_at || null,
    headSha: details.head.sha,
    baseSha: details.base.sha,
    mergeCommit: details.merged_at ? details.merge_commit_sha : null,
    ratingLabel: typeof curated.ratingLabel === "string" ? curated.ratingLabel : null,
    statusLabel: typeof curated.statusLabel === "string" ? curated.statusLabel : null,
    ...(arca ? { arca } : {}),
  };
}

export async function refreshVerifiedLedger(remote, identities, options = {}) {
  if (!Array.isArray(remote?.pullRequests)) throw new Error("OpenClaw ledger has no pullRequests array");
  if (!Array.isArray(identities) || identities.length === 0) throw new Error("No contribution identities configured");
  const getPullRequest = options.github || github;
  const checkedAt = options.checkedAt || isoNow();
  const candidates = new Map();
  for (const record of remote.pullRequests) {
    const number = candidatePullRequestNumber(record);
    if (number !== null) candidates.set(number, record);
  }
  const pullRequests = [];
  for (const [number, curated] of candidates) {
    const details = await getPullRequest(`/repos/${REPOSITORY}/pulls/${number}`);
    const record = normalizeVerifiedLedgerRecord(details, curated, identities);
    if (record) pullRequests.push(record);
  }
  pullRequests.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.number - a.number);
  return {
    generatedAt: checkedAt,
    checkedAt,
    source: typeof remote.source === "string" ? remote.source : SOURCE,
    ...(typeof remote.generatedAt === "string" ? { upstreamGeneratedAt: remote.generatedAt } : {}),
    authors: identities.map(({ login, role, since }) => ({ login, role, since: since || DEFAULT_SINCE })),
    pullRequests,
  };
}

export async function main() {
  const index = JSON.parse(await readFile(new URL("../public/oss.json", import.meta.url), "utf8"));
  const response = await fetch(SOURCE, { headers: { "User-Agent": "arcacomputer-oss-refresh" } });
  if (!response.ok) throw new Error(`OpenClaw ledger returned ${response.status}`);
  const ledger = await refreshVerifiedLedger(await response.json(), index.contributionIdentities);
  await writeFile(new URL("../public/openclaw-prs.json", import.meta.url), `${JSON.stringify(ledger, null, 2)}\n`);
  console.log(`Verified ${ledger.pullRequests.length} OpenClaw PR records against GitHub at ${ledger.checkedAt}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
