import type { ActivityEvent, OwnedProject } from "@/lib/data";
import { ownedProjects } from "@/lib/data";
import { safeEvidenceUrl } from "@/lib/contribution-explorer.mjs";
import { getTrackedDirectory } from "@/lib/site-directory";
import { SiteHeader, SiteFooter } from "@/src/components/SiteChrome";
import { projectDescriptions, selectedContributions, selectedSoftware } from "@/lib/catalog";

const date = new Intl.DateTimeFormat("en-US", {
  month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
});

function RecordDate({ event }: { event: ActivityEvent }) {
  return <time dateTime={event.occurredAt}>{date.format(new Date(event.occurredAt))}</time>;
}

function HermesContribution({ event }: { event: ActivityEvent }) {
  const origin = event.evidence?.originPullRequest;
  const count = event.evidence?.landedCommits?.length;
  return (
    <article className="featured-contribution" aria-labelledby="featured-title">
      <div className="featured-source"><span>Hermes Agent</span><RecordDate event={event} /></div>
      <h2 id="featured-title">Remote profiles in Hermes Desktop</h2>
      <p>Our change lets an SSH connection use a different profile name on the remote machine.
        {count ? ` An upstream maintainer merged ${count} of our commits.` : " An upstream maintainer incorporated our implementation."}</p>
      <div className="featured-links">
        {origin && <a href={safeEvidenceUrl(origin)}>Our proposal</a>}
        <a href={safeEvidenceUrl(event.url)}>Merged pull request #{event.number}</a>
      </div>
    </article>
  );
}

type WorkItem = { name: string; title: string; event: ActivityEvent };

function ContributionList({ items }: { items: WorkItem[] }) {
  return (
    <ul className="selected-work">
      {items.map(({ name, title, event }) => (
        <li key={event.url}>
          <span className="project-label">{name}</span>
          <h3><a href={safeEvidenceUrl(event.url)}>{title}</a></h3>
          <div className="work-source"><span>PR #{event.number}</span><RecordDate event={event} /></div>
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  const directory = getTrackedDirectory();
  const credited = directory.past.find(p => p.repository === "NousResearch/hermes-agent")
    ?.creditItems.find(event => event.number === 76400);
  const upstream = new Map([...directory.active, ...directory.past].map(project => [project.repository, project]));
  const selected: WorkItem[] = selectedContributions.flatMap(({ repository, number, title }) => {
    const project = upstream.get(repository);
    const event = project && [...project.openItems, ...project.mergedItems].find(item => item.number === number);
    return project && event ? [{ name: project.name, title, event }] : [];
  });
  const current = selected.filter(({ event }) => event.state === "open");
  const merged = selected.filter(({ event }) => event.state === "merged")
    .sort((a, b) => b.event.occurredAt.localeCompare(a.event.occurredAt));
  const software = selectedSoftware.map(repository => ownedProjects.find(project => project.repository === repository))
    .filter((project): project is OwnedProject => Boolean(project));

  return (
    <>
      <SiteHeader />
      <main id="top">
        <div id="content" tabIndex={-1}>
          <section id="contributions" aria-labelledby="hero-title" className="container">
            <div className="hero-surface">
              <div className="hero-copy">
                <h1 id="hero-title">Open-source <span>contributions</span></h1>
                <p className="hero-description">From Santiago, Chile, we contribute code to the open-source projects we use.
                  Our work includes remote access in Hermes Agent, worker reliability in OpenClaw, and Google sign-in for elizaOS.</p>
                <div className="hero-actions">
                  <a className="button button-primary" href="#current-work">Work in progress</a>
                  <a className="text-action" href="#past-work">Merged work</a>
                </div>
              </div>
              {credited && <HermesContribution event={credited} />}
            </div>
            <section className="selection-section" id="current-work" aria-labelledby="current-title">
              <div className="selection-heading">
                <h2 id="current-title">In progress</h2>
                <p>Selected pull requests still under upstream review.</p>
              </div>
              {current.length ? <ContributionList items={current} /> : <p>There are no featured pull requests in review. <a href="/records/#current-work">Browse the open record</a>.</p>}
            </section>
            <section className="selection-section" id="past-work" aria-labelledby="history-title">
              <div className="selection-heading">
                <h2 id="history-title">Merged work</h2>
                <p>Selected changes that upstream maintainers accepted.</p>
              </div>
              {merged.length ? <ContributionList items={merged} /> : <p>See the <a href="/records/#past-work">past contribution records</a> for accepted changes.</p>}
            </section>
          </section>
          <section className="built-section" id="projects" aria-labelledby="projects-title">
            <div className="container selection-section">
              <div className="selection-heading">
                <h2 id="projects-title">Software we built</h2>
                <p>Open-source software we develop and maintain.</p>
              </div>
              <ul className="built-software">
                {software.map(project => (
                  <li key={project.repository}>
                    <h3><a href={project.url}>{project.name}</a></h3>
                    <p>{projectDescriptions[project.name] ?? project.description}</p>
                    <span className="work-source">{project.license} · {project.kind}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
          <section id="records" className="container record-shortcuts" aria-labelledby="public-records-title">
            <div>
              <h2 id="public-records-title"><a href="/records/">Public records</a></h2>
              <p>Search the full contribution history or inspect the original GitHub data.</p>
            </div>
            <nav aria-label="Record collections">
              <a href="/records/#past-work">Contribution history</a>
              <a id="activity" href="/records/#activity">Activity feed</a>
              <a id="repository-inventory" href="/records/#repository-inventory">Repository inventory</a>
              <a id="ledger" href="/records/#ledger">OpenClaw ledger</a>
            </nav>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
