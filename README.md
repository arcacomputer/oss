# Arca OSS

Source for [oss.arcabot.ai](https://oss.arcabot.ai), Arca's public engineering index.

The site has two primary destinations: **Software we make** (`#projects`) for Arca's licensed software, and **Projects we contribute to** (`#contributions`) for external OSS work, with current and past contributions beneath it. Search and category/outcome filters help visitors explore each listing. **Public records** holds the GitHub tracking sources, full public repository inventory, and detailed evidence. Main GitHub and site-source links point to `arcacomputer/oss`.

The software directory and external contributions are separate. Software we make includes tools, Ardea Knowledge Steward, and OpenChina. Headlong Agent Findings, the OpenClaw contribution ledger, the TUI field fix, and this index appear as compact resources in Public records; their underlying project evidence remains available. Contribution records distinguish open, merged, closed, superseded, reviewed, and co-authored work with precise attribution. Public personal repositories are supporting records, not automatically software made by Arca.

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

Hermes contribution receipts distinguish our directly authored merge #97871 from maintainer-incorporated credit #76400. These two contributions are verified in the `v0.21.6` source tag; that does not establish inclusion in a packaged Desktop binary. Later incorporation receipts do not inherit that release claim.

### Contribution outcomes (additive schema v1)

`oss.json` is the single curated source for `mergedUpstreamCredits` and `manuallyIntegratedContributions`. The original PR's `state` and `evidence.mergeCommit` remain GitHub disposition, not a contribution-outcome shortcut:

- `upstream_credit` events are merged replacement PR receipts, with the credited `actor` separate from `evidence.prAuthor`. `landedCommits` records actual landed author/co-author evidence; legacy `implementationCommit` fields may refer to pre-rebase branch commits and are retained as historical provenance.
- `upstream_manual_integration` events use `state: integrated`, not `merged`. One origin contains all integration/backport commits and pinned branch tips; OpenSSL's master and openssl-4.0 copies count as one contribution.
- Closed originals gain a separate `contributionOutcome` (`incorporated`, `partially_incorporated`, or `manually_integrated`) with linked receipts and limited attribution context. Incorporated originals are not grouped as unsuccessful closed-only proposals, nor added to authored-merge totals.
- Refresh rebuilds outcomes only from freshly verified receipts, stripping previous derived outcomes first. A configured replacement URL, an open PR's synthetic merge SHA, or a closure comment alone cannot establish acceptance. Replacement verification requires structured merge metadata, exact curated origin/reuse text, landed author/co-author identity and ancestry to the merge. Manual verification requires retained authorship, an exact `Merged-from` trailer and ancestry to pinned branch tips.
- `scripts/contribution-claims.mjs`, called by `check:claims`, reuses the refresh verifiers, compares public receipt payloads, recomputes outcomes and guards the original closed-unmerged disposition. Missing/invalid evidence fails the refresh/claim gate rather than publishing an acceptance claim. These historical integration checks do not prove current byte-for-byte retention or release inclusion.

Authored PR merges, distinct credited replacement PR merges and manual integrations are counted separately. Replacement URLs deduplicate credited counts; origin URLs deduplicate manual contributions. The eight audited origins currently correspond to eight credited replacement PRs plus one manual integration: ClickClack's one partially incorporated origin has two replacements, while OpenSSL has no replacement PR. The elizaOS additions are historical provenance only; diagnosis-only credit and merely superseded proposals do not become code-incorporation receipts.

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
