import activityJson from "@/public/activity.json";
import openClawLedgerJson from "@/public/openclaw-prs.json";

export type ActivityEventType =
  | "upstream_pr_state"
  | "upstream_credit"
  | "review_submitted"
  | "release"
  | "project_published";

export type ActivityEvent = {
  id: string;
  type: ActivityEventType;
  project: string;
  repository: string;
  number?: number;
  title: string;
  summary: string;
  url: string;
  occurredAt: string;
  actor: string;
  role: string;
  state: string;
};

export type ActivityFeed = {
  schemaVersion: number;
  generatedAt: string;
  cadence: string;
  events: ActivityEvent[];
};

export type OwnedProject = {
  name: string;
  repository: string;
  url: string;
  role: "maintainer" | "publisher" | "steward";
  kind: string;
  license: string;
  status: string;
  description: string;
  proof: string;
};

export type SupportProgram = {
  name: string;
  url: string;
  logo: string;
  logoStyle?: "mark" | "wide";
  role: string;
  scope: string;
  status: string;
  evidence: string;
  evidenceLabel: string;
  additionalEvidence?: Array<{
    label: string;
    url: string;
  }>;
  note: string;
};

export type UpstreamMergeCredit = {
  project: string;
  number: number;
  title: string;
  url: string;
  mergedAt: string;
  implementationCommit: string;
  additionalImplementationCommits?: string[];
  mergeCommit: string;
  originUrl: string;
  credit: "co-author" | "commit author";
};

export type ContributionIdentity = {
  login: string;
  role: string;
  since: string | null;
};

export type PullRequestRecord = {
  number: number;
  author?: string;
  identityRole?: string;
  title: string;
  url: string;
  state: "open" | "closed" | "merged";
  updatedAt: string;
  mergedAt: string | null;
  headSha: string;
  ratingLabel: string | null;
  statusLabel: string | null;
  arca?: {
    workStatus?: string;
    currentWork?: string;
  };
};

export type OpenClawLedger = {
  generatedAt: string;
  source: string;
  authors?: ContributionIdentity[];
  pullRequests: PullRequestRecord[];
};

export const ownedProjects: OwnedProject[] = [
  {
    name: "ClawFix",
    repository: "arcabotai/clawfix",
    url: "https://github.com/arcabotai/clawfix",
    role: "maintainer",
    kind: "operator diagnostics",
    license: "MIT",
    status: "maintained",
    description:
      "Deterministic OpenClaw diagnostics and guarded repairs, with optional AI explanation that never becomes executable shell.",
    proof: "The CLI, installer, tests, security model, capability contract, and releases are public.",
  },
  {
    name: "Hypersnap Doctor",
    repository: "arcabotai/hypersnapdoctor",
    url: "https://github.com/arcabotai/hypersnapdoctor",
    role: "maintainer",
    kind: "node operations",
    license: "MIT",
    status: "maintained",
    description:
      "Independent diagnostics, safe repair, and sanitized support tooling for Hypersnap and Snapchain node operators.",
    proof: "The operator CLI, installer, safety model, and local test suite are public.",
  },
  {
    name: "A3Stack",
    repository: "arcabotai/a3stack",
    url: "https://github.com/arcabotai/a3stack",
    role: "maintainer",
    kind: "agent infrastructure",
    license: "MIT",
    status: "maintained",
    description:
      "A TypeScript SDK joining agent identity, payments, data, and MCP tooling without pretending those layers already fit together.",
    proof: "Source, examples, package manifests, and license live in the repository.",
  },

  {
    name: "Ardea Knowledge Steward",
    repository: "arcabotai/ardea-knowledge-steward",
    url: "https://github.com/arcabotai/ardea-knowledge-steward",
    role: "steward",
    kind: "provenance-aware Q&A",
    license: "Apache-2.0",
    status: "public prototype",
    description:
      "A source-labelled knowledge agent and bundle for Hypersnap, Snapchain, and Farcaster-fork operators.",
    proof: "The prototype, source corpus, roadmap, and unfinished bot-hardening boundaries are public.",
  },
  {
    name: "OpenClaw Contributions",
    repository: "arcabotai/arca-openclaw-contributions",
    url: "https://github.com/arcabotai/arca-openclaw-contributions",
    role: "publisher",
    kind: "contribution ledger",
    license: "MIT",
    status: "live ledger",
    description:
      "A machine-readable, evidence-backed record of upstream issues, technical comments, proofs, and pull requests.",
    proof: "Every record requires a public URL. Open, closed, and merged work stay distinct.",
  },
  {
    name: "OpenClaw TUI Field Fix",
    repository: "arcabotai/openclaw-tui-deliver-stuck-spinner",
    url: "https://github.com/arcabotai/openclaw-tui-deliver-stuck-spinner",
    role: "publisher",
    kind: "diagnostic artifact",
    license: "MIT",
    status: "archived finding",
    description:
      "A root-cause write-up and runnable local patch for the OpenClaw TUI stuck-spinner delivery failure.",
    proof: "The symptom, exact version boundary, upstream trackers, patch, and reproduction are public.",
  },
  {
    name: "OrthoVoxel Studio",
    repository: "felirami/orthovoxel-studio",
    url: "https://github.com/felirami/orthovoxel-studio",
    role: "maintainer",
    kind: "creative tooling",
    license: "MIT",
    status: "maintained",
    description:
      "A desktop pixel-art tool for rebuilding voxel models from orthographic views and exporting directional sprite sheets.",
    proof: "The original implementation, Electron app, Playwright verification, and license are public.",
  },
  {
    name: "OpenChina",
    repository: "felirami/openchina",
    url: "https://github.com/felirami/openchina",
    role: "maintainer",
    kind: "model behavior research",
    license: "MIT",
    status: "published",
    description:
      "A CLI harness for comparing whether language models refuse, evade, deny, or substantively answer a documented historical question.",
    proof: "The test suites, provider adapters, scoring boundaries, npm package, and license are public.",
  },
  {
    name: "Headlong Agent Findings",
    repository: "arcacomputer/headlong-agent-findings",
    url: "https://github.com/arcacomputer/headlong-agent-findings",
    role: "publisher",
    kind: "persistent-agent research",
    license: "MIT",
    status: "published findings",
    description:
      "Sanitized findings from a bounded persistent-agent experiment, including reliability failures and a RepoRelay case study.",
    proof: "The report, measured outputs, limitations, reproduction guide, and privacy methodology are public.",
  },
  {
    name: "Arca OSS Index",
    repository: "arcacomputer/oss",
    url: "https://github.com/arcacomputer/oss",
    role: "publisher",
    kind: "public engineering index",
    license: "MIT",
    status: "live index",
    description:
      "The source, machine-readable records, claim checks, and refresh jobs behind this public index.",
    proof: "The site source, activity feed, claims validator, CI, and license are public.",
  },
];

export const clickClackMergeCredits: UpstreamMergeCredit[] = [
  {
    project: "ClickClack",
    number: 91,
    title: "feat: add integration history helpers",
    url: "https://github.com/openclaw/clickclack/pull/91",
    mergedAt: "2026-07-17T04:25:50Z",
    implementationCommit: "79d96964549d020143d50cbc4794ad460bf1ed87",
    mergeCommit: "3e1d2841a314c139c1f053605dbb6d94d9e81a07",
    originUrl: "https://github.com/openclaw/clickclack/pull/78",
    credit: "co-author",
  },
  {
    project: "ClickClack",
    number: 92,
    title: "feat: add typed agent progress events",
    url: "https://github.com/openclaw/clickclack/pull/92",
    mergedAt: "2026-07-17T04:37:02Z",
    implementationCommit: "068ce38bf1e93e8caec8090dcbc573fb4a48bf45",
    mergeCommit: "064a46fc73e11dff15cc2af03e631a28b42ddef1",
    originUrl: "https://github.com/openclaw/clickclack/pull/78",
    credit: "co-author",
  },
];

export const hermesMergeCredits: UpstreamMergeCredit[] = [
  {
    project: "Hermes Agent",
    number: 76400,
    title: "fix(desktop): map SSH profiles to remote profiles",
    url: "https://github.com/NousResearch/hermes-agent/pull/76400",
    mergedAt: "2026-08-01T21:30:17Z",
    implementationCommit: "e1c1af9378d441e89a0e3cf4bd6979565168ef42",
    additionalImplementationCommits: [
      "84838ec21ba4b049d6ca66b1c1bf7f2fb5f42300",
      "e2095dd77ea4211a2c4ad75c9069193acca2a155",
      "ffd9a9e78fbf135e6029c921e67b53460a55044d",
      "c444915f21d3a85220adbdb64069626c7281b8d9",
    ],
    mergeCommit: "8b8ebc26bb5a433c1975615c7c8e4a0182d94f36",
    originUrl: "https://github.com/NousResearch/hermes-agent/pull/74779",
    credit: "commit author",
  },
];

export const supportPrograms: SupportProgram[] = [
  {
    name: "elizaOS",
    url: "https://github.com/elizaOS/eliza",
    logo: "/upstream/eliza.png",
    role: "upstream contributor",
    scope: "onboarding security · OAuth · transaction safety · runtime and UI reliability · tests and CI",
    status: "active · merged contributions",
    evidence: "https://github.com/elizaOS/eliza/pulls?q=is%3Apr+is%3Amerged+author%3Afelirami",
    evidenceLabel: "15 merged PRs by @felirami",
    additionalEvidence: [
      {
        label: "merged PR #18101 by @arcabotai",
        url: "https://github.com/elizaOS/eliza/pull/18101",
      },
    ],
    note: "Sixteen directly authored pull requests have merged across Arca's @felirami and @arcabotai identities. Arca contributes upstream but does not claim elizaOS ownership or maintenance.",
  },
  {
    name: "Hermes Agent",
    url: "https://github.com/NousResearch/hermes-agent",
    logo: "/upstream/hermes.png",
    role: "upstream contributor",
    scope: "remote profile mapping · SSH token boundaries · Unix and Windows lifecycle tests",
    status: "merged authorship",
    evidence: "https://github.com/NousResearch/hermes-agent/pull/76400",
    evidenceLabel: "merged PR #76400",
    additionalEvidence: [
      {
        label: "origin PR #74779",
        url: "https://github.com/NousResearch/hermes-agent/pull/74779",
      },
    ],
    note: "Hermes merged five Cad-authored commits through maintainer PR #76400, with @arcabotai mapped in the contributor record. Arca is an independent contributor, not a Nous Research maintainer or affiliate.",
  },
  {
    name: "SlimeVR CheeseCake",
    url: "https://github.com/Sorakage033/SlimeVR-CheeseCake",
    logo: "/upstream/slimevr.png",
    role: "upstream contributor",
    scope: "hardware documentation · 3D-printing instructions · fabrication assets · battery guidance",
    status: "3 merged contributions",
    evidence: "https://github.com/Sorakage033/SlimeVR-CheeseCake/pull/1",
    evidenceLabel: "merged PR #1",
    additionalEvidence: [
      { label: "merged PR #6", url: "https://github.com/Sorakage033/SlimeVR-CheeseCake/pull/6" },
      { label: "merged PR #9", url: "https://github.com/Sorakage033/SlimeVR-CheeseCake/pull/9" },
    ],
    note: "Felirami authored three merged documentation and fabrication-asset pull requests. Arca does not claim SlimeVR CheeseCake ownership or maintenance.",
  },
  {
    name: "OpenClaw",
    url: "https://github.com/openclaw/openclaw",
    logo: "/upstream/openclaw.svg",
    role: "upstream contributor",
    scope: "bug reports · source diagnosis · runtime proof · pull requests",
    status: "active",
    evidence: "https://github.com/arcabotai/arca-openclaw-contributions",
    evidenceLabel: "contribution ledger",
    note: "Arca is an independent contributor, not an OpenClaw maintainer or affiliate.",
  },
  {
    name: "OpenClaw / Crabbox",
    url: "https://github.com/openclaw/crabbox",
    logo: "/upstream/crabbox.jpg",
    logoStyle: "wide",
    role: "upstream contributor",
    scope: "Blaxel lifecycle policy · document-safe labels · filesystem path correctness",
    status: "merged contribution",
    evidence: "https://github.com/openclaw/crabbox/pull/1192",
    evidenceLabel: "merged PR #1192",
    note: "Arca authored the merged Crabbox fix. Arca is not an OpenClaw or Crabbox maintainer or affiliate.",
  },
  {
    name: "Buzz",
    url: "https://github.com/block/buzz",
    logo: "/upstream/buzz.png",
    role: "upstream contributor · reviewer",
    scope: "ACP startup diagnostics · runtime-backed code review",
    status: "active",
    evidence: "https://github.com/block/buzz/pull/3963",
    evidenceLabel: "open PR #3963",
    additionalEvidence: [
      {
        label: "review #3894",
        url: "https://github.com/block/buzz/pull/3894#pullrequestreview-4831913754",
      },
    ],
    note: "PR #3963 remains under upstream review; authored work is not presented as merged. Arca is not a Block or Buzz maintainer or affiliate.",
  },
  {
    name: "Hypersnap / Snapchain",
    url: "https://github.com/farcasterorg/hypersnap",
    logo: "/upstream/hypersnap.png",
    logoStyle: "wide",
    role: "tooling maintainer · upstream reviewer",
    scope: "operator CLI · diagnostics · safe repair · requested-changes review",
    status: "active",
    evidence: "https://github.com/arcabotai/hypersnap",
    evidenceLabel: "operator toolkit",
    additionalEvidence: [
      {
        label: "review #10",
        url: "https://github.com/farcasterorg/hypersnap/pull/10#pullrequestreview-4177281968",
      },
    ],
    note: "Arca maintains independent tooling and submitted a public security/correctness review; upstream ownership stays upstream.",
  },
  {
    name: "ClickClack",
    url: "https://github.com/openclaw/clickclack",
    logo: "/upstream/clickclack.png",
    role: "upstream co-contributor",
    scope: "integration history helpers · typed agent progress SDK",
    status: "merged credit",
    evidence: "https://github.com/openclaw/clickclack/pull/91",
    evidenceLabel: "merged PR #91",
    additionalEvidence: [
      {
        label: "merged PR #92",
        url: "https://github.com/openclaw/clickclack/pull/92",
      },
      {
        label: "origin PR #78",
        url: "https://github.com/openclaw/clickclack/pull/78",
      },
    ],
    note: "ClickClack maintainers extracted two generic capabilities from Arca's closed connector proposal. Each merged implementation commit retains Cad's co-author credit, and its exact-commit changelog credits @arcabotai. Arca is not a ClickClack maintainer or affiliate.",
  },
];

const fallbackLedger: OpenClawLedger = {
  generatedAt: "2026-07-17T13:45:57+00:00",
  source: "https://github.com/openclaw/openclaw",
  authors: [
    { login: "arcabotai", role: "Arca agent identity", since: null },
    { login: "felirami", role: "Arca founder", since: "2026-02-12" },
  ],
  pullRequests: [
    {
      number: 107963,
      author: "arcabotai",
      identityRole: "Arca agent identity",
      title: "fix(update): reject npm redacted global root paths",
      url: "https://github.com/openclaw/openclaw/pull/107963",
      state: "open",
      updatedAt: "2026-07-16T06:21:02Z",
      mergedAt: null,
      headSha: "a4e3041b8660fadcd1615e5d15b30d30e859e666",
      ratingLabel: "🦪 silver shellfish",
      statusLabel: "📣 needs proof",
    },
    {
      number: 107901,
      author: "felirami",
      identityRole: "Arca founder",
      title: "fix(update): reject npm redacted global root paths",
      url: "https://github.com/openclaw/openclaw/pull/107901",
      state: "closed",
      updatedAt: "2026-07-15T03:27:44Z",
      mergedAt: null,
      headSha: "1dab58ea4d0a61221c9d7884b5a8bc9d1c043511",
      ratingLabel: null,
      statusLabel: null,
    },
    {
      number: 107304,
      author: "felirami",
      identityRole: "Arca founder",
      title: "fix(zai): Coding Plan chat turns always fail with fake rate-limit when system prompt carries OpenClaw signature line",
      url: "https://github.com/openclaw/openclaw/pull/107304",
      state: "closed",
      updatedAt: "2026-07-15T02:30:52Z",
      mergedAt: null,
      headSha: "179050b9ef194efc7bc68b3d5375233600f09b8f",
      ratingLabel: null,
      statusLabel: null,
    },
    {
      number: 107276,
      author: "arcabotai",
      identityRole: "Arca agent identity",
      title: "fix(memory-core): preserve canonical embedding cache on migration",
      url: "https://github.com/openclaw/openclaw/pull/107276",
      state: "closed",
      updatedAt: "2026-07-14T08:37:48Z",
      mergedAt: null,
      headSha: "3072762c82526c0fce27804c6b3839f0002db49a",
      ratingLabel: null,
      statusLabel: null,
    },
    {
      number: 107243,
      author: "felirami",
      identityRole: "Arca founder",
      title: "fix(memory-core): preserve canonical cache rows during legacy migration",
      url: "https://github.com/openclaw/openclaw/pull/107243",
      state: "merged",
      updatedAt: "2026-07-14T16:40:40Z",
      mergedAt: "2026-07-14T16:40:36Z",
      headSha: "e35ddb3ce365c07419365d5b799bbb45b65ac38e",
      ratingLabel: "🦐 gold shrimp",
      statusLabel: "⏳ waiting on author",
    },
    {
      number: 105029,
      author: "arcabotai",
      identityRole: "Arca agent identity",
      title: "fix(gateway): revoke attach grants on deletion",
      url: "https://github.com/openclaw/openclaw/pull/105029",
      state: "open",
      updatedAt: "2026-07-12T22:07:38Z",
      mergedAt: null,
      headSha: "fb137a71e7288e7e166a717bfec8ae8f2fecf562",
      ratingLabel: "🦞 diamond lobster",
      statusLabel: "👀 ready for maintainer look",
      arca: { workStatus: "active repair", currentWork: "Exact-head Gateway/MCP proof passes; awaiting upstream review." },
    },
    {
      number: 104893,
      author: "arcabotai",
      identityRole: "Arca agent identity",
      title: "fix(discord): retry stale preview cleanup after final delivery",
      url: "https://github.com/openclaw/openclaw/pull/104893",
      state: "merged",
      updatedAt: "2026-07-13T10:23:31Z",
      mergedAt: "2026-07-13T10:23:28Z",
      headSha: "574cc1ea367cc3c24fd81334833988cfc4dd86c3",
      ratingLabel: "🦐 gold shrimp",
      statusLabel: null,
      arca: { workStatus: "merged", currentWork: "Merged upstream after implementation and live Discord proof." },
    },
    {
      number: 104492,
      author: "arcabotai",
      identityRole: "Arca agent identity",
      title: "fix(gateway): preserve channel restart ownership",
      url: "https://github.com/openclaw/openclaw/pull/104492",
      state: "open",
      updatedAt: "2026-07-12T22:04:00Z",
      mergedAt: null,
      headSha: "1d7a7be25af3f4a4ef9ce2aa9c07699508cce405",
      ratingLabel: "🦪 silver shellfish",
      statusLabel: "📣 needs proof",
      arca: { workStatus: "active proof", currentWork: "Focused gateway tests pass; upstream proof boundary is being reassessed." },
    },
    {
      number: 104192,
      author: "arcabotai",
      identityRole: "Arca agent identity",
      title: "fix(secrets): resolve active exec refs locally",
      url: "https://github.com/openclaw/openclaw/pull/104192",
      state: "closed",
      updatedAt: "2026-07-12T09:08:56Z",
      mergedAt: null,
      headSha: "02a66be2410cd70c97e7d9305024c7fb5496ea63",
      ratingLabel: "🦞 diamond lobster",
      statusLabel: "👀 ready for maintainer look",
      arca: { workStatus: "superseded", currentWork: "Closed unmerged after equivalent current-main work landed upstream." },
    },
  ],
};

export function getOpenClawLedger(): OpenClawLedger {
  const ledger = openClawLedgerJson as OpenClawLedger;
  if (!Array.isArray(ledger.pullRequests)) return fallbackLedger;
  return ledger;
}

const emptyActivityFeed: ActivityFeed = {
  schemaVersion: 1,
  generatedAt: "",
  cadence: "every 6 hours",
  events: [],
};

export function getActivityFeed(): ActivityFeed {
  const feed = activityJson as ActivityFeed;
  if (!Array.isArray(feed.events)) return emptyActivityFeed;
  const events = feed.events
    .filter(
      (event) =>
        event &&
        typeof event.id === "string" &&
        typeof event.url === "string" &&
        typeof event.title === "string" &&
        !Number.isNaN(Date.parse(event.occurredAt)),
    )
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
  return { ...feed, events };
}
