# Arca Computer, Inc. — Open Source

## Direction

The homepage leads with the work our Santiago team contributes to other open-source projects. Each featured change links to its upstream pull request.

### Product brief

- **Reader:** a developer, potential collaborator, or maintainer evaluating Arca's open-source work.
- **Job:** find useful software or an upstream contribution, understand Arca's actual role, and inspect its public evidence.
- **Success:** software and contribution paths are explicit from the first screen; records are inspectable without JavaScript; filters help locate receipts without changing their meaning.
- **Feeling:** technical, independent, direct. Architectural structure instead of decorative cards.
- Visitors can go from an open or merged upstream change to the original pull request, from a company project to its repository, or from Public records to the searchable archive.
- **Edge paths:** empty search → reset or current work; no JavaScript → complete static project/evidence directory and native disclosures; long repository names / outcome labels → wrap, never truncate evidence.

## Visual system

The archive uses deep green surfaces, cream text, and amber links. The homepage uses a light stock color for the Hermes example and the software section. Shared tokens live in `src/styles/global.css` and the print colors live in `src/styles/showcase.css`. Contrast tests cover text on both backgrounds.

DM Sans carries the interface and body text. Instrument Serif italic appears in the cover and software headings. Both fonts are served locally, with their licenses in `public/fonts/`.

## Composition

The plain company name sits above a postcard from Santiago. The photograph by Nbendersky shows the city and the Andes from Cerro San Cristóbal on June 16, 2024. The site distributes resized WebP copies and crops the image to fit smaller screens. Both copies retain the original license. [Original photograph](https://commons.wikimedia.org/wiki/File:Santiago_de_Chile_y_Los_Andes_nevado_desde_el_telef%C3%A9rico_del_Cerro_San_Crist%C3%B3bal.jpg) · [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

The Hermes example uses native radio buttons to compare the previous SSH behavior with a mapped remote profile. The names `work` and `writer_2` come from the contributor’s regression case. Both pull requests are linked in the story. [Original proposal](https://github.com/NousResearch/hermes-agent/pull/74779) · [Upstream merge](https://github.com/NousResearch/hermes-agent/pull/76400)

Open and merged work appear side by side on desktop and in reading order on mobile. The three software previews illustrate the Opencaster workspace directories, ClawFix’s documented dry run, and A3Stack’s published package layout. [Opencaster](https://github.com/arcacomputer/opencaster) · [ClawFix](https://github.com/arcabotai/clawfix) · [A3Stack](https://github.com/arcabotai/a3stack)

The homepage selections live in `lib/catalog.ts`. Editors select substantive changes by repository and pull request number. The tracked directory supplies their state, actor, and original URL. The full search, software inventory, attribution details, and original records are available at `/records/`. Existing filtered homepage bookmarks lead to the archive.

## Interaction and evidence invariants

Content is rendered at build time. Native details/summary controls provide plus/minus affordances without JavaScript. `[hidden]` remains authoritative for progressive enhancement. Visible keyboard focus, native select menus, explicit labels, polite result announcements, reduced-motion and forced-color support remain part of the system. Scripts and SDK behavior are not replaced with visual imitations.

- Licensed software Arca makes is separate from reports and from other teams' upstream software. Public personal repositories do not automatically become Arca software.
- Contribution history uses the existing February 12, 2026 cutoff, canonical identities and evidence. The 2023 SlimeVR contribution remains outside this scope.
- Preserve authored merges, additional credited merges, submitted reviews, manual upstream integration, incorporated origins, and closed-without-merge proposals as separate facts. An incorporated origin is not an authored merge. An open PR is not a delivered result. Backports do not add contributions.
- Preserve the dated snapshot/freshness caveats. Do not imply streaming, real-time status, comprehensive review discovery, or affiliation with an upstream project.
- Tracking covers `felirami`, `arcabotai`, and `arcacomputer`; public repository inventory includes currently public repositories of any age with fork/archive/license labels.
- Keep all original receipts, attribution/context text, JSON download links, activity and ledger records, and source repositories. The showcase selection does not filter the public archive.
- Canonical site source remains `https://github.com/arcacomputer/oss`.

## Social identity

The social image uses the company name and the homepage title. Its text-only cover is rendered from `public/og.svg`. The site uses an empty favicon until the company adopts a logo.

## Verification

Run `npm run check` and `npm run build`. Browser checks cover the contribution links, mobile menu, canonical archive, filtered bookmarks, and keyboard-accessible records, and the SSH comparison.
