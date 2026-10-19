import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { github } from "./update-public-activity.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INDEX_PATH = path.join(ROOT, "public", "oss.json");
const OUTPUT_PATH = path.join(ROOT, "public", "github-repositories.json");
const PAGE_SIZE = 100;
const MAX_PAGES = 100;

export const DEFAULT_REPOSITORY_SOURCES = [
  { login: "felirami", type: "user" },
  { login: "arcabotai", type: "user" },
  { login: "arcacomputer", type: "organization" },
];

function isoNow() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function publicGithubUrl(value) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["github.com", "api.github.com"].includes(url.hostname)
      ? value
      : null;
  } catch {
    return null;
  }
}

export function normalizeRepository(repository) {
  if (repository?.private !== false || (repository.visibility && repository.visibility !== "public")) return null;

  const owner = repository.owner?.login;
  const name = repository.name;
  const fullName = repository.full_name;
  const url = publicGithubUrl(repository.html_url);
  if (
    typeof owner !== "string" || !owner ||
    typeof name !== "string" || !name ||
    typeof fullName !== "string" || fullName.toLowerCase() !== `${owner}/${name}`.toLowerCase() ||
    !url || new URL(url).hostname !== "github.com" ||
    new URL(url).pathname.toLowerCase() !== `/${fullName}`.toLowerCase() ||
    typeof repository.created_at !== "string" || !Number.isFinite(Date.parse(repository.created_at))
  ) {
    throw new Error("GitHub returned invalid public repository metadata");
  }

  const spdx = repository.license?.spdx_id;
  const license = typeof spdx === "string" && spdx.trim() && spdx !== "NOASSERTION"
    ? spdx
    : null;

  // Only explicitly public fields belong in the published snapshot. A public
  // repository, a fork, and a licensed original project are distinct facts.
  return {
    name,
    repository: fullName,
    url,
    owner,
    description: typeof repository.description === "string" ? repository.description : null,
    visibility: "public",
    fork: repository.fork === true,
    archived: repository.archived === true,
    defaultBranch: typeof repository.default_branch === "string" ? repository.default_branch : null,
    createdAt: repository.created_at,
    license,
    licenseUrl: license
      ? publicGithubUrl(repository.license.html_url) || publicGithubUrl(repository.license.url)
      : null,
  };
}

function normalizeSources(sources) {
  if (!Array.isArray(sources) || sources.length === 0) throw new Error("At least one GitHub repository source is required");
  const seen = new Set();
  return sources.map((source) => {
    if (
      typeof source?.login !== "string" || !/^[a-z\d](?:[a-z\d-]*[a-z\d])?$/i.test(source.login) ||
      !["user", "organization"].includes(source.type)
    ) {
      throw new Error("Invalid GitHub repository source");
    }
    const key = source.login.toLowerCase();
    if (seen.has(key)) throw new Error(`Duplicate GitHub repository source: ${source.login}`);
    seen.add(key);
    return { login: source.login, type: source.type };
  });
}

export async function collectRepositoryInventory(sources = DEFAULT_REPOSITORY_SOURCES, options = {}) {
  const githubImpl = options.githubImpl || github;
  const normalizedSources = normalizeSources(sources);
  const byRepository = new Map();
  const sourceResults = [];

  for (const source of normalizedSources) {
    const pathname = source.type === "organization"
      ? `/orgs/${source.login}/repos`
      : `/users/${source.login}/repos`;
    const seen = new Set();
    let complete = false;
    let publicRepositoryCount = 0;

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const result = await githubImpl(pathname, {
        type: source.type === "organization" ? "public" : "owner",
        per_page: PAGE_SIZE,
        page,
        sort: "full_name",
        direction: "asc",
      });
      if (!Array.isArray(result)) throw new Error(`${source.login}: invalid GitHub repository response`);
      if (result.length > PAGE_SIZE) throw new Error(`${source.login}: GitHub repository page exceeds requested size`);

      let newRepositoryCount = 0;
      for (const repository of result) {
        if (!repository || typeof repository.full_name !== "string") {
          throw new Error(`${source.login}: invalid GitHub repository item`);
        }
        const key = repository.full_name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        newRepositoryCount += 1;

        // The user endpoint can be called with an authenticated token. Retain
        // only public repositories belonging to the requested namespace.
        if (repository.owner?.login?.toLowerCase() !== source.login.toLowerCase()) continue;
        const normalized = normalizeRepository(repository);
        if (!normalized) continue;
        byRepository.set(key, normalized);
        publicRepositoryCount += 1;
      }

      if (result.length > 0 && newRepositoryCount === 0) {
        throw new Error(`${source.login}: GitHub repository pagination did not advance`);
      }
      if (result.length < PAGE_SIZE) {
        complete = true;
        break;
      }
    }

    if (!complete) {
      throw new Error(`${source.login}: repository inventory exceeded ${MAX_PAGES} pages; increase the limit before refreshing`);
    }
    sourceResults.push({ ...source, publicRepositoryCount });
  }

  const repositories = [...byRepository.values()].sort((a, b) =>
    a.repository.toLowerCase().localeCompare(b.repository.toLowerCase()),
  );
  return {
    schemaVersion: 1,
    checkedAt: options.checkedAt || isoNow(),
    sources: sourceResults,
    repositories,
  };
}

function sourcesFromIndex(index) {
  const tracking = index.githubTracking;
  if (!tracking) return DEFAULT_REPOSITORY_SOURCES;
  if (!Array.isArray(tracking.users) || !Array.isArray(tracking.organizations)) {
    throw new Error("githubTracking requires users and organizations arrays");
  }
  return [
    ...tracking.users.map((login) => ({ login, type: "user" })),
    ...tracking.organizations.map((login) => ({ login, type: "organization" })),
  ];
}

async function main() {
  const index = JSON.parse(await readFile(INDEX_PATH, "utf8"));
  const payload = await collectRepositoryInventory(sourcesFromIndex(index));
  await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Verified ${payload.repositories.length} public repositories across ${payload.sources.length} GitHub sources`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
