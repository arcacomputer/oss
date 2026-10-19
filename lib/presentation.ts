import type { ActivityEvent, PullRequestRecord } from "./data";

function canonicalUrl(value: string): string {
  try {
    const url = new URL(value);
    url.search = "";
    // A submitted review is its own receipt, even when it shares a PR URL.
    if (!/^#pullrequestreview-\d+$/.test(url.hash)) url.hash = "";
    url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString();
  } catch {
    return value.replace(/[?#].*$/, "").replace(/\/+$/, "");
  }
}

function timestamp(value: string): number {
  const time = Date.parse(value);
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}

/** One current receipt per destination, independent of the feed's input order. */
export function latestActivity(events: ActivityEvent[]): ActivityEvent[] {
  const latest = new Map<string, ActivityEvent>();
  for (const event of events) {
    const key = canonicalUrl(event.url);
    const previous = latest.get(key);
    if (
      !previous ||
      timestamp(event.updatedAt ?? event.occurredAt) >
        timestamp(previous.updatedAt ?? previous.occurredAt)
    ) {
      latest.set(key, event);
    }
  }
  return [...latest.values()].sort(
    (a, b) => timestamp(b.occurredAt) - timestamp(a.occurredAt),
  );
}

/** Prefer the most recently updated verified PR snapshot across both sources. */
export function latestPullRequestStates(
  events: ActivityEvent[],
  ledgerPrs: PullRequestRecord[],
): ActivityEvent[] {
  const states = new Map(
    latestActivity(
      events.filter((event) => event.type === "upstream_pr_state"),
    ).map((event) => [canonicalUrl(event.url), event]),
  );
  const ledger = new Map<string, PullRequestRecord>();
  for (const pr of ledgerPrs) {
    if (!pr.author) continue;
    const key = canonicalUrl(pr.url);
    const previous = ledger.get(key);
    if (!previous || timestamp(pr.updatedAt) > timestamp(previous.updatedAt))
      ledger.set(key, pr);
  }

  for (const [key, pr] of ledger) {
    const existing = states.get(key);
    if (
      existing &&
      timestamp(existing.updatedAt ?? existing.occurredAt) >
        timestamp(pr.updatedAt)
    ) continue;
    const repository = new URL(pr.url).pathname
      .split("/")
      .slice(1, 3)
      .join("/");
    states.set(key, {
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
          : pr.state === "closed"
            ? "Closed upstream without merge"
            : pr.statusLabel || "Open upstream"),
      url: pr.url,
      occurredAt:
        pr.state === "merged" ? pr.mergedAt || pr.updatedAt : pr.updatedAt,
      createdAt: pr.createdAt,
      updatedAt: pr.updatedAt,
      actor: pr.author!,
      role: "author",
      state: pr.state,
    });
  }

  return [...states.values()].sort(
    (a, b) => timestamp(b.occurredAt) - timestamp(a.occurredAt),
  );
}

export function currentWork(
  events: ActivityEvent[],
  ledgerPrs: PullRequestRecord[],
): ActivityEvent[] {
  return latestPullRequestStates(events, ledgerPrs).filter(
    (event) => event.state === "open",
  );
}

/** Keep directly authored merges separate from maintainer-authored merge credit. */
export function contributionSummary(
  events: ActivityEvent[],
  ledgerPrs: PullRequestRecord[],
) {
  const merged = new Set(
    latestPullRequestStates(events, ledgerPrs)
      .filter(
        (event) =>
          event.type === "upstream_pr_state" &&
          event.role === "author" &&
          event.state === "merged",
      )
      .map((event) => canonicalUrl(event.url)),
  );
  const credits = new Set(
    events
      .filter(
        (event) => event.type === "upstream_credit" && event.state === "merged",
      )
      .map((event) => canonicalUrl(event.url)),
  );

  return {
    mergedCount: merged.size,
    mergedCreditCount: credits.size,
    openCount: currentWork(events, ledgerPrs).length,
  };
}
