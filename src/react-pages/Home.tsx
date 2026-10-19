import type { ActivityEvent, OwnedProject } from "@/lib/data";
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
  currentWork,
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
      <path d="M24 39h16v7H24Z" fill="var(--lime)" />
    </svg>
  );
}
function Icon({ kind }: { kind: "code" | "branch" | "check" | "search" }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === "code" ? (
        <>
          <path d="m7 7-5 5 5 5m10-10 5 5-5 5M14 4l-4 16" />
        </>
      ) : kind === "branch" ? (
        <>
          <circle cx="6" cy="5" r="2" />
          <circle cx="18" cy="5" r="2" />
          <circle cx="6" cy="19" r="2" />
          <path d="M6 7v10m12-10v2a5 5 0 0 1-5 5H6" />
        </>
      ) : kind === "check" ? (
        <>
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path d="m7 12 3 3 7-7" />
        </>
      ) : (
        <>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 5 5" />
        </>
      )}
    </svg>
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
            <><a href={receipt.url}>Merged #{receipt.number}</a> · PR author @{receipt.prAuthor} · </>
          ) : null}
          {receipt.landedCommits.map((commit) => (
            <span key={`${commit.sha}:${commit.branch || ""}`}>
              <a href={`https://github.com/${event.repository}/commit/${commit.sha}`}>{commit.sha.slice(0, 8)}</a>{" "}
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
    <li className="receipt">
      <div>
        <a href={event.url}>{event.title}</a>
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
function activeDescription(project: ContributionProject) {
  if (project.repository === "NousResearch/hermes-agent")
    return "Improving the reliability of agent workflows, remote access, and integrations.";
  if (project.repository === "openclaw/openclaw")
    return "Improving streaming messages so text stays visible in Feishu replies.";
  if (project.repository === "block/buzz")
    return "Making ACP startup failures easier to diagnose, alongside upstream code review.";
  return project.description;
}
function CurrentProject({ project }: { project: ContributionProject }) {
  return (
    <article className="current-card">
      <div className="current-card-top">
        <RepoMark project={project} />
        <span className="status status-open">In progress</span>
      </div>
      <h4>{project.name}</h4>
      <p>{activeDescription(project)}</p>
      <div className="current-card-count">
        <strong>{project.openItems.length}</strong> open{" "}
        {project.openItems.length === 1 ? "pull request" : "pull requests"}
      </div>
      <details className="project-receipts">
        <summary>
          View open pull requests <span>{project.openItems.length}</span>
        </summary>
        <ul>
          {project.openItems.map((event) => (
            <Receipt key={event.id} event={event} />
          ))}
        </ul>
      </details>
      <a className="repo-text-link" href={project.url}>
        Visit {project.name} on GitHub
      </a>
    </article>
  );
}
function ProjectCard({ project }: { project: OwnedProject }) {
  const category = projectCategories[project.name] ?? "tools";
  return (
    <article
      className={`tool-card tool-card-${category}`}
      data-project-category={category}
      data-project-name={`${project.name} ${project.description} ${project.kind}`}
    >
      <div className="tool-topline">
        <span className="tool-category">
          {category === "research"
            ? "Research & prototypes"
            : category === "records"
              ? "Public records"
              : project.kind}
        </span>
        <span className="license">{project.license}</span>
      </div>
      <h3>{project.name}</h3>
      <p>{projectDescriptions[project.name] ?? project.description}</p>
      <div className="tool-status">
        <span className="dot" />
        {projectStatusLabels[project.name] ?? project.status}
      </div>
      <div className="tool-actions">
        <a
          className="button button-secondary"
          href={project.url}
          aria-label={`View ${project.name} project`}
        >
          View project
        </a>
        <details className="project-proof">
          <summary aria-label={`About ${project.name}`}>
            About this project
          </summary>
          <p>{project.proof}</p>
          <p>Arca’s role: {project.role}.</p>
        </details>
      </div>
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
          <span>{historyReceipts.length + additionalEvidence.length}</span>
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
                <a key={item.url} href={item.url}>
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

export default function Home() {
  const feed = getActivityFeed();
  const ledger = getOpenClawLedger();
  const summary = contributionSummary(feed.events, ledger.pullRequests);
  const work = currentWork(feed.events, ledger.pullRequests);
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
  const contributionProjectCount = new Set(
    [...directory.active, ...directory.past].map(
      (project) => project.repository,
    ),
  ).size;
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
        Software we make
      </a>
      <a href="#contributions" data-section-link="contributions">
        Projects we contribute to
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
            Site source
          </a>
          <details className="mobile-section-nav">
            <summary aria-label="Open navigation">
              <span />
              <span />
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
              <p className="eyebrow">ARCA / OPEN-SOURCE WORK</p>
              <h1 id="hero-title">
                Tools we build.
                <br />
                <em>Software we improve.</em>
              </h1>
              <p className="hero-description">
                Explore software built by Arca and our contributions to
                open-source projects maintained by other teams.
              </p>
              <div className="hero-actions">
                <a className="button button-lime" href="#projects">
                  Explore our software
                </a>
                <a className="button button-hero-outline" href="#contributions">
                  Explore contributions
                </a>
              </div>
              <p className="hero-note">Independent team · Santiago, Chile</p>
            </div>
            <nav
              className="explore-panel"
              aria-label="Explore our open-source work"
            >
              <h2>Find your way around</h2>
              <a href="#projects">
                <span className="route-icon">
                  <Icon kind="code" />
                </span>
                <span>
                  <strong>Software we make</strong>
                  <small>
                    Tools, infrastructure, and software prototypes built by
                    Arca.
                  </small>
                </span>
                <span className="route-count">{softwareProjects.length}</span>
              </a>
              <a href="#contributions">
                <span className="route-icon">
                  <Icon kind="branch" />
                </span>
                <span>
                  <strong>Projects we contribute to</strong>
                  <small>
                    Fixes, features, and reviews for other teams’ OSS.
                  </small>
                </span>
                <span className="route-count">{contributionProjectCount}</span>
              </a>
              <p>Every project and contribution links to its public source.</p>
            </nav>
          </div>
        </section>
        <div className="snapshot-bar container">
          <span>
            <span className="dot" />
            Public, verifiable work
          </span>
          <p>
            Activity checked {day(feed.checkedAt || feed.generatedAt)} ·
            OpenClaw checked {day(ledger.generatedAt)}
          </p>
          <a href="#records">View the full record</a>
        </div>
        <section
          className="section tools-section container"
          id="projects"
          aria-labelledby="projects-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">BUILT & PUBLISHED BY ARCA</p>
              <h2 id="projects-title">Software we make</h2>
              <p>
                Open-source tools, infrastructure, and software prototypes built
                and published by Arca.
              </p>
            </div>
            <span className="section-total">
              {softwareProjects.length} licensed software projects
            </span>
          </div>
          <div className="directory-toolbar" data-project-controls hidden>
            <div
              className="filter-buttons"
              role="group"
              aria-label="Filter our software"
            >
              {[
                ["all", "All projects"],
                ["tools", "Tools & infrastructure"],
                ["research", "Research & prototypes"],
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
                placeholder="Find software…"
                data-project-search
              />
            </label>
          </div>
          <div id="project-directory">
            <p className="result-count" data-project-count aria-live="polite">
              Showing all {softwareProjects.length} software projects
            </p>
            <div className="tool-grid">
              {sortedProjects.map((project) => (
                <ProjectCard key={project.repository} project={project} />
              ))}
            </div>
            <p className="filter-empty" data-project-empty hidden>
              No matching projects. Try a different name or category.
            </p>
          </div>
          <p className="section-note">
            Every software project listed here has an explicit open-source
            license. Prototypes and previews are labelled. Our reports and
            investigations are in <a href="#records">Public records</a>.
          </p>
        </section>
        <section
          className="contributions-section"
          id="contributions"
          aria-labelledby="contributions-title"
        >
          <div className="contributions-intro container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  CONTRIBUTIONS TO OTHER OPEN-SOURCE PROJECTS
                </p>
                <h2 id="contributions-title">Projects we contribute to</h2>
                <p>
                  Fixes, features, and code reviews we contribute to software
                  maintained by other teams. Follow work in progress or explore
                  the results of past contributions.
                </p>
              </div>
            </div>
            <nav
              className="contribution-navigation"
              aria-label="Contribution status"
            >
              <a className="button button-primary" href="#current-work">
                In progress <span>{work.length} open PRs</span>
              </a>
              <a className="button button-secondary" href="#past-work">
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
                  <p className="eyebrow">
                    <span className="dot" />
                    UPSTREAM / IN PROGRESS
                  </p>
                  <h3 id="current-title">In progress</h3>
                  <p>
                    Open pull requests, grouped by the project they improve.
                    Upstream maintainers review and decide what lands.
                  </p>
                </div>
                <span className="section-total">
                  {work.length} open PRs · {directory.active.length} projects
                </span>
              </div>
              <div className="current-grid">
                {activeProjects.map((project) => (
                  <CurrentProject key={project.repository} project={project} />
                ))}
              </div>
              <div className="current-footnote">
                <p>
                  <strong>Open for upstream review.</strong> A pull request is
                  open in our dated snapshots. Open its public record to check
                  the latest upstream status.
                </p>
                <a className="button button-secondary" href="#past-work">
                  See past contributions
                </a>
              </div>
            </div>
          </section>
          <section
            className="section history-section container"
            id="past-work"
            aria-labelledby="history-title"
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">UPSTREAM / PAST WORK</p>
                <h3 id="history-title">Past contributions</h3>
                <p>
                  Changes that landed, code we reviewed, and proposals we made.
                  Each result is labelled.
                </p>
              </div>
              <div className="history-totals">
                <strong>
                  {summary.mergedCount}
                  <small>authored merges in snapshots</small>
                </strong>
                <strong>
                  {summary.mergedCreditCount}
                  <small>additional credited merges</small>
                </strong>
                <strong>{summary.manualIntegrationCount}<small>manually integrated contribution{summary.manualIntegrationCount === 1 ? "" : "s"}</small></strong>
              </div>
            </div>
            <div className="history-guide">
              <span>
                <i className="legend-dot legend-merged" />
                <strong>Merged / incorporated</strong> Accepted with linked evidence
              </span>
              <span>
                <i className="legend-dot legend-review" />
                <strong>Reviewed / credited</strong> Role stated in the record
              </span>
              <span>
                <i className="legend-dot legend-closed" />
                <strong>Closed</strong> Original PR not merged; incorporation labelled separately
              </span>
            </div>
            <div
              className="directory-toolbar history-toolbar"
              data-history-controls
              hidden
            >
              <div
                className="filter-buttons"
                role="group"
                aria-label="Filter past contributions"
              >
                {[
                  ["all", "All projects"],
                  ["accepted", "With accepted work"],
                  ["review", "With reviews"],
                  ["closed", "With closed proposals"],
                ].map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    data-history-filter={value}
                    aria-pressed={value === "all"}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="search-box">
                <Icon kind="search" />
                <span className="sr-only">Search past contributions</span>
                <input
                  type="search"
                  placeholder="Find an OSS project…"
                  data-history-search
                />
              </label>
            </div>
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
                <p className="eyebrow">THE PUBLIC RECORD</p>
                <h2 id="records-title">Public records</h2>
                <p>
                  Reports, investigations, and the evidence behind our work.
                  Inspect the sources and see how our GitHub activity is
                  tracked.
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
              <p className="eyebrow">ABOUT ARCA</p>
              <h2>
                Independent builders.
                <br />
                <em>Work you can inspect.</em>
              </h2>
            </div>
            <div>
              <p>
                We’re a small team in Santiago, Chile. We make practical tools,
                contribute to the software we depend on, and publish our
                findings.
              </p>
              <p>
                For every project here, we show our role, its status, and the
                public source. Use the code, follow a contribution, or help
                improve it.
              </p>
              <div className="about-actions">
                <a className="button button-lime" href="https://arcabot.ai">
                  About Arca
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
