import { useEffect, useRef, useState } from "react";
import { Input, InputClear, InputGroup } from "@ui-sdk/react/input";
import { Button } from "@ui-sdk/react/button";
import {
  emptyExplorerState, explorerOutcomes, explorerRoles, explorerUrl,
  filterExplorerRecords, readExplorerState,
  type projectExplorerRecords,
} from "../../lib/contribution-explorer.mjs";

type ExplorerState = typeof emptyExplorerState;
type ExplorerRecord = ReturnType<typeof projectExplorerRecords>[number];

/** Controls only: the evidence stays in Home's static HTML, outside this island. */
export default function ContributionExplorer({ records }: { records: ExplorerRecord[] }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<ExplorerState>(emptyExplorerState);
  const [draft, setDraft] = useState("");
  const [shareUrl, setShareUrl] = useState("#past-work");
  const form = useRef<HTMLFormElement>(null);
  const matches = filterExplorerRecords(records, state);
  const projectCount = new Set(matches.map(record => record.project)).size;
  const projects = [...new Map(records.map(record => [record.project, record.name])).entries()]
    .sort((a, b) => a[1].localeCompare(b[1]));
  const filtered = Object.keys(emptyExplorerState).some(
    key => state[key as keyof ExplorerState] !== emptyExplorerState[key as keyof ExplorerState],
  );
  const focusSearch = () => form.current?.querySelector<HTMLInputElement>("input")?.focus();

  useEffect(() => {
    const restore = () => {
      const next = readExplorerState(window.location.search, records);
      setState(next);
      setDraft(next.q);
      setShareUrl(explorerUrl(window.location.href, next));
    };
    restore();
    setReady(true);
    window.addEventListener("popstate", restore);
    window.addEventListener("hashchange", restore);
    return () => {
      window.removeEventListener("popstate", restore);
      window.removeEventListener("hashchange", restore);
    };
  }, [records]);

  useEffect(() => {
    if (!ready) return;
    const root = document.getElementById("past-work");
    if (!root) return;
    const ids = new Set(matches.map(record => record.id));
    const projectIds = new Set(matches.map(record => record.project));
    root.querySelectorAll<HTMLElement>("[data-explorer-record]").forEach(row => {
      row.hidden = !ids.has(row.dataset.explorerRecord!);
    });
    root.querySelectorAll<HTMLElement>("[data-explorer-project]").forEach(card => {
      card.hidden = !projectIds.has(card.dataset.explorerProject!);
      const count = card.querySelector<HTMLElement>("[data-explorer-receipt-count]");
      if (count) {
        count.dataset.originalCount ??= count.textContent || "";
        count.textContent = filtered
          ? `${matches.filter(record => record.project === card.dataset.explorerProject).length} matching records`
          : count.dataset.originalCount;
      }
      // Additional curated links are context, not independently counted receipts.
      card.querySelectorAll<HTMLElement>(".curated-records").forEach(node => { node.hidden = filtered; });
      card.querySelectorAll<HTMLElement>("[data-explorer-project-totals]").forEach(node => { node.hidden = !filtered; });
    });
    const staticCount = root.querySelector<HTMLElement>("[data-history-count]");
    if (staticCount) staticCount.hidden = true;
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && root.contains(focused) && focused.closest("[hidden]")) focusSearch();
    // React owns only the controls; do not replace static evidence or disclosure state.
  }, [ready, state, records]);

  function apply(next: ExplorerState) {
    const href = explorerUrl(window.location.href, next);
    if (href !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.pushState(window.history.state, "", href);
    }
    setState(next);
    setDraft(next.q);
    setShareUrl(href);
  }
  function reset() {
    apply({ ...emptyExplorerState });
    focusSearch();
  }

  return (
    <div className="contribution-explorer" hidden={!ready}>
      <div className="explorer-heading">
        <div>
          <p className="eyebrow">FIND THE RECEIPT</p>
          <h4>Explore past contributions</h4>
        </div>
        <a className="explorer-share" href={shareUrl}>Link to these results</a>
      </div>
      <form ref={form} onSubmit={event => { event.preventDefault(); apply({ ...state, q: draft }); }}>
        <div className="explorer-search-row">
          <div className="explorer-search-field">
            <label htmlFor="contribution-search">Search contribution records</label>
            <InputGroup className="explorer-input-group">
              <Input id="contribution-search" type="search" value={draft}
                placeholder="Project, PR title, #number or contributor…"
                aria-describedby="explorer-search-help" autoComplete="off"
                onValueChange={(value, details) => {
                  setDraft(value);
                  if (details.reason === "clear-press") apply({ ...state, q: "" });
                }} />
              <InputClear className="explorer-clear" aria-label="Clear contribution search">Clear</InputClear>
            </InputGroup>
          </div>
          <Button type="submit" className="button button-primary">Search records</Button>
        </div>
        <p id="explorer-search-help" className="explorer-help">Press Enter or Search records to apply text. Filters apply immediately.</p>
        <div className="explorer-filters">
          <label htmlFor="contribution-project">Project
            <select id="contribution-project" value={state.project}
              onChange={event => apply({ ...state, q: draft, project: event.target.value })}>
              <option value="all">All projects</option>
              {projects.map(([repository, name]) => <option key={repository} value={repository}>{name}</option>)}
            </select>
          </label>
          <label htmlFor="contribution-outcome">Outcome
            <select id="contribution-outcome" value={state.outcome}
              onChange={event => apply({ ...state, q: draft, outcome: event.target.value })}>
              <option value="all">All outcomes</option>
              {Object.entries(explorerOutcomes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label htmlFor="contribution-role">Arca’s role
            <select id="contribution-role" value={state.role}
              onChange={event => apply({ ...state, q: draft, role: event.target.value })}>
              <option value="all">All roles</option>
              {Object.entries(explorerRoles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <Button type="button" className="button button-secondary explorer-reset" onClick={reset}>Reset filters</Button>
        </div>
      </form>
      <div className="explorer-result-bar">
        <p role="status" aria-live="polite" aria-atomic="true">
          <strong>{matches.length}</strong> of {records.length} records · {projectCount} {projectCount === 1 ? "project" : "projects"}
        </p>
        <span>Records are evidence, not additional contributions.</span>
      </div>
      {matches.length === 0 ? (
        <div className="explorer-empty">
          <h4>No matching records</h4>
          <p>Try a shorter search or a different outcome. Authored merges, credits, reviews and incorporation are separate records.</p>
          <Button type="button" className="button button-secondary" onClick={reset}>Show all past work</Button>
          <a href="#current-work">Looking for an open PR? View work in progress.</a>
        </div>
      ) : null}
    </div>
  );
}
