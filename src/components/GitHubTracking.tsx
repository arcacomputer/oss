import type { ActivityFeed, GithubRepositoryInventory } from "@/lib/data";

const users = ["felirami", "arcabotai"];
function date(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function TrackingSources({
  feed,
  inventory,
  since,
}: {
  feed: ActivityFeed;
  inventory: GithubRepositoryInventory;
  since: string;
}) {
  if (!inventory.checkedAt) return null;
  return (
    <section
      className="tracking-panel container"
      aria-labelledby="tracking-title"
    >
      <div className="tracking-surface">
        <div className="tracking-intro">
          <h2 id="tracking-title">Tracked GitHub sources</h2>
          <p>
            Authored external pull requests since {date(`${since}T00:00:00Z`)}.
            Reviews and merge credits are selected verified records.
          </p>
        </div>
        <div className="tracking-sources">
          {users.map((login) => {
            const pulls = new Set(
              feed.events
                .filter(
                  (event) =>
                    event.type === "upstream_pr_state" &&
                    event.actor.toLowerCase() === login,
                )
                .map((event) => event.url),
            );
            const source = inventory.sources.find(
              (item) => item.login === login,
            );
            const query = `is:pr is:public author:${login} created:>=${since} -user:felirami -user:arcabotai -user:arcacomputer`;
            return (
              <article key={login} className="tracking-source">
                <a
                  className="tracking-profile"
                  href={`https://github.com/${login}`}
                >
                  @{login}
                </a>
                <p>
                  <strong>{pulls.size}</strong> external pull requests
                </p>
                <span>
                  {source?.publicRepositoryCount ?? 0} public repositories
                  tracked
                </span>
                <a
                  className="tracking-query"
                  href={`https://github.com/pulls?q=${encodeURIComponent(query)}`}
                >
                  View tracked PRs on GitHub
                </a>
              </article>
            );
          })}
          <article className="tracking-source">
            <a
              className="tracking-profile"
              href="https://github.com/arcacomputer"
            >
              arcacomputer
            </a>
            <p>
              <strong>
                {inventory.sources.find(
                  (source) => source.login === "arcacomputer",
                )?.publicRepositoryCount ?? 0}
              </strong>{" "}
              public repositories
            </p>
            <span>
              Organization-owned code, tracked separately from upstream
              authorship.
            </span>
            <a className="tracking-query" href="#repository-inventory">
              Browse the repository inventory
            </a>
          </article>
        </div>
        <p className="tracking-checked">
          PRs checked {date(feed.checkedAt || feed.generatedAt)} · Repositories
          checked {date(inventory.checkedAt)}
        </p>
      </div>
    </section>
  );
}

export function RepositoryInventory({
  inventory,
}: {
  inventory: GithubRepositoryInventory;
}) {
  if (!inventory.checkedAt) return null;
  return (
    <details className="repository-inventory" id="repository-inventory">
      <summary>
        All tracked public repositories{" "}
        <span>{inventory.repositories.length} repositories · {inventory.sources.length} owners</span>
      </summary>
      <div className="repository-inventory-body">
        <p>
          This inventory is discovered from GitHub. Detected licenses, forks,
          and archived repositories are labelled separately from the curated
          Arca projects above. The contribution cutoff applies to PR history;
          this inventory covers currently public repositories of any age.
        </p>
        <a className="tracking-query" href="/github-repositories.json">
          Download the repository snapshot
        </a>
        {inventory.sources.map((source) => (
          <section
            className="owner-repositories"
            key={source.login}
            aria-labelledby={`owner-${source.login}`}
          >
            <h3 id={`owner-${source.login}`}>
              <a href={`https://github.com/${source.login}`}>
                {source.type === "user" ? "@" : ""}
                {source.login}
              </a>
              <span>{source.publicRepositoryCount} public repositories</span>
            </h3>
            <ul>
              {inventory.repositories
                .filter(
                  (repo) =>
                    repo.owner.toLowerCase() === source.login.toLowerCase(),
                )
                .map((repo) => (
                  <li key={repo.repository}>
                    <div>
                      <a href={repo.url}>{repo.name}</a>
                      {repo.description ? <p>{repo.description}</p> : null}
                    </div>
                    <div className="inventory-labels">
                      <span className="license">
                        {repo.license ?? "No detected license"}
                      </span>
                      {repo.fork ? <span>Fork</span> : null}
                      {repo.archived ? <span>Archived</span> : null}
                    </div>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </details>
  );
}
