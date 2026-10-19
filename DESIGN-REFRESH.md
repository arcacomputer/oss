# Arca OSS — Historical Visual Exploration

> Superseded by the editorial refresh described in [DESIGN.md](DESIGN.md). The source-map artwork and dark hero described below are retained as historical context.

**Scope:** Graphics lead deliverable only. No application code changes.  
**Audience for this doc:** Frontend engineer integrating the hero source-map field.

---

## 1. Blunt visual audit (current baseline)

Inspected against `DESIGN.md`, `app/page.tsx`, `app/globals.css`, and baseline shots:

- desktop: `/root/cad/artifacts/oss-refresh/baseline/desktop.png` (1440×1000)
- mobile: `/root/cad/artifacts/oss-refresh/baseline/mobile.png` (390×844)

### What already works

- **Motif is correct.** Field station + ledger language holds: monospace instrument labels, teal signal dot, bronze section numbers, paper CTA on obsidian.
- **Copy is not SaaS sludge.** “Software should leave receipts.” and the license honesty line are specific and defensible.
- **IA is honest.** Maintained / Supported / Ledger / Method mirrors real engineering disposition, not marketing pillars.
- **Palette is on-canon.** Obsidian (`#090c0c`), warm paper (`#efeee7`), teal signal (`#62d2bd`), oxidized bronze (`#d39a58`) read as Arca, not generic dark-mode Tailwind.
- **Ledger density is the product.** Project rows, PR table, measure strip — these feel like a public record, not a portfolio carousel.

### What’s weak or undercooked

- **The hero “SOURCE MAP” is a wireframe, not a field instrument.** Four boxes, four spokes, one circle. It diagrams topology but does not *feel* like cartography, archival plate, or receipt geometry. It could pass as a default org chart from any dark SaaS template.
- **No depth of evidence in the graphic layer.** The map does not encode process (source → review → merge → public receipt). It only shows “hub and four repos.” Provenance is left entirely to HTML labels and the ledger below.
- **Background texture is body-level only.** The faint teal grid on `body` is fine ambient texture, but the source-map panel interior is flat black. The panel should carry its own technical plate — restrained linework that sits *behind* real labels.
- **Mobile compresses the idea further.** Stack is correct; the map still reads as sparse diagram, not a stamped field sheet. Empty dark mass dominates the panel between nodes.
- **Risk of “almost generic.”** Hierarchy and content save the page from AI sludge. The hero graphic does not. Without a project-specific plate, the right column is the weakest frame on the landing surface.

### Generic-smell check (hero only)

| Question | Answer |
|----------|--------|
| Could a Tailwind SaaS template produce this map? | Yes — hub + satellite cards is template-grade. |
| Fake metrics / dashboards / neural wallpaper? | No — good. |
| One memorable project-specific visual idea? | Not yet in the map panel. |
| Mobile still composed? | Yes for type/IA; map still thin. |

**Verdict:** Keep structure, type, and ledger. Replace the empty map interior with a purpose-built field plate that carries the receipt story without competing with HTML.

---

## 2. Art direction — hero source-map panel

**One direction:** *Archival receipt-field plate.*

Treat the source-map panel as a dark technical cartography sheet recovered from an engineering field station: fine teal and oxidized-bronze linework on obsidian, abstract repository nodes as small survey markers, review routes as dashed survey paths, commit traces as short hash-like ticks (not literal characters), and a subtle stamped-receipt geometry (concentric registration marks, corner crop ticks, seal-like ring) that implies “this work was recorded,” not “this is a logo.”

**Mood:** Quiet instrument. Survey map + ledger stamp hybrid. No glow soup, no glass, no 3D nodes, no constellation cliché.

**Composition rule:** The plate is *underlay only*. Center and four corner quadrants stay visually quiet so the existing HTML nodes (ARCA OSS core + four project cards) and map footer can sit on top without fighting the graphic.

**Asset delivered:** `public/receipt-field.png` — square 1:1 technical underlay, min 1024×1024.

---

## 3. How the graphic encodes source → review → merge → public receipt

The image is abstract and **contains no readable words**. Meaning is carried by geometry the engineer can map to UI:

| Stage | Visual language in the plate | Maps to product truth |
|-------|------------------------------|------------------------|
| **Source** | Outer survey nodes / small rectangular “plot” markers at the periphery | Licensed repos and contribution entry points (A3Stack, Hypersnap, OpenClaw, ClickClack) |
| **Review** | Dashed or interrupted paths between periphery and mid-ring; light tick marks along routes | PR scrutiny, review threads, unfinished or open work — paths that have not fully closed |
| **Merge** | Solid radial connectors that complete into a mid-ring; denser hatch where paths converge | Landed upstream code; paths that reached the station, not just left the node |
| **Public receipt** | Central registration geometry: thin concentric rings, corner crop marks, rectangular seal frame, faint ledger-line hatching | Published proof — the work is stamped into the public record (ledger, PR URL, commit) |

Read left-to-right / outside-to-inside: periphery is where work *starts*; the mid-field is process; the center is the receipt stamp. HTML labels remain the authoritative names and counts; the plate only supplies the instrument metaphor.

---

## 4. What must be preserved

Do **not** redesign away from:

- **Palette:** obsidian, warm paper-white, teal signal, oxidized bronze (existing CSS tokens).
- **Motif:** technical field station + evidence ledger (not “AI platform”).
- **Typography system:** large paper-weight display headlines; monospace instrument labels (eyebrow, map label, section numbers, measure strip).
- **Source map HTML structure:** `map-label`, positioned `map-node` cards, SVG connectors (or their successor), `map-footer` legend (licensed code / upstream work / public proof).
- **Honesty constraints:** no fake metrics in the graphic; no invented community stats; no logos or brand marks in the asset.
- **Anti-patterns from DESIGN.md:** no purple gradients, glass cards, neural-network wallpaper, mascots, decorative sparkles, text baked into generated imagery.
- **Real data ownership:** PR counts, merge states, project names stay in HTML/data — never painted into the PNG.

---

## 5. Integration notes (frontend engineer)

### Asset

| Property | Value |
|----------|--------|
| Path | `public/receipt-field.png` |
| Role | Decorative underlay for `.source-map` / `.map-grid` only |
| Aspect | 1:1 square |
| Content | Linework only; **no text, letters, numbers, logos** |
| Contrast | Low; designed to sit behind paper/teal/bronze labels |

### Recommended wiring (do not implement in this graphics pass)

1. Set `.map-grid` (or an inner plate element) to use the image as a non-repeating background:
   - `background-image: url("/receipt-field.png");`
   - `background-size: cover;` (or `contain` if you want full plate visible with letterbox)
   - `background-position: center;`
2. Keep existing `.map-node` at `z-index: 1` with solid `var(--ink-2)` fills so label cards remain readable.
3. Optionally drop or soften the current SVG spokes/circle if the plate already supplies radial structure — or keep thin SVG lines for precise node attachment. Prefer **one** primary path language (plate *or* SVG) to avoid double-spoke clutter.
4. Do **not** put critical meaning only in the PNG. Screen readers and the public record still depend on HTML nodes, footer legend, and the ledger sections.
5. Accessibility:
   - Treat the image as decorative: `aria-hidden="true"` on a CSS background, or empty `alt=""` if using `<img>`.
   - Existing `aria-label` on `.source-map` remains the accessible description.
6. Performance: single static PNG under ~few hundred KB ideal; no animation required. Respect `prefers-reduced-motion` if any future fade/load is added.
7. Mobile: same asset; `cover` + existing node repositioning is enough. Do not introduce a second hero illustration.
8. Dark edge matching: plate background is near `#090c0c` / `#0e1312` so panel borders (`--line-strong`) continue to frame cleanly.

### Out of scope for this graphics pass

- No edits to `app/page.tsx`, `app/globals.css`, data files, package files, or Git state.
- No OG image, favicon, or section-divider art unless separately requested.

---

## 6. Deliverables checklist

- [x] `DESIGN-REFRESH.md` — this brief
- [x] `public/receipt-field.png` — Imagine-generated field plate

**Human taste gate:** Confirm the underlay is quiet enough behind live labels on desktop and mobile before shipping CSS integration.

---

## 7. Implementation record (frontend integration)

- `.map-grid` now contains a decorative `.map-plate` div (inside the existing `aria-hidden="true"` grid) using `receipt-field.png` as a centered `cover` background, dimmed by a uniform ink overlay plus a radial ink gradient at the center so the seal geometry stays quiet behind `.map-node` cards. Node cards keep solid `--ink-2` fills at `z-index: 1`.
- The SVG spokes/circle were removed; the plate is now the single path language in the panel.
- The measure strip keeps the four verified counts and adds one derived freshness cue: the latest merged receipt computed from `ledger.pullRequests[].mergedAt` and `clickClackMergeCredits[].mergedAt` (no hardcoded claim), rendered beside the existing public-source link.
- Section rhythm: `02 / SUPPORTED` and `04 / METHOD` sit on a full-bleed `--ink-2` surface band (`.section-band`); `01 / MAINTAINED` and `03 / UPSTREAM LEDGER` stay on obsidian with hairline rules; section padding tightened (120→96px desktop, 86→72px mobile).
