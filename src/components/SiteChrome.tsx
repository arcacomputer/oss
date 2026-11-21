import { companyName, siteSource } from "@/lib/site";

export function SiteHeader({ archive = false }: { archive?: boolean }) {
  const home = archive ? "/" : "";
  const links = (
    <>
      <a href={`${home}#contributions`} data-section-link={archive ? undefined : "contributions"}>Contributions</a>
      <a href={`${home}#projects`} data-section-link={archive ? undefined : "projects"}>Our software</a>
      <a href="/records/" aria-current={archive ? "page" : undefined}>Public records</a>
    </>
  );
  return (
    <>
      <a className="skip-link" href="#content">Skip to content</a>
      <header className="site-header">
        <div className="header-inner">
          <a className="company-name" href={archive ? "/" : "#top"}>{companyName}</a>
          <nav aria-label="Primary navigation">{links}</nav>
          <a className="button header-github" href={siteSource}>GitHub</a>
          <details className="mobile-section-nav">
            <summary>Menu</summary>
            <nav aria-label="Mobile navigation">
              {links}
              <a href={siteSource}>Site source on GitHub</a>
            </nav>
          </details>
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer container" id="about">
      <a className="company-name" href="https://arca.computer">{companyName}</a>
      <div>
        <a href="mailto:contact@arca.computer">Contact</a>
        <a href={siteSource}>Site source</a>
        <a className="section-return" href="#top">Back to top</a>
      </div>
    </footer>
  );
}
