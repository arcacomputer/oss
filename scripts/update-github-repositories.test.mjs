import assert from "node:assert/strict";
import test from "node:test";
import {
  collectRepositoryInventory,
  DEFAULT_REPOSITORY_SOURCES,
  normalizeRepository,
} from "./update-github-repositories.mjs";

function repository(owner, name, overrides = {}) {
  return {
    id: `${owner}/${name}`,
    name,
    full_name: `${owner}/${name}`,
    html_url: `https://github.com/${owner}/${name}`,
    owner: { login: owner, email: "not-for-public-snapshot@example.com" },
    description: `Public description of ${name}`,
    visibility: "public",
    private: false,
    fork: false,
    archived: false,
    default_branch: "main",
    created_at: "2020-01-01T00:00:00Z",
    license: { spdx_id: "MIT", url: "https://api.github.com/licenses/mit" },
    permissions: { admin: true },
    ...overrides,
  };
}

test("default repository sources cover the two users and organization", () => {
  assert.deepEqual(DEFAULT_REPOSITORY_SOURCES, [
    { login: "felirami", type: "user" },
    { login: "arcabotai", type: "user" },
    { login: "arcacomputer", type: "organization" },
  ]);
});

test("inventory follows every repository page past the first hundred", async () => {
  const items = Array.from({ length: 101 }, (_, index) => repository("felirami", `repo-${String(index).padStart(3, "0")}`));
  const calls = [];
  const result = await collectRepositoryInventory([{ login: "felirami", type: "user" }], {
    checkedAt: "2026-10-19T12:00:00Z",
    githubImpl: async (pathname, params) => {
      calls.push({ pathname, ...params });
      return items.slice((params.page - 1) * 100, params.page * 100);
    },
  });
  assert.equal(result.repositories.length, 101);
  assert.equal(result.sources[0].publicRepositoryCount, 101);
  assert.equal(result.checkedAt, "2026-10-19T12:00:00Z");
  assert.deepEqual(calls.map(({ pathname, page, per_page, type }) => ({ pathname, page, per_page, type })), [
    { pathname: "/users/felirami/repos", page: 1, per_page: 100, type: "owner" },
    { pathname: "/users/felirami/repos", page: 2, per_page: 100, type: "owner" },
  ]);
  assert.equal(result.repositories[0].createdAt, "2020-01-01T00:00:00Z", "the contribution cutoff does not remove older owned repositories");
});

test("inventory requests the public organization endpoint and sorts owners and repositories", async () => {
  const calls = [];
  const result = await collectRepositoryInventory([
    { login: "felirami", type: "user" },
    { login: "arcacomputer", type: "organization" },
  ], {
    githubImpl: async (pathname, params) => {
      calls.push({ pathname, type: params.type });
      return pathname.includes("/orgs/")
        ? [repository("arcacomputer", "zebra"), repository("arcacomputer", "Alpha")]
        : [repository("felirami", "demo")];
    },
  });
  assert.deepEqual(calls, [
    { pathname: "/users/felirami/repos", type: "owner" },
    { pathname: "/orgs/arcacomputer/repos", type: "public" },
  ]);
  assert.deepEqual(result.repositories.map((item) => item.repository), ["arcacomputer/Alpha", "arcacomputer/zebra", "felirami/demo"]);
  assert.equal(result.sources[1].publicRepositoryCount, 2);
});

test("inventory excludes private repositories and repositories owned by a different namespace", async () => {
  const result = await collectRepositoryInventory([{ login: "felirami", type: "user" }], {
    githubImpl: async () => [
      repository("felirami", "private", { private: true, visibility: "private" }),
      repository("felirami", "unknown-privacy", { private: undefined }),
      repository("felirami", "internal", { visibility: "internal" }),
      repository("elsewhere", "collaboration"),
      repository("Felirami", "public"),
    ],
  });
  assert.deepEqual(result.repositories.map((item) => item.repository), ["Felirami/public"]);
  assert.equal(result.sources[0].publicRepositoryCount, 1);
  assert.ok(!JSON.stringify(result).includes("not-for-public-snapshot"));
  assert.ok(!JSON.stringify(result).includes("permissions"));
});

test("normalization retains fork, archive, and license evidence without implying authorship", () => {
  const normalized = normalizeRepository(repository("arcabotai", "upstream-fork", { fork: true, archived: true }));
  assert.deepEqual(normalized, {
    name: "upstream-fork",
    repository: "arcabotai/upstream-fork",
    url: "https://github.com/arcabotai/upstream-fork",
    owner: "arcabotai",
    description: "Public description of upstream-fork",
    visibility: "public",
    fork: true,
    archived: true,
    defaultBranch: "main",
    createdAt: "2020-01-01T00:00:00Z",
    license: "MIT",
    licenseUrl: "https://api.github.com/licenses/mit",
  });
  assert.equal(normalizeRepository(repository("arcabotai", "unlicensed", { license: null })).license, null);
  const unrecognized = normalizeRepository(repository("arcabotai", "custom", {
    license: { spdx_id: "NOASSERTION", url: "https://api.github.com/licenses/other" },
  }));
  assert.equal(unrecognized.license, null);
  assert.equal(unrecognized.licenseUrl, null);
});

test("inventory deduplicates repositories appearing across page boundaries", async () => {
  const firstPage = Array.from({ length: 100 }, (_, index) => repository("felirami", `repo-${index}`));
  const result = await collectRepositoryInventory([{ login: "felirami", type: "user" }], {
    githubImpl: async (_, { page }) => page === 1 ? firstPage : [firstPage[99], repository("felirami", "last")],
  });
  assert.equal(result.repositories.length, 101);
  assert.equal(result.sources[0].publicRepositoryCount, 101);
});

test("inventory fails on malformed responses instead of publishing a partial inventory", async () => {
  await assert.rejects(collectRepositoryInventory([{ login: "felirami", type: "user" }], {
    githubImpl: async () => ({ message: "rate limited" }),
  }), /invalid GitHub repository response/);
  await assert.rejects(collectRepositoryInventory([{ login: "felirami", type: "user" }], {
    githubImpl: async () => [null],
  }), /invalid GitHub repository item/);
});

test("inventory detects stalled pagination", async () => {
  const page = Array.from({ length: 100 }, (_, index) => repository("felirami", `repo-${index}`));
  await assert.rejects(collectRepositoryInventory([{ login: "felirami", type: "user" }], {
    githubImpl: async () => page,
  }), /pagination did not advance/);
});

test("inventory fails explicitly when its page safety limit is reached", async () => {
  let calls = 0;
  await assert.rejects(collectRepositoryInventory([{ login: "felirami", type: "user" }], {
    githubImpl: async (_, { page }) => {
      calls += 1;
      return Array.from({ length: 100 }, (_, index) => repository("felirami", `repo-${page}-${index}`));
    },
  }), /exceeded 100 pages/);
  assert.equal(calls, 100);
});

test("inventory checks every configured source and fails if a later source cannot be fetched", async () => {
  await assert.rejects(collectRepositoryInventory(DEFAULT_REPOSITORY_SOURCES, {
    githubImpl: async (pathname) => {
      if (pathname.includes("arcacomputer")) throw new Error("GitHub unavailable");
      return [repository(pathname.split("/")[2], "demo")];
    },
  }), /GitHub unavailable/);
});

test("repository sources reject duplicate namespaces and unexpected source types", async () => {
  await assert.rejects(collectRepositoryInventory([{ login: "felirami", type: "team" }]), /Invalid GitHub repository source/);
  await assert.rejects(collectRepositoryInventory([
    { login: "felirami", type: "user" },
    { login: "Felirami", type: "user" },
  ]), /Duplicate GitHub repository source/);
});
