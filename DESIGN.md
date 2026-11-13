# Arca OSS — source index

## Approved direction

The owner's latest direction supersedes the earlier paper / forest / serif design: redesign the whole website with a minimal cyberpunk character. This is a single dark visual system, not a theme toggle or another override layer. The motif is the actual source index: numbered sections, repository identities, dated evidence, source links, and precise outcome labels. No fake terminals, animated status lights, invented metrics, ornamental code, gradients, or external font services.

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
| `--surface` | `#0e1522` | Navy software grid, contribution section, tracking and disclosures |
| `--raised` | `#151f30` | Hover surfaces and status backgrounds |
| `--text` | `#edf4ff` | Cool-white primary text |
| `--muted` | `#a4b3c9` | Descriptions, metadata and secondary text |
| `--signal` | `#57e6ff` | Electric cyan, primary actions, focus, source links |
| `--violet` | `#c2adff` | Research labels and review status |
| `--success` | `#c3ee92` | Accepted / released outcomes only |
| `--warning` | `#f2cf8d` | Prerelease status |
| `--closed` | `#d1a9b4` | Closed-without-merge status |
| `--line` | `#2b3b51` | Noninteractive architectural rules |
| `--control-line` | `#647993` | Visible native/control boundaries |

Every text color above clears 4.5:1 against all three dark surfaces in the dependency-free contract test. Status always has a literal label: color does not establish authorship, acceptance, or completeness. Small white repository-logo tiles intentionally preserve upstream logos; they are identity assets, not light document panels.

Self-hosted DM Sans is the only webfont. Bold geometric headings, tight but readable tracking, and system monospace metadata replace editorial serif/italic styling. Nothing loads from a font CDN. No animation is introduced.

## Composition

- A thin, fixed-height masthead and native mobile menu replace the soft garden-like navigation. Public records is now a first-class navigation destination.
- The opening is an unboxed, ruled two-column composition: a large three-line **Built here. / Improved / upstream.** headline and a compact source index. The counts shown beside software and contributions remain derived from the existing data. The records route uses a resource label, not an invented count.
- Main sections use sequential metadata labels, strong sans-serif headings, and fine rules. All existing destination IDs and factual section names remain intact.
- Software becomes a contiguous grid with shared dividers, license metadata, explicit lifecycle labels, and native project-proof disclosures. No shadows, rounded garden cards, or decorative accent strips.
- Current upstream work is visibly separated from past outcomes. Current proposals keep their upstream-review caveat. Past projects form dense two-column ruled entries rather than floating cards; source receipts stay expandable in the document.
- Public records uses resource rows, a source-tracking panel, and technical disclosure headers. Inventory rows, activity, and the full OpenClaw ledger use the same palette and type system.
- The SDK explorer shares those tokens: search group, clear action, search/reset buttons, native selects, result status, project-total caveat, and empty state. No model, URL/history, focus-management, or filter logic changes.
- About/footer continue the structure rather than switching to an unrelated theme. The error route inherits the same dark system.

### Mobile composition

At 900px the full navigation becomes a native disclosure with 46px control and readable destination rows. At 600px, hero text and source index stack; primary hero actions remain available side by side; software/history grids become single-column; current work returns to a single-column reading order. Status explanations, snapshot freshness, history totals, and evidence legends remain visible on mobile rather than disappearing. Tables/ledger-like rows wrap their metadata; long receipts remain readable. Input text is 16px to avoid mobile browser zoom.

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

`public/og.svg` is a crisp static 1200×630 composition with the same headline, source-index rules, palette, and Arca mark. It contains no frozen mutable project/PR/merge counts. `public/icon.svg` uses a near-black cut-corner boundary and cyan signal bar. The layout declares dark browser chrome and descriptive OG/Twitter alt text; canonical URLs and document title remain unchanged. The production `og.png` must be regenerated from this SVG by the release owner.

## Verification and release handoff

Focused command: `node --test tests/cyberpunk-design-contract.test.mjs`.

The test was exercised RED → GREEN for palette/contrast, source-index structural preservation, and social/browser-chrome identity. It checks all seven text/status colors across three surfaces, original destination IDs, static evidence/disclosure presence, absence of legacy palette/serif tokens, OG dimensions and static copy, and matching dark metadata. SVG XML and whitespace/diff checks are also lightweight local checks.

These source checks do not claim browser layout, hydration, axe, full build, or production verification. The parent release owner runs the full check/build/test gates, regenerates OG PNG, inspects desktop and narrow mobile screenshots, checks no-JS evidence, native controls, empty/reset/history/focus behavior, and verifies deployment. No installs, servers, commits, push, or cloud mutations belong to this implementation handoff.

**Intentional visual-copy contract change:** the old hero `Tools we build.` / `Software we improve.` is replaced by `Built here.` / `Improved` / `upstream.`. `THE PUBLIC RECORD` remains, now prefixed `03 /`. The title and factual section headings remain unchanged. Existing contrast tests that parse light-theme literal colors must resolve the new CSS tokens instead.
