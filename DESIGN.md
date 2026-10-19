# Arca OSS design

The site helps visitors understand what Arca builds, where it contributes, and what has been delivered. Lead with concrete work; let readers inspect the underlying records as they need them.

## Visual direction

An editorial directory with a clear hierarchy: warm paper (`#f6f5ef`), forest green (`#173b2f`), fine rules, and generous space. Lime (`#d5f478`) is a small accent. Self-hosted DM Sans handles interface and body text; Georgia italic gives the main headline a human accent.

Use direct labels, visible button boundaries, and real project identity. A forest overview introduces three navigation paths; white project panels on paper and sage sections distinguish Arca projects from upstream work. Keep body descriptions at 16–18px, primary actions at 15px with 44–48px targets, and supporting labels at least 13px. Avoid repeated arrows, decorative terminals, invented diagrams, and ornamental project artwork.

## Information architecture

- Explain Arca's open-source work immediately.
- Give visitors three explicit routes in the opening: Arca projects, Working on now, and Past contributions. On mobile these become three prominent destination buttons.
- Show all licensed Arca projects in a visible directory with search, category filters, purpose, lifecycle, license, and a clear View project button. Order tools first, then research and public records.
- Group open contributions by upstream project and explain the contribution area before exposing individual PR titles. Show current open PR counts and a visible expansion control.
- Give past contributions a separate searchable directory. Show accepted work first, with authored merges, credited merges, reviews, and closed proposals kept distinct. Filters select projects with each kind of work; a project may have several kinds of history and also current work. Older curated contributions remain listed even when they predate the activity feed.
- Keep the full activity feed and OpenClaw ledger accessible without making them the first reading task.

## Evidence and interaction

Render content at build time. Native disclosures keep detailed contribution records usable without JavaScript, with visible plus/minus indicators. Search, filters, active-section navigation, and incremental activity reveal use a small progressive-enhancement script. Project listings remain visible by default.

Counts come from committed evidence, with visible snapshot dates. Resolve historical PR transitions before showing open work; reconcile the newer OpenClaw ledger. Keep directly authored merges and credited maintainer merges separate. Reviews alone do not establish an open PR. Preserve explicit licenses, lifecycle labels, and upstream attribution.

The main GitHub and site-source links point to `https://github.com/arcacomputer/oss`. Individual project links retain their canonical repositories across Arca's organizations and contributor identities.

## Responsive and accessibility behavior

Use a compact mobile navigation disclosure with an accessible GitHub link. Preserve visible keyboard focus, reduced-motion support, search labels, and live result counts. Stack project and ecosystem lists on narrow screens and keep secondary details expandable.
