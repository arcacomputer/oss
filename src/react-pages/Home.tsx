import type { ReactNode } from "react";
import type { ActivityEvent, OwnedProject } from "@/lib/data";
import { safeEvidenceUrl } from "@/lib/contribution-explorer.mjs";
import {
  getActivityFeed,
  getOpenClawLedger,
  ownedProjects,
  supportPrograms,
  getRepositoryInventory,
  trackingIdentities,
  trackingSince,
} from "@/lib/data";
import {
  contributionSummary,
  latestActivity,
} from "@/lib/presentation";
import {
  getContributionDirectory,
  type ContributionProject,
} from "@/lib/contributions";
import {
  projectCategories,
  projectDescriptions,
  projectStatusLabels,
  contributionDescriptions,
} from "@/lib/catalog";

import {
  TrackingSources,
  RepositoryInventory,
} from "@/src/components/GitHubTracking";

const SITE_SOURCE = "https://github.com/arcacomputer/oss";
const LEDGER_INITIAL_LIMIT = 6;

function Mark() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M10 51 26 13h12l16 38H40l-8-22-8 22Z" fill="currentColor" />
      <path d="M24 39h16v7H24Z" fill="var(--signal)" />
    </svg>
  );
}
function Icon({ kind }: { kind: "code" | "search" }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {kind === "code" ? <path d="m7 7-5 5 5 5m10-10 5 5-5 5M14 4l-4 16" /> : (
        <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>
      )}
    </svg>
  );
}

function StudioSample({ project }: { project: OwnedProject }) {
  return (
    <figure className="studio-sample">
      <fieldset className="sample-board">
        <legend className="sr-only">OrthoVoxel Studio demo view</legend>
        <div className="sample-switch">
          <label>
            <input type="radio" name="studio-view" value="model" defaultChecked />
            <span>3D model</span>
          </label>
          <label>
            <input type="radio" name="studio-view" value="drawings" />
            <span>Source drawings</span>
          </label>
        </div>
        <div className="sample-model">
          <img src="/orthovoxel/model.webp" width="1000" height="595" fetchPriority="high"
            alt="Isometric view of the demo model, an orange block with a stepped gold roof and dark windows." />
        </div>
        <div className="sample-drawings">
          {["Front", "Right", "Top"].map((side) => (
            <div key={side}>
              <img src={`/orthovoxel/${side.toLowerCase()}.png`} width="32" height="32" alt={`${side} pixel drawing of the demo model`} />
              <span>{side}</span>
            </div>
          ))}
        </div>
      </fieldset>
      <figcaption>
        <a href={project.url}>{project.name}</a>
        <span>One voxel model from three pixel drawings.</span>
      </figcaption>
    </figure>
  );
}

function day(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
function Status({ state }: { state: string }) {
  const labels: Record<string, string> = {
    open: "Open PR",
    merged: "Merged",
    closed: "Closed without merge",
    changes_requested: "Review submitted",
    released: "Released",
    prerelease: "Prerelease",
  };
  return (
    <span className={`status status-${state}`}>
      {labels[state] ?? state.replaceAll("_", " ")}
    </span>
  );
}
function RepoMark({ project }: { project: ContributionProject }) {
  return (
    <span className="repo-mark">
      {project.logo ? (
        <img src={project.logo} alt="" width="48" height="48" loading="lazy" />
      ) : (
        <Icon kind="code" />
      )}
    </span>
  );
}
function OutcomeStatus({ event }: { event: ActivityEvent }) {
  const outcome = event.contributionOutcome;
  if (event.type === "upstream_manual_integration" || outcome?.kind === "manually_integrated") {
    return <span className="status status-merged status-outcome">Manually integrated upstream</span>;
  }
  if (!outcome) return <Status state={event.state} />;
  const numbers = outcome.receipts.map((receipt) => `#${receipt.number}`).join("/");
  const label = outcome.kind === "partially_incorporated"
    ? `Partially incorporated via ${numbers}`
    : `Incorporated via merged ${numbers}`;
  return <span className="status status-merged status-outcome">{label}</span>;
}
function ReceiptEvidence({ event }: { event: ActivityEvent }) {
  const outcome = event.contributionOutcome;
  const receipts = outcome?.receipts ?? (event.evidence?.landedCommits ? [{
    url: event.url,
    number: event.number,
    prAuthor: event.evidence.prAuthor,
    landedCommits: event.evidence.landedCommits,
  }] : []);
  const context = outcome?.context || event.evidence?.context;
  return (
    <>
      {outcome ? <span className="receipt-meta">Original PR: closed without merge</span> : null}
      {receipts.map((receipt) => (
        <span className="receipt-meta" key={receipt.url}>
          {receipt.prAuthor ? (
            <><a href={safeEvidenceUrl(receipt.url)}>Merged #{receipt.number}</a> · PR author @{receipt.prAuthor} · </>
          ) : null}
          {receipt.landedCommits.map((commit) => (
            <span key={`${commit.sha}:${commit.branch || ""}`}>
              <a href={safeEvidenceUrl(`https://github.com/${event.repository}/commit/${commit.sha}`)}>{commit.sha.slice(0, 8)}</a>{" "}
              · {commit.author.name}{commit.branch ? ` · ${commit.branch}` : ""}{" "}
            </span>
          ))}
        </span>
      ))}
      {context ? <span className="receipt-meta">{context}</span> : null}
    </>
  );
}
function Receipt({ event }: { event: ActivityEvent }) {
  return (
    <li className="receipt" data-explorer-record={event.id}>
      <div>
        <a href={safeEvidenceUrl(event.url)}>{event.title}</a>
        <span className="receipt-meta">
          #{event.number} · @{event.actor} · {event.role} ·{" "}
          {day(event.occurredAt)}
        </span>
        <ReceiptEvidence event={event} />
      </div>
      <OutcomeStatus event={event} />
    </li>
  );
}
function pullRequestTitle(title: string) {
  // The receipt retains the original title, including any conventional commit prefix.
  return title.replace(/^(?:feat|fix|docs|chore|refactor|test|build|ci|perf|style)(?:\([^)]+\))?!?:\s+/i, "");
}

function CurrentProject({ project }: { project: ContributionProject }) {
  const latest = project.openItems[0];
  if (!latest) return null;
  return (
    <article className="current-project">
      <div className="current-project-name">
        <RepoMark project={project} />
        <h4><a href={project.url}>{project.name}</a></h4>
      </div>
      <div className="current-project-work">
        <a className="current-pr" href={safeEvidenceUrl(latest.url)}>{pullRequestTitle(latest.title)}</a>
        <span className="receipt-meta">#{latest.number} · @{latest.actor} · {day(latest.occurredAt)}</span>
      </div>
      <details className="project-receipts">
        <summary>
          {project.openItems.length} open {project.openItems.length === 1 ? "PR" : "PRs"}
          <span className="sr-only"> for {project.name}</span>
        </summary>
        <ul>{project.openItems.map((event) => <Receipt key={event.id} event={event} />)}</ul>
      </details>
    </article>
  );
}

function SoftwareProject({ project }: { project: OwnedProject }) {
  const category = projectCategories[project.name] ?? "tools";
  const description = projectDescriptions[project.name] ?? project.description;
  const status = projectStatusLabels[project.name] ?? project.status;
  return (
    <article className="software-project" data-project-category={category}
      data-project-name={`${project.name} ${project.kind} ${description} ${project.description} ${status}`}>
      <div className="software-name">
        <h3><a href={project.url}>{project.name}</a></h3>
        <span>{project.kind} · {status}</span>
      </div>
      <p>{description}</p>
      <details className="project-proof">
        <summary>Details<span className="sr-only"> for {project.name}</span></summary>
        <div className="software-details">
          <p>{project.proof}</p>
          <p>{project.license} license · Arca is the {project.role}</p>
          <a href={project.url}>Open repository on GitHub</a>
        </div>
      </details>
    </article>
  );
}

function HistoryProject({ project }: { project: ContributionProject }) {
  const merged = project.mergedItems.length;
  const credits = project.creditItems.length;
  const reviews = project.reviewedItems.length;
  const closed = project.closedItems.length;
  const manual = project.manualItems.length;
  const incorporated = project.incorporatedItems.length;
  const accepted = merged > 0 || credits > 0 || manual > 0;
  const historyReceipts = project.allReceipts.filter(
    (event) => event.state !== "open",
  );
  const historicalUrls = new Set(historyReceipts.map((event) => event.url));
  const additionalEvidence = project.curatedEvidence.filter(
    (item) => !historicalUrls.has(item.url) && !/^open /i.test(item.label),
  );
  const kinds = [
    accepted ? "accepted" : "",
    reviews ? "review" : "",
    closed ? "closed" : "",
  ].join(" ");
  return (
    <article
      className="history-project"
      data-history-kind={kinds}
      data-explorer-project={project.repository}
      data-history-name={`${project.name} ${project.repository} ${project.description}`}
    >
      <div className="history-project-top">
        <RepoMark project={project} />
        <div>
          <h4>{project.name}</h4>
          <span className="repo-name">{project.repository}</span>
        </div>
        <span
          className={`status ${accepted ? "status-merged" : reviews ? "status-changes_requested" : "status-closed"}`}
        >
          {merged
            ? "Merged contributions"
            : credits
              ? "Credited merges"
              : manual
                ? "Manually integrated upstream"
              : reviews
                ? "Code review"
                : "Closed proposals"}
        </span>
      </div>
      <p>
        {contributionDescriptions[project.repository] ??
          (project.closedItems[0]
            ? `Proposed changes: ${project.closedItems[0].title.replace(/^(fix|docs|feat|chore|improve)(\([^)]*\))?:\s*/i, "")}.`
            : project.description)}
      </p>
      <p className="explorer-project-totals" data-explorer-project-totals hidden>Project totals below include all past records, before filters.</p>
      <div className="history-facts">
        {merged > 0 ? (
          <span>
            <strong>{merged}</strong> authored{" "}
            {merged === 1 ? "merge" : "merges"}
          </span>
        ) : null}
        {credits > 0 ? (
          <span>
            <strong>{credits}</strong> credited{" "}
            {credits === 1 ? "merge" : "merges"}
          </span>
        ) : null}
        {reviews > 0 ? (
          <span>
            <strong>{reviews}</strong> submitted{" "}
            {reviews === 1 ? "review" : "reviews"}
          </span>
        ) : null}
        {manual > 0 ? <span><strong>{manual}</strong> manually integrated contribution{manual === 1 ? "" : "s"}</span> : null}
        {incorporated > 0 ? <span><strong>{incorporated}</strong> incorporated origin{incorporated === 1 ? "" : "s"} · original PR{incorporated === 1 ? "" : "s"} closed</span> : null}
        {closed > 0 ? (
          <span>
            <strong>{closed}</strong> closed{" "}
            {closed === 1 ? "proposal" : "proposals"}
            {!accepted && !reviews ? " · no merge claimed" : ""}
          </span>
        ) : null}
      </div>
      <details className="history-records">
        <summary>
          View contribution records{" "}
          <span data-explorer-receipt-count>{historyReceipts.length + additionalEvidence.length}</span>
        </summary>
        <div>
          <ul>
            {historyReceipts.map((event) => (
              <Receipt key={event.id} event={event} />
            ))}
          </ul>
          {additionalEvidence.length > 0 ? (
            <div className="curated-records">
              <h5>Selected public evidence</h5>
              {additionalEvidence.map((item) => (
                <a key={item.url} href={safeEvidenceUrl(item.url)}>
                  {item.label}
                </a>
              ))}
            </div>
          ) : null}
          {project.note ? (
            <p className="attribution-note">{project.note}</p>
          ) : null}
          <a className="repo-text-link" href={project.url}>
            Visit project repository
          </a>
        </div>
      </details>
    </article>
  );
}

export default function Home({ explorer }: { explorer?: ReactNode } = {}) {
  const feed = getActivityFeed();
  const ledger = getOpenClawLedger();
  const summary = contributionSummary(feed.events, ledger.pullRequests);
  const activity = latestActivity(feed.events);
  const directory = getContributionDirectory(
    feed.events,
    ledger.pullRequests,
    supportPrograms,
    {
      authors: trackingIdentities.map((identity) => identity.login),
      since: trackingSince,
    },
  );
  const repositoryInventory = getRepositoryInventory();
  const activeProjects = [...directory.active].sort(
    (a, b) => b.openItems.length - a.openItems.length,
  );
  const openCount = activeProjects.reduce((total, project) => total + project.openItems.length, 0);
  const historyRank = (project: ContributionProject) =>
    project.mergedItems.length + project.creditItems.length + project.manualItems.length;
  const pastProjects = [...directory.past].sort(
    (a, b) =>
      Number(historyRank(b) > 0) - Number(historyRank(a) > 0) ||
      historyRank(b) - historyRank(a) ||
      b.reviewedItems.length - a.reviewedItems.length,
  );
  const categoryOrder: Record<string, number> = {
    tools: 0,
    research: 1,
    records: 2,
  };
  const softwareProjects = ownedProjects.filter(
    (project) => projectCategories[project.name] !== "records",
  );
  const recordProjects = ownedProjects.filter(
    (project) => projectCategories[project.name] === "records",
  );
  const studio = softwareProjects.find((project) => project.repository === "felirami/orthovoxel-studio");
  const latestMerge = pastProjects.flatMap((project) => project.mergedItems)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0];
  const recordActions: Record<string, string> = {
    "Headlong Agent Findings": "Read findings",
    "OpenClaw Contributions": "Open contribution ledger",
    "OpenClaw TUI Field Fix": "Read investigation",
    "Arca OSS Index": "View site source",
  };
  const sortedProjects = [...softwareProjects].sort(
    (a, b) =>
      categoryOrder[projectCategories[a.name]] -
      categoryOrder[projectCategories[b.name]],
  );
  const primaryPullRequests = ledger.pullRequests.slice(
    0,
    LEDGER_INITIAL_LIMIT,
  );
  const remainingPullRequests = ledger.pullRequests.slice(LEDGER_INITIAL_LIMIT);
  const nav = (
    <>
      <a href="#projects" data-section-link="projects">
        Software
      </a>
      <a href="#contributions" data-section-link="contributions">
        Contributions
      </a>
      <a href="#records" data-section-link="records">
        Public records
      </a>
    </>
  );
  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a className="wordmark" href="#top" aria-label="Arca OSS home">
            <span className="brand-symbol">
              <Mark />
            </span>
            <span>
              arca<span className="brand-divider">/</span>
              <span className="brand-subtitle">open source</span>
            </span>
          </a>
          <nav aria-label="Primary navigation">{nav}</nav>
          <a
            className="button header-github"
            href={SITE_SOURCE}
            aria-label="Arca OSS source on GitHub"
          >
            <Icon kind="code" /> GitHub
          </a>
          <details className="mobile-section-nav">
            <summary>
              Menu
            </summary>
            <nav aria-label="Mobile navigation">
              {nav}
              <a href={SITE_SOURCE}>Site source on GitHub</a>
            </nav>
          </details>
        </div>
      </header>
      <main id="top">
        <section
          className="overview-hero container"
          aria-labelledby="hero-title"
        >
          <div className="hero-surface">
            <div className="hero-copy" id="content" tabIndex={-1}>
              <h1 id="hero-title">Open source <span>at Arca.</span></h1>
              <p className="hero-description">
                We’re a small team in Santiago, Chile. We make tools for pixel artists and node operators, and send patches to the open-source projects we use.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#projects">Browse software</a>
                <a className="text-action" href="#contributions">View contributions</a>
              </div>
            </div>
            {studio && <StudioSample project={studio} />}
          </div>
          {latestMerge && (
            <aside className="recent-merge" aria-label="Recent upstream contribution">
              <span className="recent-label">Recently merged</span>
              <div>
                <a href={safeEvidenceUrl(latestMerge.url)}>{pullRequestTitle(latestMerge.title)}</a>
                <span className="recent-source">{latestMerge.repository} #{latestMerge.number}</span>
              </div>
              <time dateTime={latestMerge.occurredAt}>{day(latestMerge.occurredAt)}</time>
            </aside>
          )}
        </section>
        <section
          className="section tools-section container"
          id="projects"
          aria-labelledby="projects-title"
        >
          <div className="section-heading">
            <div>
              <h2 id="projects-title">Software we make</h2>
              <p>Tools, libraries, and experiments we publish. The source code for each project is on GitHub.</p>
            </div>
          </div>
          <div className="directory-toolbar" data-project-controls hidden>
            <div
              className="filter-buttons"
              role="group"
              aria-label="Filter our software"
            >
              {[
                ["all", "All projects"],
                ["tools", "Tools"],
                ["research", "Research"],
              ].map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  data-project-filter={value}
                  aria-pressed={value === "all"}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="search-box">
              <Icon kind="search" />
              <span className="sr-only">Search our software</span>
              <input
                type="search"
                placeholder="Search software…"
                data-project-search
              />
            </label>
          </div>
          <div id="project-directory">
            <p className="result-count" data-project-count aria-live="polite">
              Showing all {softwareProjects.length} software projects
            </p>
            <div className="software-list">
              {sortedProjects.map((project) => (
                <SoftwareProject key={project.repository} project={project} />
              ))}
            </div>
            <p className="filter-empty" data-project-empty hidden>
              No matching projects. Try a different name or category.
            </p>
          </div>
        </section>
        <section
          className="contributions-section"
          id="contributions"
          aria-labelledby="contributions-title"
        >
          <div className="contributions-intro container">
            <div className="section-heading">
              <div>
                <h2 id="contributions-title">Projects we contribute to</h2>
                <p>Pull requests and code reviews we’ve sent to other open-source teams.</p>
              </div>
            </div>
            <nav
              className="contribution-navigation"
              aria-label="Contribution status"
            >
              <a className="work-jump" href="#current-work">
                In progress <span>{openCount} open {openCount === 1 ? "PR" : "PRs"}</span>
              </a>
              <a className="work-jump" href="#past-work">
                Past contributions <span>{directory.past.length} projects</span>
              </a>
            </nav>
          </div>
          <section
            className="section current-section"
            id="current-work"
            aria-labelledby="current-title"
          >
            <div className="container">
              <div className="section-heading">
                <div>
                  <h3 id="current-title">In progress</h3>
                  <p>The latest open pull request in each project is linked below.</p>
                </div>
                <span className="section-total">
                  Activity checked {day(feed.checkedAt || feed.generatedAt)}<br />
                  OpenClaw checked {day(ledger.generatedAt)}
                </span>
              </div>
              <div className="current-list">
                {activeProjects.map((project) => (
                  <CurrentProject key={project.repository} project={project} />
                ))}
              </div>
              {!activeProjects.length && <p className="filter-empty">There are no open pull requests in the latest snapshot.</p>}
            </div>
          </section>
          <section
            className="section history-section container"
            id="past-work"
            aria-labelledby="history-title"
          >
            <div className="section-heading">
              <div>
                <h3 id="history-title">Past contributions</h3>
                <p>
                  Browse merged changes, reviews, and closed proposals. Open a project’s records to see who did the work and what landed.
                </p>
              </div>
              <div className="history-totals">
                <strong>
                  {summary.mergedCount}
                  <small>authored pull requests merged</small>
                </strong>
                <strong>
                  {summary.mergedCreditCount}
                  <small>additional credited merges</small>
                </strong>
                <strong>{summary.manualIntegrationCount}<small>manually integrated contribution{summary.manualIntegrationCount === 1 ? "" : "s"}</small></strong>
              </div>
            </div>
            {explorer}
            <p className="result-count" data-history-count aria-live="polite">
              {directory.past.length} projects with past work. Projects can also
              have work in progress.
            </p>
            <div className="history-grid">
              {pastProjects.map((project) => (
                <HistoryProject key={project.repository} project={project} />
              ))}
            </div>
            <p className="filter-empty" data-history-empty hidden>
              No projects match this filter. Try another category or search.
            </p>
            <p className="section-note">
              Counts reflect the linked records in this index.
              Maintainer-incorporated credit is kept separate from directly
              authored merges and manual integrations. Backports do not add contributions.
            </p>
          </section>
        </section>
        <section
          className="section records-section"
          id="records"
          aria-labelledby="records-title"
        >
          <div className="container">
            <div className="records-heading">
              <div>
                <h2 id="records-title">Public records</h2>
                <p>
                  Read our published investigations, download the activity data, or check which GitHub accounts we track.
                </p>
              </div>
              <div className="record-downloads">
                <a className="button button-secondary" href="/activity.json">
                  Activity JSON
                </a>
                <a className="button button-secondary" href="/oss.json">
                  Project index JSON
                </a>
              </div>
            </div>
            <ul className="record-projects">
              {recordProjects.map((project) => (
                <li key={project.repository}>
                  <div>
                    <h3>{project.name}</h3>
                    <p>
                      {projectDescriptions[project.name] ?? project.description}
                    </p>
                    <span className="record-project-meta">
                      {projectStatusLabels[project.name]} · {project.license}
                    </span>
                  </div>
                  <a className="button button-secondary" href={project.url}>
                    {recordActions[project.name] ?? "View record"}
                  </a>
                </li>
              ))}
            </ul>
            <TrackingSources
              feed={feed}
              inventory={repositoryInventory}
              since={trackingSince}
            />
            <RepositoryInventory inventory={repositoryInventory} />
            <details className="activity-disclosure" id="activity">
              <summary>
                Browse the activity feed{" "}
                <span>{activity.length} recorded items</span>
              </summary>
              <div className="activity-content">
                <div
                  className="filter-buttons"
                  role="group"
                  aria-label="Filter activity"
                  data-activity-controls
                  hidden
                >
                  {[
                    ["all", "Latest activity"],
                    ["merged", "Merged"],
                    ["open", "Open"],
                    ["closed", "Closed"],
                    ["released", "Releases"],
                  ].map(([value, label]) => (
                    <button
                      type="button"
                      key={value}
                      data-activity-filter={value}
                      aria-pressed={value === "all"}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <ul className="activity-list">
                  {activity.map((event, i) => (
                    <li
                      key={event.id}
                      data-activity-item
                      data-activity-state={event.state}
                      hidden={i >= 6}
                    >
                      <div className="activity-event">
                        <div>
                          <span className="receipt-meta">
                            {event.repository} · {day(event.occurredAt)}
                          </span>
                          <a href={event.url}>{event.title}</a>
                          <span className="receipt-meta">
                            @{event.actor} · {event.role}
                          </span>
                          <ReceiptEvidence event={event} />
                        </div>
                        <OutcomeStatus event={event} />
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="filter-empty" data-activity-empty hidden>
                  No entries with this status in the snapshot.
                </p>
                <div className="activity-bottom">
                  <span data-activity-count aria-live="polite">
                    Showing {Math.min(6, activity.length)} of {activity.length}{" "}
                    recorded items
                  </span>
                  <button
                    type="button"
                    className="button button-secondary"
                    data-activity-more
                    hidden
                  >
                    Show more activity
                  </button>
                  <noscript>
                    <a href="/activity.json">Read all activity</a>
                  </noscript>
                </div>
              </div>
            </details>
            <details className="ledger-more" id="ledger">
              <summary>
                OpenClaw pull request ledger{" "}
                <span>{ledger.pullRequests.length} pull requests</span>
              </summary>
              <div className="ledger-content">
                <p>
                  Snapshot: {day(ledger.generatedAt)}.{" "}
                  <a href="https://github.com/arcabotai/arca-openclaw-contributions">
                    Visit the source ledger
                  </a>
                  .
                </p>
                <ul>
                  {[...primaryPullRequests, ...remainingPullRequests].map(
                    (pr) => (
                      <li className="ledger-row" key={pr.number}>
                        <div>
                          <a href={pr.url}>{pr.title}</a>
                          <span className="receipt-meta">
                            #{pr.number} · @{pr.author}
                          </span>
                        </div>
                        <Status state={pr.state} />
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </details>
          </div>
        </section>
        <section className="about-section" id="about">
          <div className="container about-layout">
            <div>
              <h2>About Arca</h2>
            </div>
            <div>
              <p>We’re an independent team in Santiago, Chile. If you use one of our tools,
                found a bug, or have a correction to this index, we’d like to hear from you.</p>
              <div className="about-actions">
                <a className="button button-signal" href="https://arcabot.ai">
                  Visit Arca
                </a>
                <a className="button button-hero-outline" href={SITE_SOURCE}>
                  Improve this site
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer container">
        <a className="wordmark" href="#top">
          <span className="brand-symbol">
            <Mark />
          </span>
          <span>
            arca<span className="brand-divider">/</span>
            <span className="brand-subtitle">open source</span>
          </span>
        </a>
        <div>
          <a href={SITE_SOURCE}>Site source</a>
          <a href="mailto:contact@arca.computer">Contact Arca</a>
          <a className="section-return" href="#top">
            Back to top
          </a>
        </div>
      </footer>
    </>
  );
}
