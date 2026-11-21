export type ProjectCategory = "tools" | "research" | "records";

export const projectCategories: Record<string, ProjectCategory> = {
  Opencaster: "tools",
  ClawFix: "tools",
  "Hypersnap Doctor": "tools",
  A3Stack: "tools",
  "Ardea Knowledge Steward": "research",
  "OpenClaw Contributions": "records",
  "OpenClaw TUI Field Fix": "records",
  "OrthoVoxel Studio": "tools",
  OpenChina: "research",
  "Headlong Agent Findings": "records",
  Clueside: "tools",
  "poidh Ultra": "tools",
  "Concentrate.ai for OpenClaw": "tools",
  "Arca OSS Index": "records",
};

export const projectDescriptions: Record<string, string> = {
  ClawFix:
    "Find problems in your OpenClaw setup and make guarded repairs with a dedicated command-line tool.",
  "Hypersnap Doctor":
    "Diagnose and safely repair Hypersnap and Snapchain nodes. Prepare support reports with sensitive details removed.",
  A3Stack:
    "Build with agent identity, payments, data, and MCP tools through a TypeScript SDK.",
  "Ardea Knowledge Steward":
    "A prototype knowledge assistant for Hypersnap, Snapchain, and Farcaster-fork operators, with answers labelled by source.",
  "OpenClaw Contributions":
    "Explore our OpenClaw bug reports, investigations, and pull requests, with public evidence and separate open, closed, and merged records.",
  "OpenClaw TUI Field Fix":
    "An archived investigation of an OpenClaw terminal spinner that stays stuck after delivery, with a reproducible example and local patch.",
  "OrthoVoxel Studio":
    "Rebuild voxel models from front, side, and top views, then export sprite sheets from different angles with a desktop pixel-art tool.",
  OpenChina:
    "Compare how language models answer a documented historical question, including refusals, evasions, denials, and substantive answers.",
  "Headlong Agent Findings":
    "Read what a bounded persistent-agent experiment revealed about reliability, with measured results and instructions for reproducing the work.",
  Clueside:
    "Check page images for signs of AI generation with a Chrome extension. Images are processed on your device and stay in your browser.",
  "poidh Ultra":
    "A new poidh client with independent indexing and shared community services. Source and a read-only preview are public ahead of launch.",
  "Concentrate.ai for OpenClaw":
    "Connect OpenClaw to Concentrate's Responses API for streaming, tools, and supported model features. Published on ClawHub, with compatibility testing in progress.",
  "Arca OSS Index":
    "The code and public records behind this website, including contribution tracking, evidence checks, and automatic refresh jobs.",
};

export const projectStatusLabels: Record<string, string> = {
  ClawFix: "Maintained",
  "Hypersnap Doctor": "Maintained",
  A3Stack: "Maintained",
  "Ardea Knowledge Steward": "Public prototype",
  "OpenClaw Contributions": "Live contribution record",
  "OpenClaw TUI Field Fix": "Archived finding",
  "OrthoVoxel Studio": "Maintained",
  OpenChina: "Published",
  "Headlong Agent Findings": "Published findings",
  Clueside: "Maintained",
  "poidh Ultra": "Preview before launch",
  "Concentrate.ai for OpenClaw": "On ClawHub · compatibility testing",
  "Arca OSS Index": "Live index",
};

// These describe our contribution areas; individual receipts carry their status.
export const contributionDescriptions: Record<string, string> = {
  "NousResearch/hermes-agent":
    "Remote access and runtime reliability, including SSH profile mapping, safer token handling, and clearer Tailscale sign-in guidance.",
  "openclaw/openclaw":
    "Plugin installation, message delivery, and agent context fixes, backed by bug reports, reproduction steps, and pull requests.",
  "elizaOS/eliza":
    "Safer onboarding and transactions, more reliable Google sign-in, and fixes to the runtime, interface, and tests.",
  "openclaw/crabbox":
    "Sandbox lifecycle rules, labels that preserve document content, and correct filesystem paths.",
  "openclaw/clickclack":
    "Integration history helpers and typed agent progress events, merged by upstream maintainers with co-author credit for our implementation work.",
  "farcasterorg/hypersnap":
    "Independent operator tools for diagnostics and safe repair, plus an upstream review covering security and correctness.",
  "block/buzz":
    "Clearer agent startup diagnostics and code review backed by runtime checks. The diagnostics pull request remains under review in our snapshot.",
};

// Accepted work only. These labels do not imply that all proposals were merged.
export const contributionOutcomeLabels: Record<string, string> = {
  "NousResearch/hermes-agent": "Improved SSH profiles and Tailscale guidance",
  "openclaw/openclaw": "Merged plugin, messaging, and agent context fixes",
  "elizaOS/eliza": "Merged sign-in, safety, and reliability fixes",
  "openclaw/crabbox": "Merged sandbox lifecycle and filesystem fixes",
  "openclaw/clickclack": "Two merged capabilities with co-author credit",
};

// Highlight specific contributions. Their current state and source always come from the tracked directory.
export const selectedContributions = [
  { repository: "openclaw/openclaw", number: 196089, title: "Keep the gateway responsive while listing thousands of Slack conversations" },
  { repository: "NousResearch/hermes-agent", number: 150275, title: "Distinguish a locked database from a corrupt one during recovery" },
  { repository: "openclaw/openclaw", number: 194540, title: "Let agents run on remote workers when web search is available" },
  { repository: "elizaOS/eliza", number: 18523, title: "Use one Google sign-in callback across LifeOps and Settings" },
];

export const selectedSoftware = [
  "arcacomputer/opencaster",
  "arcabotai/clawfix",
  "arcabotai/a3stack",
];
