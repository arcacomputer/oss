import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INDEX_PATH = path.join(ROOT, "public", "oss.json");
const OUTPUT_PATH = path.join(ROOT, "public", "activity.json");
const API = "https://api.github.com";
const DEFAULT_SINCE = "2026-02-12";
const MAX_SEARCH_RESULTS = 100;
const MAX_EVENTS = 200;

function isoNow() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

async function readJson(file, fallback = null) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return fallback;
    throw error;
  }
}

function githubHeaders(accept = "application/vnd.github+json") {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  return {
    Accept: accept,
    "User-Agent": "arca-oss-public-activity",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function github(pathname, params = {}) {
  const url = new URL(`${API}${pathname}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  const response = await fetch(url, { headers: githubHeaders() });
  if (!response.ok) throw new Error(`${url.pathname}: GitHub returned ${response.status}`);
  return response.json();
}

export function buildPullRequestQuery(identity, ownedLogins) {
  const since = identity.since || DEFAULT_SINCE;
  const exclusions = [...ownedLogins].map((login) => `-user:${login}`).join(" ");
  return `is:pr author:${identity.login} created:>=${since} ${exclusions}`.trim();
}

export function isInternalRepository(repository, ownedLogins) {
  const owner = repository.split("/")[0]?.toLowerCase();
  return ownedLogins.has(owner);
}

export function normalizePullRequest(details) {
  const repository = details.base.repo.full_name;
  const state = details.merged_at ? "merged" : details.state;
  const occurredAt = details.merged_at || details.closed_at || details.created_at;
  return {
    id: `github:pr:${repository}:${details.number}:${state}`,
    type: "upstream_pr_state",
    project: details.base.repo.name,
    repository,
    number: details.number,
    title: details.title,
    summary:
      state === "merged"
        ? "Merged upstream"
        : state === "closed"
          ? "Closed upstream without merge"
          : "Opened upstream",
    url: details.html_url,
    occurredAt,
    actor: details.user.login,
    role: "author",
    state,
    evidence: {
      headSha: details.head.sha,
      // GitHub exposes a synthetic, mutable test-merge SHA for open PRs.
      // It is not an immutable receipt and was causing pointless feed churn.
      mergeCommit: details.merged_at ? details.merge_commit_sha : null,
    },
  };
}

export function mergeEvents(currentEvents, previousEvents = [], maxEvents = MAX_EVENTS) {
  const currentPrKeys = new Set(
    currentEvents
      .filter((event) => event.type === "upstream_pr_state")
      .map((event) => `${event.repository}#${event.number}`),
  );
  const preservedTransitions = previousEvents.filter(
    (event) =>
      event.type === "upstream_pr_state" &&
      currentPrKeys.has(`${event.repository}#${event.number}`),
  );
  const byId = new Map();
  for (const event of [...preservedTransitions, ...currentEvents]) {
    const stableEvent =
      event.type === "upstream_pr_state" && event.state !== "merged"
        ? { ...event, evidence: { ...event.evidence, mergeCommit: null } }
        : event;
    byId.set(stableEvent.id, stableEvent);
  }
  return [...byId.values()]
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || a.id.localeCompare(b.id))
    .slice(0, maxEvents);
}

export function payloadFor(events, previous = null, generatedAt = isoNow()) {
  const stable = { schemaVersion: 1, events };
  const previousStable = previous
    ? { schemaVersion: previous.schemaVersion, events: previous.events }
    : null;
  const unchanged = previousStable && JSON.stringify(previousStable) === JSON.stringify(stable);
  return {
    schemaVersion: 1,
    generatedAt: unchanged ? previous.generatedAt : generatedAt,
    cadence: "every 6 hours",
    events,
  };
}

function parsePullRequestUrl(url) {
  const match = new URL(url).pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) throw new Error(`Unsupported pull-request URL: ${url}`);
  return { repository: `${match[1]}/${match[2]}`, number: Number(match[3]) };
}

async function collectPullRequests(index, repoCache) {
  const identities = index.contributionIdentities || [];
  const ownedLogins = new Set([
    ...identities.map((identity) => identity.login.toLowerCase()),
    ...(index.ownedRepositoryOwners || []).map((login) => login.toLowerCase()),
  ]);
  const candidates = new Map();

  for (const identity of identities) {
    const query = buildPullRequestQuery(identity, ownedLogins);
    const result = await github("/search/issues", {
      q: query,
      per_page: MAX_SEARCH_RESULTS,
      sort: "created",
      order: "desc",
    });
    if (result.total_count > MAX_SEARCH_RESULTS) {
      throw new Error(`${identity.login}: ${result.total_count} PRs exceed the bounded search limit`);
    }
    for (const item of result.items) {
      const repository = item.repository_url.split("/repos/")[1];
      if (!repository || isInternalRepository(repository, ownedLogins)) continue;
      candidates.set(`${repository}#${item.number}`, { repository, number: item.number });
    }
  }

  const events = [];
  for (const candidate of candidates.values()) {
    let repo = repoCache.get(candidate.repository);
    if (!repo) {
      repo = await github(`/repos/${candidate.repository}`);
      repoCache.set(candidate.repository, repo);
    }
    if (repo.private) continue;
    const details = await github(`/repos/${candidate.repository}/pulls/${candidate.number}`);
    events.push(normalizePullRequest(details));
  }
  return events;
}

async function collectCredits(index) {
  const events = [];
  for (const credit of index.mergedUpstreamCredits || []) {
    const { repository, number } = parsePullRequestUrl(credit.url);
    const details = await github(`/repos/${repository}/pulls/${number}`);
    if (!details.merged_at) throw new Error(`${credit.url}: expected merged upstream credit`);
    if (details.merge_commit_sha !== credit.mergeCommit) {
      throw new Error(`${credit.url}: merge commit no longer matches the curated receipt`);
    }
    events.push({
      id: `github:credit:${repository}:${number}:${credit.credit}`,
      type: "upstream_credit",
      project: credit.project,
      repository,
      number,
      title: details.title,
      summary:
        credit.credit === "commit author"
          ? "Merged upstream with Cad authorship preserved"
          : "Merged with public Arca co-author credit",
      url: credit.url,
      occurredAt: credit.mergedAt,
      actor: "arcabotai",
      role: credit.credit,
      state: "merged",
      evidence: {
        implementationCommit: credit.implementationCommit,
        additionalImplementationCommits: credit.additionalImplementationCommits || [],
        mergeCommit: credit.mergeCommit,
      },
    });
  }
  return events;
}

async function collectReviews(index) {
  const events = [];
  for (const project of index.supportedProjects || []) {
    for (const expected of project.reviews || []) {
      const { repository, number } = parsePullRequestUrl(expected.url);
      const [details, reviews] = await Promise.all([
        github(`/repos/${repository}/pulls/${number}`),
        github(`/repos/${repository}/pulls/${number}/reviews`, { per_page: 100 }),
      ]);
      const review = reviews.find((item) => item.html_url === expected.url);
      if (!review) throw new Error(`${expected.url}: public review not found`);
      if (review.state !== expected.state) throw new Error(`${expected.url}: review state changed`);
      events.push({
        id: `github:review:${repository}:${number}:${review.id}`,
        type: "review_submitted",
        project: project.name,
        repository,
        number,
        title: details.title,
        summary: `Submitted ${review.state.toLowerCase().replaceAll("_", " ")} review`,
        url: review.html_url,
        occurredAt: review.submitted_at,
        actor: review.user.login,
        role: "reviewer",
        state: review.state.toLowerCase(),
        evidence: { reviewId: review.id, commitId: review.commit_id },
      });
    }
  }
  return events;
}

async function collectReleases(index, repoCache) {
  const events = [];
  for (const project of index.projects || []) {
    const match = new URL(project.repository).pathname.match(/^\/([^/]+\/[^/]+)$/);
    if (!match) throw new Error(`Unsupported repository URL: ${project.repository}`);
    const repository = match[1];
    let repo = repoCache.get(repository);
    if (!repo) {
      repo = await github(`/repos/${repository}`);
      repoCache.set(repository, repo);
    }
    if (repo.private) continue;
    const releases = await github(`/repos/${repository}/releases`, { per_page: 10 });
    for (const release of releases.filter((item) => !item.draft && item.published_at >= DEFAULT_SINCE)) {
      events.push({
        id: `github:release:${repository}:${release.id}`,
        type: "release",
        project: project.name,
        repository,
        number: null,
        title: release.name || release.tag_name,
        summary: `Published ${release.tag_name}`,
        url: release.html_url,
        occurredAt: release.published_at,
        actor: release.author.login,
        role: "publisher",
        state: release.prerelease ? "prerelease" : "released",
        evidence: { releaseId: release.id, tag: release.tag_name },
      });
    }
  }
  return events;
}

export async function main() {
  const index = await readJson(INDEX_PATH);
  const previous = await readJson(OUTPUT_PATH, null);
  const repoCache = new Map();
  const groups = await Promise.all([
    collectPullRequests(index, repoCache),
    collectCredits(index),
    collectReviews(index),
    collectReleases(index, repoCache),
  ]);
  const events = mergeEvents(groups.flat(), previous?.events || []);
  const payload = payloadFor(events, previous);
  await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`updated ${events.length} public activity events at ${payload.generatedAt}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
