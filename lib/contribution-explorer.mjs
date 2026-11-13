export const explorerOutcomes = {
  merged: "Authored merge", credited: "Credited merge", reviewed: "Review submitted",
  incorporated: "Incorporated · original PR closed", "partially-incorporated": "Partially incorporated · original PR closed",
  integrated: "Manually integrated", closed: "Closed without merge",
};
export const explorerRoles = { author: "Author", credited: "Credited contributor", reviewer: "Reviewer" };
export const emptyExplorerState = { q: "", project: "all", outcome: "all", role: "all" };

/** @param {string} search @param {{project: string}[]} records */
export function readExplorerState(search, records) {
  const params = new URLSearchParams(search);
  const project = params.get("ce-project") || "all";
  const outcome = params.get("ce-outcome") || "all";
  const role = params.get("ce-role") || "all";
  return { q: params.get("ce-q") || "",
    project: records.some(record => record.project === project) ? project : "all",
    outcome: Object.hasOwn(explorerOutcomes, outcome) ? outcome : "all",
    role: Object.hasOwn(explorerRoles, role) ? role : "all" };
}

/** Relative same-origin navigation; preserve all unrelated state, including preview flags. */
export function explorerUrl(href, state) {
  const url = new URL(href);
  for (const key of Object.keys(emptyExplorerState)) {
    const param = `ce-${key}`;
    url.searchParams.delete(param);
    if (state[key] !== emptyExplorerState[key]) url.searchParams.set(param, state[key]);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

/** @param {ReturnType<typeof projectExplorerRecords>} records @param {typeof emptyExplorerState} state */
export function filterExplorerRecords(records, state) {
  const query = state.q.trim().toLowerCase();
  return records.filter(record =>
    (state.project === "all" || record.project === state.project) &&
    (state.outcome === "all" || record.outcome === state.outcome) &&
    (state.role === "all" || record.role === state.role) &&
    record.text.toLowerCase().includes(query));
}

/** @param {string} value */
export function safeEvidenceUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "github.com" && !url.username && !url.password
      ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/** A display projection only. Authoritative reconciliation stays in contributions.ts. */
/** @param {import('./contributions').ContributionProject[]} projects */
export function projectExplorerRecords(projects) {
  return projects.flatMap(project => project.allReceipts.filter(event => event.state !== "open").map(event => {
    const includes = items => items.some(item => item.id === event.id);
    const outcome = includes(project.creditItems) ? "credited"
      : includes(project.reviewedItems) ? "reviewed"
      : includes(project.manualItems) ? "integrated"
      : includes(project.incorporatedItems)
        ? event.contributionOutcome?.kind === "partially_incorporated" ? "partially-incorporated" : "incorporated"
      : includes(project.mergedItems) ? "merged" : "closed";
    return { id: event.id, project: project.repository, name: project.name,
      outcome, role: outcome === "credited" ? "credited" : outcome === "reviewed" ? "reviewer" : "author",
      text: `${project.name} ${project.repository} ${project.description} ${event.title} #${event.number} ${event.actor} ${event.role}` };
  }));
}
