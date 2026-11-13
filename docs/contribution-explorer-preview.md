# Contribution explorer preview

> Historical first SDK preview. Its green/paper visual direction has been superseded by the owner's whole-site minimal-cyberpunk redesign in [DESIGN.md](../DESIGN.md). The interaction contracts and verification history below remain useful; they are not the current palette specification.

## Design brief
Visitors should find a past upstream receipt by project, outcome, role or text, then inspect its original public evidence. Enhance the existing past-work directory, not a second feed. Keep forest-green/paper, editorial rules, DM Sans and native disclosures. Real receipt titles and attribution are the motif; no decorative metrics.

## Flow and states
- Entry: `#past-work`, all static projects/receipts readable; search controls appear only after hydration.
- Search → apply (Enter or Search); project/outcome/role selections apply immediately. Count means matching records, not extra contributions. Open work stays at `#current-work`.
- Empty → explain filters and offer Reset. Reset focuses search. Clear search returns focus through SDK InputClear.
- Share → ordinary selectable permalink, preserving unrelated query parameters and hash. Back/forward restores applied controls/results. Invalid values fall back to All; malformed percent encoding is tolerated.
- No JS, failed island or offline chunk: unchanged static evidence and native disclosures remain usable. No runtime data fetch/loading/auth state. No animation required.
- Filtering never moves focus while editing. If history navigation hides the focused evidence, return focus to search. Disclosures remain native keyboard controls.

## Integration intent
One controls-only React island mounted through an Astro slot into the SSR-only Home. Existing server-rendered project/evidence nodes remain authoritative. The island receives a compact projection of `getContributionDirectory(...).past`; it never discovers, merges or upgrades evidence. Existing static anchors, SEO, no-index policy and Cloudflare deployment remain unchanged.

## Verified scope and SDK
- Baseline from `git rev-parse HEAD`: `6eeb5b80a9a4dee6d8ba58a9b202352bd73d0c3b`; branch `cad/oss-ui-sdk-preview-20261112`.
- Read official [README](https://github.com/vercel-labs/ui), [Input docs](https://ui-sdk.dev/docs/react/components/input), [Button docs](https://ui-sdk.dev/docs/react/components/button), React package exports/source, npm version metadata and published beta declarations before choosing APIs.
- Exact pins: `@ui-sdk/react@0.1.0-beta.1`, `@ui-sdk/core@0.1.0-beta.1`, `@types/react@19.2.10` (adapter peer minimum). Both SDK versions and the type version exist in the public registry. React 19.2.7 is unchanged. No install or lockfile update was performed here.
- Actual components: `Input`, `InputGroup`, `InputClear` from `@ui-sdk/react/input` provide controlled text, native editing and clear-to-input focus recovery; `Button` from `@ui-sdk/react/button` renders the search/reset actions with explicit button types. Native selects/disclosures intentionally retain platform keyboard/mobile behavior. No invented SDK select/URL abstraction and no unused SDK dependency.
- Astro's documented named-slot composition places `client:load` only on the finding aid. Home and its evidence stay SSR-only. The island receives only compact projected normalized past-work records, not public JSON imports. Source reconciliation, cutoff, accepted-first ordering, attribution, fresh snapshots, all static IDs, canonical/SEO metadata and deployment files are unchanged.
- Additional curated links remain context, not counted receipts; hidden only during record-level filtering. Project aggregate facts are explicitly labelled as pre-filter totals. Incorporated originals, partial incorporation, credited merges, authored merges, manual integration, reviews and closed-without-merge are separate outcomes. No synthetic contribution count is introduced.

## Actual focused RED → GREEN evidence
Every command below was `node --test tests/contribution-explorer.test.mjs` in this worktree. Each slice reached GREEN before the next test was added.

| Slice | RED output | GREEN output |
|---|---|---|
| Normalized-history projection | exit 1, missing model module (bootstrap) | exit 0, 1 passed |
| Tolerant query parsing | exit 1, expected function / received undefined | exit 0, 2 passed |
| Query-preserving share/reset URL | exit 1, expected function / received undefined | exit 0, 3 passed |
| Intersecting record-level filters | exit 1, expected function / received undefined | exit 0, 4 passed |
| Safe GitHub evidence hrefs | exit 1, expected function / received undefined | exit 0, 5 passed |

Final rerun after integration: **5 tests passed, 0 failed**, exit 0. `git diff --check` also exited 0. Pure tests cover malformed encoding, unknown enum/project values, duplicate query keys, Unicode, unrelated preview flags/repeated parameters/hash preservation, reset, literal search (not regex), role/outcome intersection, closed vs incorporated, no open-record count, nonmutation and unsafe evidence URLs.

## Exact owned file changes
- `package.json` — SDK/type pins (lockfile intentionally left to remote install).
- `lib/contribution-explorer.mjs` — pure display projection, filtering, URL parse/serialization and safe evidence hrefs.
- `src/components/ContributionExplorer.tsx` — one controls-only island, status/empty/reset/share states and progressive DOM enhancement.
- `src/pages/index.astro` — normalized projection, named-slot island and scoped stylesheet integration.
- `src/react-pages/Home.tsx` — replace old toolbar slot, stable evidence/project hooks, safe receipt links, explicit unfiltered project totals.
- `src/scripts/interactions.ts` — remove only the superseded past-directory enhancer; software/activity/navigation enhancement remains.
- `src/styles/contribution-explorer.css` — paper/forest finding aid, native controls, mobile layouts; inherits existing focus/reduced-motion rules.
- `tests/contribution-explorer.test.mjs` — focused dependency-free behavior tests.
- `tests/contribution-outcomes-render.test.mjs` — existing render harness accepts `.mjs` dependency and extra receipt attributes; evidence assertions unchanged (remote execution pending).
- `docs/contribution-explorer-preview.md` — brief, state notes and this handoff.

`tests/contributions.test.mjs` may show a concurrent parent-owned diff; it was not edited by this implementation.

## Remaining remote gates (parent-owned)
1. Clean install + lockfile regeneration, full `npm run check`/tests and build. No dependency installs, typechecks, builds, full suites, servers or deployments ran on Cad. Automated editor diagnostics reported missing JSX intrinsic types on this dependency-free checkout; these are not a substitute for the clean remote typecheck.
2. Verify published SDK SSR/hydration in Astro, exactly one island, unchanged static evidence/IDs, no runtime public-data fetch and no duplicate competing controls.
3. Browser proof at desktop and narrow mobile: labelled filters, Enter/Space/Tab, native disclosure links, InputClear and reset focus, no unexpected focus jump on filtering, back/forward restoring filters/draft, evidence-focus recovery when history hides a result, unrelated query preservation, empty state and reduced motion.
4. JS-disabled and blocked-island-chunk proof: all original past-work evidence/disclosures remain readable; no dead search controls. Confirm long titles/outcome badges and selects do not overflow.
5. Isolated preview only: parent applies/verifies no-index headers/robots policy and deployment isolation. Canonical/production identity and Worker configuration are deliberately untouched here.

No SDK packaging blocker was found in registry metadata/exports; runtime compatibility and visual screenshots remain unverified until those remote gates pass.
