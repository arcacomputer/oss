import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPullRequestQuery,
  collectCredits,
  collectPullRequests,
  collectReviews,
  github,
  isInternalRepository,
  mergeEvents,
  normalizePullRequest,
  payloadFor,
} from "./update-public-activity.mjs";

test("GitHub requests retry transient server failures", async () => {
  const statuses = [500, 502, 200];
  let attempts = 0;
  const result = await github("/repos/huggingface/tokenizers/pulls/2342", {}, {
    fetchImpl: async () => {
      const status = statuses[attempts++];
      return {
        ok: status === 200,
        status,
        headers: { get: () => null },
        json: async () => ({ number: 2342 }),
      };
    },
    sleep: async () => {},
  });

  assert.equal(attempts, 3);
  assert.deepEqual(result, { number: 2342 });
});

test("GitHub requests do not retry permanent client failures", async () => {
  let attempts = 0;
  await assert.rejects(
    github("/repos/example/missing", {}, {
      fetchImpl: async () => {
        attempts += 1;
        return {
          ok: false,
          status: 404,
          headers: { get: () => null },
        };
      },
      sleep: async () => {},
    }),
    /GitHub returned 404/,
  );
  assert.equal(attempts, 1);
});

const pull = {
  number: 107243,
  title: "preserve canonical cache rows",
  html_url: "https://github.com/openclaw/openclaw/pull/107243",
  state: "closed",
  created_at: "2026-07-14T01:00:00Z",
  updated_at: "2026-07-14T16:40:36Z",
  closed_at: "2026-07-14T16:40:36Z",
  merged_at: "2026-07-14T16:40:36Z",
  merge_commit_sha: "c1191cdf",
  user: { login: "felirami" },
  head: { sha: "e35ddb3c" },
  base: { repo: { full_name: "openclaw/openclaw", name: "openclaw", private: false } },
};

test("search query excludes owned repository namespaces before pagination", () => {
  const query = buildPullRequestQuery(
    { login: "felirami", since: "2026-02-12" },
    new Set(["arcabotai", "felirami", "arcacomputer"]),
  );
  assert.match(query, /author:felirami/);
  assert.match(query, /created:>=2026-02-12/);
  assert.match(query, /-user:arcabotai/);
  assert.match(query, /-user:felirami/);
  assert.match(query, /-user:arcacomputer/);
});

test("internal repositories are excluded by owner", () => {
  const owners = new Set(["arcabotai", "felirami", "arcacomputer"]);
  assert.equal(isInternalRepository("arcabotai/oss", owners), true);
  assert.equal(isInternalRepository("felirami/castaway", owners), true);
  assert.equal(isInternalRepository("arcacomputer/hypersnapweb", owners), true);
  assert.equal(isInternalRepository("openclaw/openclaw", owners), false);
});

test("merged PRs keep exact upstream state and receipt", () => {
  const event = normalizePullRequest(pull);
  assert.equal(event.id, "github:pr:openclaw/openclaw:107243:merged");
  assert.equal(event.actor, "felirami");
  assert.equal(event.state, "merged");
  assert.equal(event.occurredAt, pull.merged_at);
  assert.equal(event.evidence.headSha, pull.head.sha);
  assert.equal(event.evidence.mergeCommit, pull.merge_commit_sha);
  assert.equal(event.evidence.author, "felirami");
  assert.equal(event.createdAt, pull.created_at);
  assert.equal(event.updatedAt, pull.updated_at);
});

test("open PRs ignore GitHub's mutable synthetic merge commit", () => {
  const event = normalizePullRequest({
    ...pull,
    state: "open",
    closed_at: null,
    merged_at: null,
    merge_commit_sha: "mutable-test-merge",
  });
  assert.equal(event.state, "open");
  assert.equal(event.evidence.mergeCommit, null);
});

test("prior state transitions remain visible for monitored PRs", () => {
  const merged = normalizePullRequest(pull);
  const opened = {
    ...merged,
    id: "github:pr:openclaw/openclaw:107243:open",
    state: "open",
    occurredAt: pull.created_at,
    evidence: { ...merged.evidence, mergeCommit: "old-synthetic-merge" },
  };
  const result = mergeEvents([merged], [opened]);
  assert.deepEqual(result.map((event) => event.state), ["merged", "open"]);
  assert.equal(result[1].evidence.mergeCommit, null);
});

test("the public feed retains all receipts and transitions beyond two hundred events", () => {
  const events = Array.from({ length: 250 }, (_, index) => ({
    ...normalizePullRequest(pull),
    id: `receipt-${index}`,
    number: index,
    occurredAt: `2026-07-${String((index % 28) + 1).padStart(2, "0")}T00:00:00Z`,
  }));
  const oldTransition = {
    ...events[0],
    id: "earlier-state",
    state: "open",
    occurredAt: "2026-02-12T00:00:00Z",
  };
  const stale = { ...oldTransition, id: "no-longer-monitored", number: 9999 };
  const result = mergeEvents(events, [oldTransition, stale]);
  assert.equal(result.length, 251);
  assert.ok(result.some((event) => event.id === oldTransition.id));
  assert.ok(!result.some((event) => event.id === stale.id));
});

test("generatedAt changes only when public event content changes", () => {
  const event = normalizePullRequest(pull);
  const previous = {
    schemaVersion: 1,
    generatedAt: "2026-07-17T00:00:00Z",
    events: [event],
  };
  assert.equal(payloadFor([event], previous, "2026-07-18T00:00:00Z").generatedAt, previous.generatedAt);
  assert.equal(payloadFor([event], previous, "2026-07-18T00:00:00Z").checkedAt, "2026-07-18T00:00:00Z");
  assert.equal(
    payloadFor([{ ...event, title: "changed" }], previous, "2026-07-18T00:00:00Z").generatedAt,
    "2026-07-18T00:00:00Z",
  );
});

const index = {
  contributionIdentities: [
    { login: "felirami", since: "2026-02-12", role: "Arca founder" },
    { login: "arcabotai", since: "2026-02-12", role: "Arca agent identity" },
  ],
  ownedRepositoryOwners: ["felirami", "arcabotai", "arcacomputer"],
};

function searchItem(number) {
  return { number, repository_url: "https://api.github.com/repos/openclaw/openclaw" };
}

function searchResult(items = [], totalCount = items.length) {
  return { items, total_count: totalCount, incomplete_results: false };
}

test("authored PR collection paginates every account without treating owned organizations as authors", async () => {
  const searches = [];
  let repositoryRequests = 0;
  const events = await collectPullRequests(index, new Map(), {
    githubImpl: async (pathname, params) => {
      if (pathname === "/search/issues") {
        searches.push(params);
        if (params.q.includes("author:arcabotai")) return searchResult();
        return searchResult(
          Array.from({ length: params.page === 1 ? 100 : 1 }, (_, offset) => searchItem((params.page - 1) * 100 + offset + 1)),
          101,
        );
      }
      if (pathname === "/repos/openclaw/openclaw") {
        repositoryRequests += 1;
        return { private: false };
      }
      const number = Number(pathname.split("/").at(-1));
      return { ...pull, number, html_url: `https://github.com/openclaw/openclaw/pull/${number}` };
    },
  });
  assert.equal(events.length, 101);
  assert.equal(repositoryRequests, 1);
  assert.deepEqual(searches.map(({ page }) => page), [1, 2, 1]);
  assert.ok(searches.every(({ per_page, q }) => per_page === 100 && !q.includes("author:arcacomputer")));
});

test("authored PR collection fails instead of publishing incomplete or capped searches", async () => {
  for (const [response, expectedError] of [
    [{ ...searchResult(), incomplete_results: true }, /incomplete PR search results/],
    [searchResult([], 1001), /1000-result search limit/],
    [searchResult([], 1), /returned 0 of 1 results/],
  ]) {
    await assert.rejects(collectPullRequests(index, new Map(), {
      githubImpl: async () => response,
    }), expectedError);
  }
});

test("PR detail authors must match the searched account even if another tracked account authored it", async () => {
  for (const login of ["arcabotai", "someone-else", "arcacomputer"]) {
    await assert.rejects(collectPullRequests(index, new Map(), {
      githubImpl: async (pathname, params) => {
        if (pathname === "/search/issues") return searchResult(params.q.includes("author:felirami") ? [searchItem(1)] : []);
        if (pathname === "/repos/openclaw/openclaw") return { private: false };
        return { ...pull, user: { login } };
      },
    }), /PR author does not match @felirami/);
  }
});

test("private targets and PRs created before the account cutoff are excluded", async () => {
  for (const isPrivate of [true, false]) {
    let detailRequests = 0;
    const events = await collectPullRequests(index, new Map(), {
      githubImpl: async (pathname, params) => {
        if (pathname === "/search/issues") return searchResult(params.q.includes("author:felirami") ? [searchItem(1)] : []);
        if (pathname === "/repos/openclaw/openclaw") return { private: isPrivate };
        detailRequests += 1;
        return { ...pull, created_at: "2026-02-11T23:59:59Z" };
      },
    });
    assert.deepEqual(events, []);
    assert.equal(detailRequests, isPrivate ? 0 : 1);
  }
});

test("curated PR receipts supplement search only for tracked authors within the same cutoff", async () => {
  const requested = [];
  const curatedIndex = {
    ...index,
    supportedProjects: [{ pullRequests: [
      { url: "https://github.com/openclaw/openclaw/pull/1", author: "felirami" },
      { url: "https://github.com/openclaw/openclaw/pull/2", author: "felirami", mergedAt: "2023-12-11T22:30:48Z" },
      { url: "https://github.com/openclaw/openclaw/pull/3", author: "arcacomputer" },
      { url: "https://github.com/openclaw/openclaw/pull/4" },
      { url: "https://github.com/openclaw/openclaw/pull/5", author: "arcabotai" },
    ] }],
  };
  const events = await collectPullRequests(curatedIndex, new Map(), {
    githubImpl: async (pathname) => {
      if (pathname === "/search/issues") return searchResult();
      if (pathname === "/repos/openclaw/openclaw") return { private: false };
      requested.push(pathname);
      const number = Number(pathname.split("/").at(-1));
      return {
        ...pull,
        number,
        user: { login: number === 5 ? "arcabotai" : "felirami" },
        created_at: number === 5 ? "2026-02-11T23:59:59Z" : "2026-02-12T00:00:00Z",
      };
    },
  });
  assert.deepEqual(requested, ["/repos/openclaw/openclaw/pulls/1", "/repos/openclaw/openclaw/pulls/5"]);
  assert.deepEqual(events.map(({ number }) => number), [1]);
});

test("curated reviews require a tracked reviewer and a submission within their cutoff", async () => {
  const url = "https://github.com/openclaw/openclaw/pull/1#pullrequestreview-123";
  const reviewIndex = {
    ...index,
    supportedProjects: [{ name: "OpenClaw", reviews: [{ url, state: "CHANGES_REQUESTED" }] }],
  };
  const run = (login, submittedAt) => collectReviews(reviewIndex, {
    githubImpl: async (pathname) => pathname.endsWith("/reviews") ? [{
      id: 123,
      html_url: url,
      state: "CHANGES_REQUESTED",
      user: { login },
      submitted_at: submittedAt,
      commit_id: "reviewed-commit",
    }] : pull,
  });
  await assert.rejects(run("arcacomputer", "2026-02-12T00:00:00Z"), /review author is not a tracked account/);
  assert.deepEqual(await run("felirami", "2026-02-11T23:59:59Z"), []);
  assert.equal((await run("arcabotai", "2026-02-12T00:00:00Z"))[0].actor, "arcabotai");
});

test("curated credits use the verified merge date and the credited account cutoff", async () => {
  const creditIndex = {
    ...index,
    mergedUpstreamCredits: [{
      project: "OpenClaw",
      url: pull.html_url,
      mergedAt: pull.merged_at,
      mergeCommit: pull.merge_commit_sha,
      credit: "co-author",
    }],
  };
  const events = await collectCredits(creditIndex, { githubImpl: async () => pull });
  assert.equal(events[0].actor, "arcabotai");
  assert.equal(events[0].occurredAt, pull.merged_at);
  assert.deepEqual(await collectCredits(creditIndex, {
    githubImpl: async () => ({ ...pull, merged_at: "2026-02-11T23:59:59Z" }),
  }), []);
});

test("successful checks refresh checkedAt while keeping unchanged event and source timestamps stable", () => {
  const events = [normalizePullRequest(pull)];
  const source = { identities: index.contributionIdentities, ownedRepositoryOwners: index.ownedRepositoryOwners };
  const previous = payloadFor(events, null, "2026-07-17T00:00:00Z", { source });
  const checked = payloadFor(events, previous, "2026-07-18T00:00:00Z", { source });
  assert.equal(checked.generatedAt, previous.generatedAt);
  assert.equal(checked.checkedAt, "2026-07-18T00:00:00Z");
  assert.deepEqual(checked.source, source);
  assert.equal(payloadFor(events, previous, "2026-07-19T00:00:00Z", {
    source: { ...source, identities: [source.identities[0]] },
  }).generatedAt, "2026-07-19T00:00:00Z");
});
