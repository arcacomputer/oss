import type { ActivityEvent, OwnedProject } from "@/lib/data";
import {
  getActivityFeed,
  getOpenClawLedger,
  ownedProjects,
  supportPrograms,
} from "@/lib/data";
import {
  contributionSummary,
  currentWork,
  latestActivity,
} from "@/lib/presentation";

const SITE_SOURCE = "https://github.com/arcacomputer/oss";
const LEDGER_INITIAL_LIMIT = 6;
const categories: Record<string, string> = {
  "Ardea Knowledge Steward": "research",
  OpenChina: "research",
  "Headlong Agent Findings": "research",
  "OpenClaw Contributions": "records",
  "OpenClaw TUI Field Fix": "records",
  "Arca OSS Index": "records",
};
const featuredNames = ["ClawFix", "Clueside", "A3Stack"];
const projectCopy: Record<string, string> = {
  ClawFix:
    "Find what's wrong with your OpenClaw setup. Diagnose issues and make guarded repairs with a dedicated CLI.",
  Clueside:
    "Spot signs of AI-generated images, right in your browser. On-device inference keeps image data local.",
  A3Stack:
    "Bring agent identity, payments, data, and MCP tooling together with a TypeScript SDK.",
};

function Mark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path d="M10 51 26 13h12l16 38H40l-8-22-8 22Z" fill="currentColor" />
      <path d="M24 39h16v7H24Z" fill="var(--lime)" />
    </svg>
  );
}
function GitHubIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.64-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.83a9.6 9.6 0 0 1 2.5.34c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
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
function State({ state }: { state: string }) {
  return (
    <span className={`state state-${state}`}>
      {state === "changes_requested"
        ? "Review submitted"
        : state === "open"
          ? "Open PR"
          : state === "merged"
            ? "Merged"
            : state === "closed"
              ? "Closed"
              : state.replaceAll("_", " ")}
    </span>
  );
}
function EventRow({ event }: { event: ActivityEvent }) {
  return (
    <a className="activity-row" href={event.url}>
      <span className="activity-date">
        <time dateTime={event.occurredAt}>{day(event.occurredAt)}</time>
      </span>
      <span className="activity-copy">
        <span className="mono">
          {event.repository}
          {event.number ? ` #${event.number}` : ""}
        </span>
        <strong>{event.title}</strong>
        <span className="activity-byline">
          @{event.actor} · {event.role}
        </span>
      </span>
      <State state={event.state} />
    </a>
  );
}
function ProjectCard({
  project,
  index,
}: {
  project: OwnedProject;
  index: number;
}) {
  return (
    <article className={`project-card project-card-${index}`}>
      <div className="project-card-copy">
        <div className="project-category mono">{project.kind}</div>
        <div className="project-card-heading">
          <h3>
            <a href={project.url}>{project.name}</a>
          </h3>
          <span className="license">{project.license}</span>
        </div>
        <p>{projectCopy[project.name] ?? project.description}</p>
        <div className="project-card-footer">
          <span>{project.status}</span>
          <a href={project.url}>Source & documentation</a>
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const feed = getActivityFeed();
  const ledger = getOpenClawLedger();
  const summary = contributionSummary(feed.events, ledger.pullRequests);
  const work = currentWork(feed.events, ledger.pullRequests);
  const activity = latestActivity(feed.events);
  const featured = featuredNames
    .map((name) => ownedProjects.find((p) => p.name === name))
    .filter((p): p is OwnedProject => Boolean(p));
  const primaryPullRequests = ledger.pullRequests.slice(
    0,
    LEDGER_INITIAL_LIMIT,
  );
  const remainingPullRequests = ledger.pullRequests.slice(LEDGER_INITIAL_LIMIT);
  const nav = (
    <>
      <a href="#projects">Projects</a>
      <a href="#current-work">Current work</a>
      <a href="#contributions">Contributions</a>
      <a href="#activity">Activity</a>
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
            className="header-github"
            href={SITE_SOURCE}
            aria-label="Arca OSS on GitHub"
          >
            <GitHubIcon />
            <span>GitHub</span>
          </a>
          <details className="mobile-section-nav">
            <summary aria-label="Open navigation">
              <span />
              <span />
            </summary>
            <nav aria-label="Mobile navigation">
              {nav}
              <a href={SITE_SOURCE}>Site source </a>
            </nav>
          </details>
        </div>
      </header>
      <main id="top">
        <section className="hero container" aria-labelledby="hero-title">
          <div className="hero-copy" id="content" tabIndex={-1}>
            <p className="eyebrow">
              <span className="dot" /> TOOLS, CONTRIBUTIONS & FIELD NOTES
            </p>
            <h1 id="hero-title">
              Open source,
              <br />
              <em>from Arca.</em>
            </h1>
            <p className="hero-description">
              We build tools for developers and operators, contribute fixes to
              the software we use, and publish what we learn. This is our work,
              in one place.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#projects">
                Explore our projects{" "}
              </a>
              <a className="text-link" href="#contributions">
                See our contributions{" "}
              </a>
            </div>
            <div className="hero-note">
              <span>Built in Santiago, Chile. Open to everyone.</span>
            </div>
          </div>
          <aside className="working-notes" aria-label="Selected Arca work">
            <div className="notes-header">
              <span className="mono">FROM THE WORKBENCH</span>
              <span>Selected work</span>
            </div>
            <a
              className="working-note"
              href="https://github.com/arcabotai/clawfix"
            >
              <span className="note-label">A TOOL WE MAINTAIN</span>
              <h2>ClawFix</h2>
              <p>Diagnostics and guarded repair for OpenClaw operators.</p>
              <span className="note-meta">MIT · CLI · Maintained by Arca</span>
            </a>
            <a className="working-note" href="#current-work">
              <span className="note-label">WHERE WE’RE CONTRIBUTING</span>
              <h2>Hermes Agent & OpenClaw</h2>
              <p>
                Runtime reliability, safer remote access, and fixes that go back
                upstream.
              </p>
              <span className="note-meta">
                {work.length} open pull requests in our snapshots
              </span>
            </a>
            <a
              className="working-note"
              href="https://github.com/arcacomputer/headlong-agent-findings"
            >
              <span className="note-label">RESEARCH WE’VE PUBLISHED</span>
              <h2>Headlong Agent Findings</h2>
              <p>
                What a bounded persistent-agent experiment taught us about
                reliability.
              </p>
              <span className="note-meta">
                Public report & reproduction guide
              </span>
            </a>
          </aside>
        </section>
        <section
          className="stats-section container"
          aria-label="Our public work in numbers"
        >
          <div className="stats-grid">
            <a href="#projects">
              <strong>{ownedProjects.length}</strong>
              <span>Licensed Arca projects</span>
            </a>
            <a href="#contributions">
              <strong>{supportPrograms.length}</strong>
              <span>Upstream ecosystems</span>
            </a>
            <a href="#activity">
              <strong>{summary.mergedCount}</strong>
              <span>Authored PRs merged</span>
            </a>
            <a href="#contributions">
              <strong>{summary.mergedCreditCount}</strong>
              <span>Additional credited merges</span>
            </a>
          </div>
          <p className="snapshot-note">
            Counts from our public records.{" "}
            <a href="/activity.json">
              Activity snapshot: {day(feed.generatedAt)}
            </a>{" "}
            ·{" "}
            <a href="/openclaw-prs.json">OpenClaw: {day(ledger.generatedAt)}</a>
          </p>
        </section>
        <section
          className="intro-section container"
          aria-label="What Arca OSS delivers"
        >
          <div>
            <h2>Tools you can use.</h2>
            <p>
              Practical software for developers, node operators, and people
              building with agents.
            </p>
          </div>
          <div>
            <h2>Software made better.</h2>
            <p>
              Fixes, tests, and reviews contributed directly to the open-source
              projects we use.
            </p>
          </div>
          <div>
            <h2>Knowledge worth sharing.</h2>
            <p>
              Public research and reproducible findings, with the evidence
              behind the work.
            </p>
          </div>
        </section>
        <section
          className="section projects-section"
          id="projects"
          aria-labelledby="projects-title"
        >
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="eyebrow section-eyebrow">OUR PROJECTS</p>
                <h2 id="projects-title">Tools from Arca.</h2>
              </div>
              <p>
                Independent tools, experiments, and infrastructure.
                <br />
                Open code. Clear licenses. Yours to explore.
              </p>
            </div>
            <div className="featured-projects">
              {featured.map((p, i) => (
                <ProjectCard key={p.repository} project={p} index={i} />
              ))}
            </div>
            <details className="project-directory" id="project-directory">
              <summary>
                <span>
                  Explore all {ownedProjects.length} projects{" "}
                  <span className="directory-summary-sub">
                    Tools, research & public records
                  </span>
                </span>
                <span className="disclosure-icon" aria-hidden="true">
                  +
                </span>
              </summary>
              <div className="directory-content">
                <div className="project-controls" data-project-controls hidden>
                  <div
                    className="filter-buttons"
                    role="group"
                    aria-label="Filter projects"
                  >
                    {[
                      ["all", "All projects"],
                      ["tools", "Tools"],
                      ["research", "Research & prototypes"],
                      ["records", "Public records"],
                    ].map(([value, label]) => (
                      <button
                        type="button"
                        data-project-filter={value}
                        aria-pressed={value === "all"}
                        key={value}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <label className="search-box">
                    <span aria-hidden="true">⌕</span>
                    <span className="sr-only">Search projects</span>
                    <input
                      type="search"
                      placeholder="Find a project…"
                      data-project-search
                    />
                  </label>
                </div>
                <p
                  className="directory-count mono"
                  data-project-count
                  aria-live="polite"
                >
                  {ownedProjects.length} projects
                </p>
                <div className="project-list">
                  {ownedProjects.map((project, i) => (
                    <article
                      key={project.repository}
                      className="project-row"
                      data-project-category={
                        categories[project.name] ?? "tools"
                      }
                      data-project-name={`${project.name} ${project.description} ${project.kind}`}
                    >
                      <span className="project-number mono">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3>
                          <a href={project.url}>{project.name} </a>
                        </h3>
                        <p>{project.description}</p>
                        <details className="project-proof">
                          <summary>What's public</summary>
                          <p>{project.proof}</p>
                        </details>
                      </div>
                      <div className="project-row-meta">
                        <span className="license">{project.license}</span>
                        <span>{project.role}</span>
                        <span>{project.status}</span>
                      </div>
                    </article>
                  ))}
                </div>
                <p className="filter-empty" data-project-empty hidden>
                  No projects match. Try another search or category.
                </p>
                <p className="directory-note">
                  Every project listed carries an explicit open-source license.
                  Prototypes and archived findings are labelled.
                </p>
              </div>
            </details>
          </div>
        </section>
        <section
          className="section current-section container"
          id="current-work"
          aria-labelledby="current-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow section-eyebrow">
                <span className="dot" />
                CURRENT WORK
              </p>
              <h2 id="current-title">Current contributions.</h2>
            </div>
            <p>
              Open pull requests across the projects we use.
              <br />A dated view of work still moving upstream.
            </p>
          </div>
          <div className="current-layout">
            <aside className="current-aside">
              <div className="current-count">
                {work.length}
                <span>
                  open items
                  <br />
                  in our public snapshots
                </span>
              </div>
              <p>Follow the work as it happens.</p>
              <span>
                Each item links to its upstream discussion, where you can see
                the latest status and join in.
              </span>
              <a href="#activity" className="text-link">
                Browse the full activity{" "}
              </a>
            </aside>
            <div className="current-list">
              {work.slice(0, 4).map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
              {work.length > 4 ? (
                <details className="current-more">
                  <summary>
                    Show {work.length - 4} more open items{" "}
                    <span aria-hidden="true">+</span>
                  </summary>
                  {work.slice(4).map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </details>
              ) : null}
              {work.length === 0 ? (
                <p>
                  No open items in this snapshot. Explore the contribution
                  history below.
                </p>
              ) : null}
              <p className="snapshot-note">
                As recorded in the activity and OpenClaw snapshots above. Follow
                a PR for its live status.
              </p>
            </div>
          </div>
        </section>
        <section
          className="section contribution-section"
          id="contributions"
          aria-labelledby="contributions-title"
        >
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="eyebrow section-eyebrow">
                  UPSTREAM CONTRIBUTIONS
                </p>
                <h2 id="contributions-title">Where we contribute.</h2>
              </div>
              <p>
                We contribute to the projects we rely on.
                <br />
                Here’s where we help, and what we’ve delivered.
              </p>
            </div>
            <div className="ecosystem-grid">
              {supportPrograms.map((program) => (
                <article className="ecosystem-card" key={program.name}>
                  <div className="ecosystem-card-top">
                    <a
                      href={program.url}
                      className="ecosystem-logo"
                      aria-label={`${program.name} repository`}
                    >
                      <img
                        src={program.logo}
                        width="44"
                        height="44"
                        loading="lazy"
                        alt=""
                      />
                    </a>
                    <span className="ecosystem-role">{program.role}</span>
                  </div>
                  <h3>
                    <a href={program.url}>{program.name} </a>
                  </h3>
                  <p className="ecosystem-scope">
                    {program.scope.split(" · ").join(", ")}.
                  </p>
                  <div className="evidence-links">
                    <a href={program.evidence}>{program.evidenceLabel} </a>
                    {program.additionalEvidence?.map((item) => (
                      <a key={item.url} href={item.url}>
                        {item.label}{" "}
                      </a>
                    ))}
                  </div>
                  <details className="contribution-details">
                    <summary>Our role & contribution details</summary>
                    <p>{program.note}</p>
                  </details>
                </article>
              ))}
            </div>
            <p className="affiliation-note">
              Independent contributions, shared credit. Each project’s
              maintainers own the upstream decisions.
            </p>
          </div>
        </section>
        <section
          className="section activity-section container"
          id="activity"
          aria-labelledby="activity-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow section-eyebrow">THE PUBLIC RECORD</p>
              <h2 id="activity-title">The contribution record.</h2>
            </div>
            <a className="text-link" href="/activity.json">
              Machine-readable activity{" "}
            </a>
          </div>
          <div className="activity-toolbar">
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
            <span className="snapshot-note">
              Snapshot · {day(feed.generatedAt)}
            </span>
          </div>
          <div className="activity-list">
            {activity.map((event, i) => (
              <div
                key={event.id}
                data-activity-state={event.state}
                data-activity-item
                hidden={i >= 6}
              >
                <EventRow event={event} />
              </div>
            ))}
          </div>
          <p className="filter-empty" data-activity-empty hidden>
            No entries with this status in this snapshot.
          </p>
          <div className="activity-bottom">
            <span
              className="snapshot-note"
              data-activity-count
              aria-live="polite"
            >
              Showing {Math.min(6, activity.length)} of {activity.length}{" "}
              recorded items
            </span>
            <button
              type="button"
              className="button button-outline"
              data-activity-more
              hidden
            >
              Show more activity
            </button>
            <noscript>
              <a href="/activity.json">Read all activity </a>
            </noscript>
          </div>
          <details className="ledger-more" id="ledger">
            <summary>
              <span>
                OpenClaw contribution ledger{" "}
                <span className="directory-summary-sub">
                  {ledger.pullRequests.length} pull requests ·{" "}
                  {day(ledger.generatedAt)}
                </span>
              </span>
              <span className="disclosure-icon" aria-hidden="true">
                +
              </span>
            </summary>
            <div className="ledger-content">
              <p className="directory-note">
                Authored work, merged changes, and closed proposals retain their
                own status.{" "}
                <a href="https://github.com/arcabotai/arca-openclaw-contributions">
                  View the source ledger{" "}
                </a>
              </p>
              {[...primaryPullRequests, ...remainingPullRequests].map((pr) => (
                <a className="ledger-row" key={pr.number} href={pr.url}>
                  <span className="mono">#{pr.number}</span>
                  <span>
                    <strong>{pr.title}</strong>
                    <small>
                      @{pr.author ?? "arcabotai"} ·{" "}
                      {pr.state === "merged"
                        ? `Merged ${pr.mergedAt ? day(pr.mergedAt) : "upstream"}`
                        : pr.state === "closed"
                          ? "Closed without merge"
                          : (pr.arca?.currentWork ??
                            "Awaiting upstream review")}
                    </small>
                  </span>
                  <State state={pr.state} />
                </a>
              ))}
            </div>
          </details>
          <a className="section-return" href="#top">
            Back to top
          </a>
        </section>
        <section className="about-section" id="about">
          <div className="container about-layout">
            <div>
              <p className="eyebrow">SMALL TEAM. PUBLIC WORK.</p>
              <h2>
                A small team,
                <br />
                <em>working in public.</em>
              </h2>
            </div>
            <div className="about-copy">
              <p>
                Arca is an independent team building software in Santiago,
                Chile. Open source is part of how we work: practical tools,
                upstream fixes, and lessons made public.
              </p>
              <p>
                We start with a real problem, reproduce it, and work toward a
                useful change. Every project and contribution here links back to
                its source, so you can inspect it, use it, or build on it.
              </p>
              <a className="button button-lime" href="https://arcabot.ai">
                Meet Arca{" "}
              </a>
              <a className="about-source" href={SITE_SOURCE}>
                Improve this site on GitHub{" "}
              </a>
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
        <p>From Santiago, with source.</p>
        <div>
          <a href={SITE_SOURCE}>Site source </a>
          <a href="/oss.json">JSON index </a>
          <a href="mailto:contact@arca.computer">Get in touch </a>
        </div>
      </footer>
    </>
  );
}
