# Arca OSS

Source for [oss.arcabot.ai](https://oss.arcabot.ai), Arca's public engineering index.

The site distinguishes:

1. Open-source projects Arca maintains, with explicit licenses.
2. External OSS projects Arca supports, with precise role and attribution boundaries.
3. Upstream work, keeping open, merged, closed, superseded, reviewed, and co-authored records distinct.

## Architecture

- Astro 7 static output
- Existing React page retained as build-time rendering for visual parity
- Cloudflare Workers Static Assets
- HTML-only `Cache-Control: no-transform` prevents Cloudflare from auto-injecting analytics JavaScript
- No application server, database, authentication, or runtime rendering

## Evidence refresh

The previous Next.js site fetched the OpenClaw contribution ledger with one-hour ISR. The Astro site uses committed, reviewable snapshots:

- `public/activity.json` refreshes every six hours
- `public/openclaw-prs.json` refreshes hourly
- each workflow validates claims and commits only when public evidence changes
- every committed refresh triggers the Cloudflare deployment workflow; the live site advances only after checks, the dependency audit, upload, and promotion succeed

Hermes contribution receipts distinguish our directly authored merge from maintainer-incorporated commit credit. Both accepted contributions are verified in the `v0.21.6` source tag; that does not establish inclusion in a packaged Desktop binary.

A temporary upstream outage cannot erase the public record because `lib/data.ts` retains its curated fallback.

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
- `/openclaw-prs.json`
- `/llms.txt`
- `/robots.txt`
- `/sitemap.xml`

## Deployment boundary

Production is the `arca-oss` Cloudflare Worker serving `oss.arcabot.ai`. Its custom domain is already attached. `wrangler.json` defines no routes and disables `workers.dev` and preview URLs. Routine deployments upload and promote an exact Git commit without changing DNS or domain attachments.

## License

MIT
