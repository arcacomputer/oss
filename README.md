# Arca OSS

Source for [oss.arcabot.ai](https://oss.arcabot.ai), Arca's public engineering index.

The site provides clear paths to Arca projects, current upstream PRs, past contributions, and a public GitHub repository inventory. Search and category/outcome filters help visitors explore each listing, with detailed evidence available through native disclosures. Main GitHub and site-source links point to `arcacomputer/oss`.

The site distinguishes:

1. Open-source projects Arca maintains, with explicit licenses.
2. External OSS projects Arca supports, with precise role and attribution boundaries.
3. Upstream work, keeping open, merged, closed, superseded, reviewed, and co-authored records distinct.

## GitHub tracking scope

Authored upstream PR tracking covers public external repositories for `felirami` and `arcabotai`, with PRs created on or after February 12, 2026. Repositories owned by either user or `arcacomputer` are excluded from upstream contributions. Earlier receipts, including the 2023 SlimeVR contribution, are outside this scope.

The repository inventory covers all currently public repositories owned by `felirami`, `arcabotai`, and the `arcacomputer` organization, regardless of creation date. It labels forks, archived repositories, and detected licenses separately; public visibility alone does not establish an open-source license or Arca authorship. Reviews and coauthor credits are selected, verified receipts, not a complete discovery of those activities.

## Architecture

- Astro 7 static output
- React renders the page at build time; no React hydration or application runtime
- Small progressive-enhancement script for project search, category filters, activity filters, and mobile navigation
- Self-hosted DM Sans variable font with its OFL license
- Cloudflare Workers Static Assets
- HTML-only `Cache-Control: no-transform` prevents Cloudflare from auto-injecting analytics JavaScript
- No application server, database, authentication, or runtime rendering

## Evidence refresh

The previous Next.js site fetched the OpenClaw contribution ledger with one-hour ISR. The Astro site uses committed, reviewable snapshots:

- `npm run refresh:activity` refreshes `public/activity.json` and `public/github-repositories.json` every six hours through the activity workflow
- `public/openclaw-prs.json` refreshes hourly
- each workflow validates claims and commits the public snapshots, including successful `checkedAt` freshness updates
- every committed refresh triggers the Cloudflare deployment workflow; the live site advances only after checks, the dependency audit, upload, and promotion succeed

Hermes contribution receipts distinguish our directly authored merge from maintainer-incorporated commit credit. Both accepted contributions are verified in the `v0.21.6` source tag; that does not establish inclusion in a packaged Desktop binary.

A failed refresh leaves the last committed public snapshots intact. `lib/data.ts` provides curated fallback evidence within the tracking scope. `lib/presentation.ts` resolves historical transitions before showing current work, reconciles the OpenClaw ledger, and keeps authored merges separate from credited merges. `lib/contributions.ts` groups in-scope evidence by upstream project, including selected reviews and closed proposals. `lib/catalog.ts` provides plain-language project descriptions and lifecycle labels. Collection paginates GitHub results and fails explicitly on incomplete results; the activity snapshot has no 200-event cap. Snapshot check dates remain visible beside the counts.

## Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run check
npm run build
npm run check:claims
npm run cf:dry-run
npm run cf:dev
npm run smoke
npm audit
```

## Public data

- `/oss.json`
- `/activity.json`
- `/github-repositories.json`
- `/openclaw-prs.json`
- `/llms.txt`
- `/robots.txt`
- `/sitemap.xml`

## Deployment boundary

Production is the `arca-oss` Cloudflare Worker serving `oss.arcabot.ai`. Its custom domain is already attached. `wrangler.json` defines no routes and disables `workers.dev` and preview URLs. Routine deployments upload and promote an exact Git commit without changing DNS or domain attachments.

## License

MIT
