import type { ActivityEvent, PullRequestRecord, SupportProgram } from "./data";
import { currentWork, latestActivity } from "./presentation";

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
  reviewedItems: ActivityEvent[];
  closedItems: ActivityEvent[];
  lastUpdated: string;
  allReceipts: ActivityEvent[];
  /** Curated receipts have no fabricated event dates or contribution counts. */
  curatedEvidence: Array<{ label: string; url: string }>;
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

function ledgerEvent(pr: PullRequestRecord): ActivityEvent {
  const repository = repositoryFromUrl(pr.url);
  return {
    id: `ledger:pr:${repository}:${pr.number}`,
    type: "upstream_pr_state",
    project: repository.split("/")[1] || repository,
    repository,
    number: pr.number,
    title: pr.title,
    summary:
      pr.arca?.currentWork ||
      (pr.state === "merged"
        ? "Merged upstream"
        : pr.state === "open"
          ? "Open upstream"
          : "Closed upstream without merge"),
    url: pr.url,
    occurredAt:
      pr.state === "merged" ? pr.mergedAt || pr.updatedAt : pr.updatedAt,
    actor: pr.author || "arcabotai",
    role: "author",
    state: pr.state,
  };
}

/** Group upstream work by project while keeping authored merges, credit, and closed work distinct. */
export function getContributionDirectory(
  events: ActivityEvent[],
  ledgerPrs: PullRequestRecord[],
  supportPrograms: SupportProgram[],
): { active: ContributionProject[]; past: ContributionProject[] } {
  const relevantEvents = events.filter(
    (event) =>
      isUpstream(event.repository) &&
      ["upstream_pr_state", "upstream_credit", "review_submitted"].includes(
        event.type,
      ),
  );
  const upstreamLedger = ledgerPrs.filter((pr) =>
    isUpstream(repositoryFromUrl(pr.url)),
  );
  const programs = new Map(
    supportPrograms.map((program) => [
      repositoryFromUrl(program.url).toLowerCase(),
      program,
    ]),
  );

  // PR states represent the latest transition; the ledger is an authoritative current snapshot.
  const latestPrs = new Map(
    latestActivity(
      relevantEvents.filter((event) => event.type === "upstream_pr_state"),
    ).map((event) => [receiptUrl(event.url), event]),
  );
  const latestLedger = new Map<string, PullRequestRecord>();
  for (const pr of upstreamLedger) {
    const key = receiptUrl(pr.url);
    const previous = latestLedger.get(key);
    if (!previous || Date.parse(pr.updatedAt) > Date.parse(previous.updatedAt))
      latestLedger.set(key, pr);
  }
  for (const [key, pr] of latestLedger) latestPrs.set(key, ledgerEvent(pr));

  const openItems = currentWork(relevantEvents, upstreamLedger);
  const mergedItems = [...latestPrs.values()].filter(
    (event) => event.state === "merged" && event.role === "author",
  );
  const closedItems = [...latestPrs.values()].filter(
    (event) => event.state === "closed",
  );
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

  // Older curated contributions can predate the activity feed. Keep their links visible,
  // without turning a status label into synthetic merged PR events or totals.
  const curatedHistory = new Set<string>();
  for (const program of supportPrograms) {
    const repository = repositoryFromUrl(program.url);
    const links = [
      program.evidence,
      ...(program.additionalEvidence || []).map((item) => item.url),
    ];
    if (
      isUpstream(repository) &&
      /merged/i.test(program.status) &&
      links.some((url) => /\/pull\/\d+(?:[/?#]|$)/.test(url))
    ) {
      curatedHistory.add(repository.toLowerCase());
      projectFor(repository);
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
          project.reviewedItems.length +
          project.closedItems.length >
          0 || curatedHistory.has(project.repository.toLowerCase()),
    ),
  };
}
