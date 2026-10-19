import type { ActivityEvent, PullRequestRecord, SupportProgram } from "./data";
import { latestActivity, latestPullRequestStates } from "./presentation";

export type ContributionProject = {
  repository: string;
  name: string;
  url: string;
  logo?: string;
  logoStyle?: SupportProgram["logoStyle"];
  role: string;
  description: string;
  scope: string;
  note: string;
  openItems: ActivityEvent[];
  mergedItems: ActivityEvent[];
  creditItems: ActivityEvent[];
  manualItems: ActivityEvent[];
  incorporatedItems: ActivityEvent[];
  reviewedItems: ActivityEvent[];
  closedItems: ActivityEvent[];
  lastUpdated: string;
  allReceipts: ActivityEvent[];
  /** Curated receipts have no fabricated event dates or contribution counts. */
  curatedEvidence: Array<{ label: string; url: string }>;
};

export type ContributionScope = {
  authors: readonly string[];
  since: string;
};

const defaultScope: ContributionScope = {
  authors: ["felirami", "arcabotai"],
  since: "2026-02-12",
};

const internalOwners = new Set(["arcabotai", "arcacomputer", "felirami"]);

function repositoryFromUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.hostname.toLowerCase() !== "github.com") return "";
    return url.pathname.split("/").filter(Boolean).slice(0, 2).join("/");
  } catch {
    return "";
  }
}

function isUpstream(repository: string): boolean {
  const parts = repository.split("/");
  return (
    parts.length === 2 &&
    parts.every(Boolean) &&
    !internalOwners.has(parts[0].toLowerCase())
  );
}

function receiptUrl(value: string): string {
  try {
    const url = new URL(value);
    url.search = "";
    if (!/^#pullrequestreview-\d+$/.test(url.hash)) url.hash = "";
    url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString();
  } catch {
    return value;
  }
}

function readableName(value: string): string {
  const names: Record<string, string> = {
    openssl: "OpenSSL",
    numpy: "NumPy",
    tokenizers: "Hugging Face Tokenizers",
    kafka: "Apache Kafka",
  };
  if (names[value]) return names[value];
  if (/[A-Z]/.test(value) || /\s/.test(value)) return value;
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** Group upstream work by project while keeping authored merges, credit, and closed work distinct. */
export function getContributionDirectory(
  events: ActivityEvent[],
  ledgerPrs: PullRequestRecord[],
  supportPrograms: SupportProgram[],
  scope: ContributionScope = defaultScope,
): { active: ContributionProject[]; past: ContributionProject[] } {
  const authors = new Set(scope.authors.map((author) => author.toLowerCase()));
  const since = Date.parse(scope.since);
  const isInScope = (actor: string | undefined, date: string) =>
    typeof actor === "string" &&
    authors.has(actor.toLowerCase()) &&
    Date.parse(date) >= since;
  const relevantEvents = events.filter(
    (event) =>
      isUpstream(event.repository) &&
      isInScope(event.actor, event.occurredAt) &&
      (event.type !== "upstream_pr_state" ||
        isInScope(
          event.actor,
          event.createdAt ?? event.occurredAt,
        )) &&
      ["upstream_pr_state", "upstream_credit", "upstream_manual_integration", "review_submitted"].includes(
        event.type,
      ),
  );
  const upstreamLedger = ledgerPrs.filter(
    (pr): pr is PullRequestRecord & { author: string } =>
      isUpstream(repositoryFromUrl(pr.url)) &&
      isInScope(
        pr.author,
        pr.createdAt ?? pr.updatedAt,
      ),
  );
  const programs = new Map(
    supportPrograms.map((program) => [
      repositoryFromUrl(program.url).toLowerCase(),
      program,
    ]),
  );

  const latestPrs = latestPullRequestStates(relevantEvents, upstreamLedger);
  const openItems = latestPrs.filter((event) => event.state === "open");
  const mergedItems = latestPrs.filter(
    (event) => event.state === "merged" && event.role === "author",
  );
  const closedItems = latestPrs.filter(
    (event) => event.state === "closed" && !event.contributionOutcome,
  );
  const incorporatedItems = latestPrs.filter((event) => event.state === "closed" && event.contributionOutcome);
  const manualItems = latestActivity(relevantEvents.filter((event) => event.type === "upstream_manual_integration" && event.state === "integrated"));
  const creditItems = latestActivity(
    relevantEvents.filter(
      (event) => event.type === "upstream_credit" && event.state === "merged",
    ),
  );
  const reviewedItems = latestActivity(
    relevantEvents.filter((event) => event.type === "review_submitted"),
  );

  const projects = new Map<string, ContributionProject>();
  function projectFor(
    repository: string,
    event?: ActivityEvent,
  ): ContributionProject {
    const key = repository.toLowerCase();
    const existing = projects.get(key);
    if (existing) return existing;
    const program = programs.get(key);
    const name =
      program?.name || readableName(event?.project || repository.split("/")[1]);
    const evidence = program
      ? [
          { label: program.evidenceLabel, url: program.evidence },
          ...(program.additionalEvidence || []),
        ]
      : [];
    const uniqueEvidence = new Map(
      evidence.map((item) => [receiptUrl(item.url), item]),
    );
    const project: ContributionProject = {
      repository,
      name,
      url: program?.url || `https://github.com/${repository}`,
      logo: program?.logo,
      logoStyle: program?.logoStyle,
      role:
        program?.role ||
        (event?.type === "review_submitted"
          ? "upstream reviewer"
          : "upstream contributor"),
      description: program?.scope || event?.title || "",
      scope: program?.scope || "",
      note: program?.note || "",
      openItems: [],
      mergedItems: [],
      creditItems: [],
      manualItems: [],
      incorporatedItems: [],
      reviewedItems: [],
      closedItems: [],
      lastUpdated: "",
      allReceipts: [],
      curatedEvidence: [...uniqueEvidence.values()],
    };
    projects.set(key, project);
    return project;
  }

  const categories = {
    openItems,
    mergedItems,
    creditItems,
    manualItems,
    incorporatedItems,
    reviewedItems,
    closedItems,
  };
  for (const [category, receipts] of Object.entries(categories)) {
    for (const event of receipts) {
      projectFor(event.repository, event)[
        category as keyof typeof categories
      ].push(event);
    }
  }

  for (const project of projects.values()) {
    for (const category of Object.keys(categories) as Array<
      keyof typeof categories
    >) {
      project[category].sort(
        (a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt),
      );
    }
    const receipts = new Map<string, ActivityEvent>();
    for (const event of Object.keys(categories).flatMap(
      (category) => project[category as keyof typeof categories],
    )) {
      receipts.set(`${event.type}:${receiptUrl(event.url)}`, event);
    }
    project.allReceipts = [...receipts.values()].sort(
      (a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt),
    );
    project.lastUpdated = project.allReceipts[0]?.occurredAt || "";
  }

  const sorted = [...projects.values()].sort((a, b) => {
    const aTime = a.lastUpdated
      ? Date.parse(a.lastUpdated)
      : Number.NEGATIVE_INFINITY;
    const bTime = b.lastUpdated
      ? Date.parse(b.lastUpdated)
      : Number.NEGATIVE_INFINITY;
    return bTime - aTime || a.name.localeCompare(b.name);
  });
  return {
    active: sorted.filter((project) => project.openItems.length > 0),
    past: sorted.filter(
      (project) =>
        project.mergedItems.length +
          project.creditItems.length +
          project.manualItems.length +
          project.incorporatedItems.length +
          project.reviewedItems.length +
          project.closedItems.length >
        0,
    ),
  };
}
