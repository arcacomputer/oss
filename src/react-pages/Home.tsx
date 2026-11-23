import { ownedProjects, type ActivityEvent, type OwnedProject } from "@/lib/data";
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

function Cover() {
  return (
    <div className="cover">
      <div className="cover-layout container">
        <div className="cover-copy">
          <h1 id="hero-title">Open source,<br /><em>from Santiago.</em></h1>
          <p>We send patches to Hermes Agent, OpenClaw, and elizaOS. Follow a fix from proposal to merge, or explore the software we maintain ourselves.</p>
          <div className="cover-actions">
            <a className="button button-primary" href="#current-work">Work in progress</a>
            <a className="text-action" href="#past-work">Merged work</a>
          </div>
        </div>
        <figure className="cover-photograph">
          <img src="/santiago-1440.webp" srcSet="/santiago-720.webp 720w, /santiago-1440.webp 1440w"
            sizes="(max-width: 720px) 100vw, (max-width: 1400px) 54vw, 740px"
            width="1440" height="810" fetchPriority="high"
            alt="A red cable car crosses Santiago, with the snow-covered Andes behind the city." />
          <figcaption>
            <span>Cerro San Cristóbal, Santiago</span>
            <span><a href="https://commons.wikimedia.org/wiki/File:Santiago_de_Chile_y_Los_Andes_nevado_desde_el_telef%C3%A9rico_del_Cerro_San_Crist%C3%B3bal.jpg" title="Original photograph by Nbendersky, resized and cropped for display">Nbendersky</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a></span>
          </figcaption>
        </figure>
      </div>
    </div>
  );
}

// Profile names are the actual regression example in the original Hermes PR.
function ProfileExample() {
  return (
    <fieldset className="profile-example">
      <legend className="sr-only">Compare SSH profile mapping in Hermes Desktop</legend>
      <div className="example-top">
        <span>SSH profile mapping</span>
        <div className="example-choices">
          <label><input className="sr-only" type="radio" name="ssh-example" value="same" aria-describedby="profile-before-note" /><span>Before</span></label>
          <label><input className="sr-only" type="radio" name="ssh-example" value="mapped" aria-describedby="profile-after-note" defaultChecked /><span>After</span></label>
        </div>
      </div>
      <dl className="example-names">
        <div><dt>Desktop profile</dt><dd>work</dd></div>
        <div><dt>Remote profile</dt><dd><span className="profile-before">work</span><span className="profile-after">writer_2</span></dd></div>
      </dl>
      <p className="example-caption"><span className="profile-before" id="profile-before-note">Both machines used the desktop profile name, work.</span><span className="profile-after" id="profile-after-note">The desktop keeps work. The remote host opens writer_2.</span></p>
    </fieldset>
  );
}

function HermesContribution({ event }: { event: ActivityEvent }) {
  const origin = event.evidence?.originPullRequest;
  const count = event.evidence?.landedCommits?.length;
  return (
    <article className="patch-feature" aria-labelledby="featured-title">
      <div className="container patch-layout">
        <div className="patch-story">
          <div className="patch-byline"><span>Hermes Agent</span><RecordDate event={event} /></div>
          <h2 id="featured-title">Choosing the remote SSH profile</h2>
          <p>Connecting over SSH used to tie the remote profile to the name on your desktop. Our patch lets the two differ.
            {count ? ` An upstream maintainer merged ${count} of our commits.` : " An upstream maintainer incorporated our implementation."}</p>
          <div className="patch-links">
            {origin && <a href={safeEvidenceUrl(origin)}>Original proposal</a>}
            <a href={safeEvidenceUrl(event.url)}>Merged PR #{event.number}</a>
          </div>
        </div>
        <ProfileExample />
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
          <div className="work-byline"><span>{name}</span><RecordDate event={event} /></div>
          <h3><a href={safeEvidenceUrl(event.url)}>{title}</a></h3>
          <span className="pr-reference">PR #{event.number}</span>
        </li>
      ))}
    </ul>
  );
}

function SoftwareSample({ repository }: { repository: string }) {
  switch (repository) {
    case "arcacomputer/opencaster":
      return (
        <div className="sample-directory" aria-label="Opencaster repository structure">
          <div className="directory-sheet">
            <span className="directory-root">opencaster/</span>
            <ul className="directory-tree">
              <li>apps/web-client</li><li>apps/signer</li><li>services/gateway</li>
            </ul>
          </div>
        </div>
      );
    case "arcabotai/clawfix":
      return (
        <div className="sample-shell">
          <div className="shell-print">
            <span className="shell-label">Local diagnostics</span>
            <code><span aria-hidden="true">$ </span>clawfix <b>--dry-run</b></code>
            <span className="shell-note">Inspect the scan on your machine.</span>
          </div>
        </div>
      );
    case "arcabotai/a3stack":
      return (
        <div className="sample-stack" aria-label="A3Stack SDK packages">
          <ul><li>@a3stack/identity</li><li>@a3stack/payments</li><li>@a3stack/data</li></ul>
        </div>
      );
  }
  return null;
}

function SoftwareProject({ project }: { project: OwnedProject }) {
  return (
    <li className="shelf-project">
      <SoftwareSample repository={project.repository} />
      <div className="shelf-byline"><span>{project.kind}</span><span>{project.license}</span></div>
      <h3><a href={project.url}>{project.name}</a></h3>
      <p>{projectDescriptions[project.name] ?? project.description}</p>
      <div className="shelf-links">
        {project.name === "Opencaster" && <a href="https://opencaster.org">Open client</a>}
        <a href={project.url}>GitHub source<span className="sr-only"> for {project.name}</span></a>
      </div>
    </li>
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
          <section id="contributions" aria-labelledby="hero-title">
            <Cover />
            {credited && <HermesContribution event={credited} />}
            <div className="container contribution-columns">
              <section id="current-work" className="work-column" aria-labelledby="current-title">
                <h2 id="current-title">In progress</h2>
                <p className="work-explainer">Selected pull requests under review.</p>
                {current.length ? <ContributionList items={current} /> : <p>See the <a href="/records/#current-work">full list of open pull requests</a>.</p>}
              </section>
              <section id="past-work" className="work-column" aria-labelledby="history-title">
                <h2 id="history-title">Merged work</h2>
                <p className="work-explainer">Selected changes accepted upstream.</p>
                {merged.length ? <ContributionList items={merged} /> : <p>See the <a href="/records/#past-work">past contribution records</a>.</p>}
              </section>
            </div>
          </section>
          <section className="built-section" id="projects" aria-labelledby="projects-title">
            <div className="container">
              <div className="shelf-heading">
                <h2 id="projects-title">Software <em>we built.</em></h2>
                <p>A social client, an operator’s toolkit, and a TypeScript SDK. Each is open source and maintained by our team.</p>
              </div>
              <ul className="software-shelf">{software.map(project => <SoftwareProject key={project.repository} project={project} />)}</ul>
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
