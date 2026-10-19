# Arca OSS design

The site helps visitors understand what Arca builds, where it contributes, and what has been delivered. Lead with concrete work; let readers inspect the underlying records as they need them.

## Visual direction

An editorial directory with a clear hierarchy: warm paper (`#f6f5ef`), forest green (`#173b2f`), fine rules, and generous space. Lime (`#d5f478`) is a small accent. Self-hosted DM Sans handles interface and body text; Georgia italic gives the main headline a human accent.

Use direct labels, visible button boundaries, and real project identity. A forest overview introduces two navigation paths; white project panels on paper and sage sections distinguish software Arca makes from external OSS contributions. Keep body descriptions at 16–18px, primary actions at 15px with 44–48px targets, and supporting labels at least 13px. Avoid repeated arrows, decorative terminals, invented diagrams, and ornamental project artwork.

## Information architecture

- Explain Arca's open-source work immediately.
- Give visitors two explicit routes in the opening: Software we make (`#projects`) and Projects we contribute to (`#contributions`). Preserve the same distinction in mobile destination buttons.
- Show licensed software Arca makes in a visible directory with search, category filters, purpose, lifecycle, license, and a clear View project button. Include tools, Ardea Knowledge Steward, and OpenChina. Put Headlong Agent Findings, the OpenClaw contribution ledger, the TUI field fix, and this index in a compact Public records resource list, preserving their underlying project evidence.
- Within Projects we contribute to, group current open contributions by upstream project and explain the contribution area before exposing individual PR titles. Show current open PR counts and a visible expansion control.
- Follow current work with a searchable past-contributions directory under the same destination. Show accepted work first, with authored merges, credited merges, reviews, and closed proposals kept distinct. A project may have several kinds of history and also current work. Apply the February 12, 2026 cutoff consistently, including curated receipts; the 2023 SlimeVR contribution is outside this scope.
- Place all GitHub tracking sources and the full repository inventory in Public records. Cover currently public repositories owned by `felirami`, `arcabotai`, and `arcacomputer`, including repositories created before the contribution cutoff. Label forks, archives, and detected licenses explicitly. Public personal repositories do not automatically belong in Software we make.
- Keep the full activity feed and OpenClaw ledger accessible through Public records without making them the first reading task.

## Evidence and interaction

Render content at build time. Native disclosures keep detailed contribution records usable without JavaScript, with visible plus/minus indicators. Search, filters, active-section navigation, and incremental activity reveal use a small progressive-enhancement script. Project listings remain visible by default.

Authored upstream PRs come from public external repositories for `felirami` and `arcabotai`, with PR creation dates on or after February 12, 2026. Exclude repositories owned by either user or `arcacomputer` from upstream work. Reviews and coauthor credits are selected verified receipts; do not imply comprehensive review discovery.

Counts come from committed evidence, with visible `checkedAt` freshness dates. The activity refresh also updates `public/github-repositories.json`; paginated collection must not silently truncate the record, and the activity snapshot has no 200-event cap. Resolve historical PR transitions before showing open work; reconcile the newer OpenClaw ledger. Keep directly authored merges and credited maintainer merges separate. Reviews alone do not establish an open PR. Preserve explicit licenses, lifecycle labels, and upstream attribution.

The main GitHub and site-source links point to `https://github.com/arcacomputer/oss`. Individual project links retain their canonical repositories across Arca's organizations and contributor identities.

## Responsive and accessibility behavior

Use a compact mobile navigation disclosure with an accessible GitHub link. Preserve visible keyboard focus, reduced-motion support, search labels, and live result counts. Stack project and ecosystem lists on narrow screens and keep secondary details expandable.
