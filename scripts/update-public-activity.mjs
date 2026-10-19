import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INDEX_PATH = path.join(ROOT, "public", "oss.json");
const OUTPUT_PATH = path.join(ROOT, "public", "activity.json");
const API = "https://api.github.com";
const DEFAULT_SINCE = "2026-02-12";
const SEARCH_PAGE_SIZE = 100;
const MAX_SEARCH_RESULTS = 1000;

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

export async function github(pathname, params = {}, options = {}) {
  const url = new URL(`${API}${pathname}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));

  const fetchImpl = options.fetchImpl || fetch;
  const sleep = options.sleep || ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  const maxAttempts = options.maxAttempts || 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetchImpl(url, { headers: githubHeaders() });
    if (response.ok) return response.json();

    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === maxAttempts) {
      throw new Error(`${url.pathname}: GitHub returned ${response.status} after ${attempt} attempt(s)`);
    }

    const retryAfter = Number(response.headers.get("retry-after"));
    const delay = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : 1000 * 2 ** (attempt - 1);
    await sleep(delay);
  }

  throw new Error(`${url.pathname}: GitHub request exhausted retries`);
}

export function buildPullRequestQuery(identity, ownedLogins) {
  const since = identity.since || DEFAULT_SINCE;
  const exclusions = [...ownedLogins].map((login) => `-user:${login}`).join(" ");
  return `is:pr is:public author:${identity.login} created:>=${since} ${exclusions}`.trim();
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
    createdAt: details.created_at,
    updatedAt: details.updated_at || details.created_at,
    actor: details.user.login,
    role: "author",
    state,
    evidence: {
      author: details.user.login,
      headSha: details.head.sha,
      // GitHub exposes a synthetic, mutable test-merge SHA for open PRs.
      // It is not an immutable receipt and was causing pointless feed churn.
      mergeCommit: details.merged_at ? details.merge_commit_sha : null,
    },
  };
}

export function mergeEvents(currentEvents, previousEvents = []) {
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
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || a.id.localeCompare(b.id));
}

export function payloadFor(events, previous = null, checkedAt = isoNow(), options = {}) {
  const source = options.source ?? previous?.source;
  const stable = { schemaVersion: 1, ...(source ? { source } : {}), events };
  const previousStable = previous
    ? { schemaVersion: previous.schemaVersion, ...(previous.source ? { source: previous.source } : {}), events: previous.events }
    : null;
  const unchanged = previousStable && JSON.stringify(previousStable) === JSON.stringify(stable);
  return {
    schemaVersion: 1,
    generatedAt: unchanged ? previous.generatedAt : checkedAt,
    checkedAt,
    cadence: "every 6 hours",
    ...(source ? { source } : {}),
    events,
  };
}

function parsePullRequestUrl(url) {
  const match = new URL(url).pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) throw new Error(`Unsupported pull-request URL: ${url}`);
  return { repository: `${match[1]}/${match[2]}`, number: Number(match[3]) };
}

function identitiesByLogin(index) {
  return new Map((index.contributionIdentities || []).map((identity) => [identity.login.toLowerCase(), identity]));
}

function withinIdentityPeriod(value, identity) {
  const timestamp = Date.parse(value);
  const since = Date.parse(identity.since || DEFAULT_SINCE);
  if (!Number.isFinite(timestamp) || !Number.isFinite(since)) {
    throw new Error(`${identity.login}: invalid contribution date or cutoff`);
  }
  return timestamp >= since;
}

export async function collectPullRequests(index, repoCache = new Map(), options = {}) {
  const githubImpl = options.githubImpl || github;
  const identities = index.contributionIdentities || [];
  const knownIdentities = identitiesByLogin(index);
  const ownedLogins = new Set([
    ...identities.map((identity) => identity.login.toLowerCase()),
    ...(index.ownedRepositoryOwners || []).map((login) => login.toLowerCase()),
  ]);
  const candidates = new Map();

  for (const identity of identities) {
    const query = buildPullRequestQuery(identity, ownedLogins);
    const seen = new Set();
    let totalCount = 0;
    for (let page = 1; page === 1 || page <= Math.ceil(totalCount / SEARCH_PAGE_SIZE); page += 1) {
      const result = await githubImpl("/search/issues", {
        q: query,
        per_page: SEARCH_PAGE_SIZE,
        page,
        sort: "created",
        order: "desc",
      });
      if (result.incomplete_results) throw new Error(`${identity.login}: GitHub returned incomplete PR search results`);
      if (!Number.isInteger(result.total_count) || result.total_count < 0 || !Array.isArray(result.items)) {
        throw new Error(`${identity.login}: invalid PR search response`);
      }
      totalCount = Math.max(totalCount, result.total_count);
      if (totalCount > MAX_SEARCH_RESULTS) {
        throw new Error(`${identity.login}: ${totalCount} PRs exceed GitHub's ${MAX_SEARCH_RESULTS}-result search limit; partition the search before refreshing`);
      }
      for (const item of result.items) {
        const repository = item.repository_url?.split("/repos/")[1];
        if (!repository || !Number.isInteger(item.number)) throw new Error(`${identity.login}: invalid PR search item`);
        const key = `${repository.toLowerCase()}#${item.number}`;
        seen.add(key);
        if (isInternalRepository(repository, ownedLogins)) continue;
        const existing = candidates.get(key);
        if (existing && existing.identity.login.toLowerCase() !== identity.login.toLowerCase()) {
          throw new Error(`${repository}#${item.number}: GitHub returned the same PR for different authors`);
        }
        candidates.set(key, { repository, number: item.number, identity });
      }
    }
    if (seen.size < totalCount) throw new Error(`${identity.login}: PR search returned ${seen.size} of ${totalCount} results`);
  }

  // Curated receipts supplement search indexing, but never expand the account or date scope.
  for (const project of index.supportedProjects || []) {
    for (const expected of project.pullRequests || []) {
      const identity = knownIdentities.get(expected.author?.toLowerCase());
      if (!identity) continue;
      const knownDate = expected.createdAt || expected.created_at || expected.mergedAt;
      if (knownDate && !withinIdentityPeriod(knownDate, identity)) continue;
      const { repository, number } = parsePullRequestUrl(expected.url);
      if (isInternalRepository(repository, ownedLogins)) continue;
      const key = `${repository.toLowerCase()}#${number}`;
      if (!candidates.has(key)) candidates.set(key, { repository, number, identity });
    }
  }

  const events = [];
  for (const candidate of candidates.values()) {
    let repo = repoCache.get(candidate.repository);
    if (!repo) {
      repo = await githubImpl(`/repos/${candidate.repository}`);
      repoCache.set(candidate.repository, repo);
    }
    if (repo.private !== false) continue;
    const details = await githubImpl(`/repos/${candidate.repository}/pulls/${candidate.number}`);
    const author = details.user?.login?.toLowerCase();
    if (!knownIdentities.has(author) || author !== candidate.identity.login.toLowerCase()) {
      throw new Error(`${candidate.repository}#${candidate.number}: PR author does not match @${candidate.identity.login}`);
    }
    if (!withinIdentityPeriod(details.created_at, candidate.identity)) continue;
    if (details.base.repo.private || isInternalRepository(details.base.repo.full_name, ownedLogins)) continue;
    events.push(normalizePullRequest(details));
  }
  return events;
}

export async function collectCredits(index, options = {}) {
  const githubImpl = options.githubImpl || github;
  const identities = identitiesByLogin(index);
  const events = [];
  for (const credit of index.mergedUpstreamCredits || []) {
    const actor = credit.actor || "arcabotai";
    const identity = identities.get(actor.toLowerCase());
    if (!identity) throw new Error(`${credit.url}: credit actor is not a tracked account`);
    if (!withinIdentityPeriod(credit.mergedAt, identity)) continue;
    const { repository, number } = parsePullRequestUrl(credit.url);
    const details = await githubImpl(`/repos/${repository}/pulls/${number}`);
    if (!details.merged_at) throw new Error(`${credit.url}: expected merged upstream credit`);
    if (details.base.repo.private !== false || !withinIdentityPeriod(details.merged_at, identity)) continue;
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
      occurredAt: details.merged_at,
      actor,
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

export async function collectReviews(index, options = {}) {
  const githubImpl = options.githubImpl || github;
  const identities = identitiesByLogin(index);
  const events = [];
  for (const project of index.supportedProjects || []) {
    for (const expected of project.reviews || []) {
      const { repository, number } = parsePullRequestUrl(expected.url);
      const [details, reviews] = await Promise.all([
        githubImpl(`/repos/${repository}/pulls/${number}`),
        githubImpl(`/repos/${repository}/pulls/${number}/reviews`, { per_page: 100 }),
      ]);
      const review = reviews.find((item) => item.html_url === expected.url);
      if (!review) throw new Error(`${expected.url}: public review not found`);
      const identity = identities.get(review.user?.login?.toLowerCase());
      if (!identity) throw new Error(`${expected.url}: review author is not a tracked account`);
      if (details.base.repo.private !== false || !withinIdentityPeriod(review.submitted_at, identity)) continue;
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
  const payload = payloadFor(events, previous, isoNow(), {
    source: {
      identities: (index.contributionIdentities || []).map(({ login, since, role }) => ({
        login,
        since: since || DEFAULT_SINCE,
        role,
      })),
      ownedRepositoryOwners: index.ownedRepositoryOwners || [],
      ...(index.organization ? { organization: index.organization } : {}),
    },
  });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`checked ${events.length} public activity events at ${payload.checkedAt}; content updated at ${payload.generatedAt}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
