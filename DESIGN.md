# Arca OSS — source index

## Direction

Arca’s directory uses a dark canvas, a working example from its software catalogue, and links to original upstream work. The homepage leads with what the team makes in Santiago.

### Product brief

- **Reader:** a developer, potential collaborator, or maintainer evaluating Arca's open-source work.
- **Job:** find useful software or an upstream contribution, understand Arca's actual role, and inspect its public evidence.
- **Success:** software and contribution paths are explicit from the first screen; records are inspectable without JavaScript; filters help locate receipts without changing their meaning.
- **Feeling:** technical, independent, direct. Architectural structure instead of decorative cards.
- **Primary paths:** Software we make → project repository; Projects we contribute to → current work or past outcomes → original records.
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

The homepage pairs the introduction with a native radio switch between the OrthoVoxel model and its three original pixel drawings. The model illustration uses the voxels returned by the project's reconstruction engine. The source drawings and model were generated from the built-in demo at the pinned revision. Its MIT license is included in `public/orthovoxel/LICENSE.txt`. [OrthoVoxel Studio source](https://github.com/felirami/orthovoxel-studio/tree/7cae5a3e640302fa9ef735b453fd4b7a0f4952b1)

The most recent directly authored upstream merge links to the original pull request. Software rows show each project's purpose and status, with its license and Arca's role in Details. Current upstream rows lead with a real open pull request. Past work has search, optional filters, and the original records grouped by repository.

On narrow screens, the model and software descriptions stack, and the masthead becomes a native Menu disclosure. Controls keep their labels, and long repository names and pull request titles wrap.

## Interaction and evidence invariants

Content is rendered at build time. Native details/summary controls provide plus/minus affordances without JavaScript. `[hidden]` remains authoritative for progressive enhancement. Visible cyan keyboard focus, native select menus, explicit labels, polite result announcements, reduced-motion and forced-color support remain part of the system. Scripts and SDK behavior are not replaced with visual imitations.

- Licensed software Arca makes is separate from reports and from other teams' upstream software. Public personal repositories do not automatically become Arca software.
- Contribution history uses the existing February 12, 2026 cutoff, canonical identities and evidence. The 2023 SlimeVR contribution remains outside this scope.
- Preserve authored merges, additional credited merges, submitted reviews, manual upstream integration, incorporated origins, and closed-without-merge proposals as separate facts. An incorporated origin is not an authored merge. An open PR is not a delivered result. Backports do not add contributions.
- Preserve the dated snapshot/freshness caveats. Do not imply streaming, real-time status, comprehensive review discovery, or affiliation with an upstream project.
- Tracking covers `felirami`, `arcabotai`, and `arcacomputer`; public repository inventory includes currently public repositories of any age with fork/archive/license labels.
- Keep all original receipts, attribution/context text, JSON download links, activity and ledger records, and source repositories. No public data is modified by the redesign.
- Canonical site source remains `https://github.com/arcacomputer/oss`.

## Social identity

The 1200 × 630 social image uses the homepage title and the front, right, and top drawings from the same OrthoVoxel demo. The PNG is rendered from `public/og.svg`.

## Verification

Run `npm run check` and `npm run build`. The static build checks include the sample assets and the evidence feeds. In a browser, check the model switch, software search, contribution filters, and expandable records at desktop and phone widths.
