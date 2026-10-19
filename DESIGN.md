# Arca OSS design

The site helps visitors understand what Arca builds, where it contributes, and what has been delivered. Lead with concrete work; let readers inspect the underlying records as they need them.

## Visual direction

A restrained editorial layout: warm paper (`#f6f5ef`), forest green (`#173b2f`), fine rules, and generous space. Lime (`#d5f478`) is a small accent. Self-hosted DM Sans handles interface and body text; Georgia italic gives the main headline a human accent.

Use ordinary underlined links and direct labels. Avoid repeated arrow icons, decorative terminals, invented diagrams, ornamental project artwork, and turning every piece of content into a card. Real project names, readable descriptions, and upstream logos carry the page.

## Information architecture

- Explain Arca's open-source work immediately.
- Show selected projects, contribution areas, and published research in the opening.
- Feature useful tools, followed by a searchable directory of all licensed projects.
- Show currently open PRs separately from historical activity and submitted reviews.
- Describe each upstream contribution with direct evidence and expandable attribution detail.
- Keep the full activity feed and OpenClaw ledger accessible without making them the first reading task.

## Evidence and interaction

Render content at build time. Native disclosures keep detailed records usable without JavaScript. Search, filters, and incremental activity reveal use a small progressive-enhancement script.

Counts come from committed evidence, with visible snapshot dates. Resolve historical PR transitions before showing open work; reconcile the newer OpenClaw ledger. Keep directly authored merges and credited maintainer merges separate. Reviews alone do not establish an open PR. Preserve explicit licenses, lifecycle labels, and upstream attribution.

The main GitHub and site-source links point to `https://github.com/arcacomputer/oss`. Individual project links retain their canonical repositories across Arca's organizations and contributor identities.

## Responsive and accessibility behavior

Use a compact mobile navigation disclosure with an accessible GitHub link. Preserve visible keyboard focus, reduced-motion support, search labels, and live result counts. Stack project and ecosystem lists on narrow screens and keep secondary details expandable.
