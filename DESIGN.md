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

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#080c14` | Near-black document and hero |
| `--surface` | `#111820` | Charcoal controls, contribution section, tracking and disclosures |
| `--raised` | `#1b2530` | Hover surfaces and status backgrounds |
| `--text` | `#f1f3f3` | Cool-white primary text |
| `--muted` | `#b2bdc7` | Descriptions, metadata and secondary text |
| `--signal` | `#57e6ff` | Electric cyan, primary actions, focus, source links |
| `--violet` | `#c2adff` | Review status |
| `--success` | `#c3ee92` | Accepted / released outcomes only |
| `--warning` | `#f2cf8d` | Prerelease status |
| `--closed` | `#d1a9b4` | Closed-without-merge status |
| `--line` | `#35404b` | Noninteractive architectural rules |
| `--control-line` | `#647993` | Visible native/control boundaries |

Every text color above clears 4.5:1 against all three dark surfaces in the dependency-free contract test. Status always has a literal label: color does not establish authorship, acceptance, or completeness. Small white repository-logo tiles intentionally preserve upstream logos; they are identity assets, not light document panels.

Self-hosted DM Sans is the only webfont. Bold geometric headings, tight but readable tracking, and system monospace metadata replace editorial serif/italic styling. Nothing loads from a font CDN. No animation is introduced.

## Composition

The masthead and footer use the plain company name, Arca Computer, Inc. The homepage opens with a credited contribution to Hermes Desktop and links both the original proposal and the maintainer's merge. Selected pull requests follow, grouped by their current GitHub state, then software the company built.

The homepage selections live in `lib/catalog.ts`. Editors select substantive changes by repository and pull request number. The tracked directory supplies their state, actor, and original URL. The full search, software inventory, attribution details, and original records are available at `/records/`. Existing filtered homepage bookmarks lead to the archive.

## Interaction and evidence invariants

Content is rendered at build time. Native details/summary controls provide plus/minus affordances without JavaScript. `[hidden]` remains authoritative for progressive enhancement. Visible cyan keyboard focus, native select menus, explicit labels, polite result announcements, reduced-motion and forced-color support remain part of the system. Scripts and SDK behavior are not replaced with visual imitations.

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

Run `npm run check` and `npm run build`. Browser checks cover the contribution links, mobile menu, canonical archive, filtered bookmarks, and keyboard-accessible records.
