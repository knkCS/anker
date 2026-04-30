# Design System 1.0 — Adopt Refined Token Values

**Status:** Approved (brainstorm), awaiting implementation plan
**Author:** Jesko Iwanovski (with Claude)
**Date:** 2026-04-30
**Target release:** `@knkcs/anker@1.0.0`

---

## 1. Problem

A separate design-system proposal authored for the knk product family (CMS, IDP, Tasks, MAS) defines a refined visual direction — GitHub-inspired, denser, less saturated, with a darker primary anchor (`#134788`) and a different typographic system (Inter Tight + JetBrains Mono). The proposal was written without awareness of `@knkcs/anker`, which already implements the same architectural pattern (Chakra v3, semantic tokens, recipes) but with different token *values* (a brighter primary `#2087d7`, no JetBrains Mono, looser radii).

We want to adopt the proposal's **values** while preserving anker's **API surface** so existing consumers don't have to rename palettes or restructure imports. We also want consumer projects to pick up the design-system rules automatically when they upgrade, ideally via a Claude-Code-aware mechanism.

## 2. Goals

- Replace anker's token values to match the refined design proposal.
- Keep all public API keys stable: `primary`, `secondary`, `gray`, `brand.*`, semantic tokens, recipe names — all unchanged.
- Document the design system in two places: a human-facing master spec (`docs/design-system.md`) and an AI-consumable rules file (`CLAUDE-ANKER.md`) shipped inside the npm package.
- Ship as `1.0.0` — first stable release, signaling the visual breaking change explicitly.

## 3. Non-goals

- **No palette renaming.** The proposal's `bay`/`ember`/`honey`/`slate` names exist only as historical context inside `docs/design-system.md`, never in code.
- **No font shipping.** Anker stays font-stack-only. Consumers install Inter Tight themselves; the stack tells the browser what to load if available.
- **No dark-mode rework.** Anker has full light+dark semantic tokens; the proposal is light-only. Anker's superset stays. New color values get `_dark` variants derived analogously to the current ones.
- **No component additions or deletions.** Anker's existing components and recipes are unchanged structurally; only token references shift.
- **No `next-themes` change.** Anker's color-mode integration stays.
- **No theme-preset rework.** `createAnkerTheme()` and `ThemePreset` continue working exactly as before — the new values are the new defaults inside the default preset.
- **No animation/easing rework.** Anker's existing motion tokens (`fast`, `normal`, `slow`, `slower`, `entrance`, `exit`) honor the proposal's principles ("no animations over 300ms outside marketing", "no bounce") even though the keys differ. Out of scope for this release.
- **No proposal "Phase 2 components" list.** Anker already has Tabs, Modal, Drawer, Popover, etc.; the proposal's component list is an artifact of starting from zero.
- **No re-audit of Storybook a11y.** Spot-checking only. Full a11y re-audit is a follow-up.

## 4. Architecture

The work splits cleanly along the existing files in `src/theme/tokens/` and the existing `package.json` `files` field. No new directories. Two new files (`docs/design-system.md`, `CLAUDE-ANKER.md`).

```
src/theme/
├── tokens/
│   ├── colors.ts         # rewrite values, keep keys
│   ├── semantic.ts       # rewrite shadow values; shift palette anchors to step 700/600
│   ├── typography.ts     # swap font stack; add named text styles
│   ├── radii.ts          # tighten by one step (see §5.4)
│   ├── spacing.ts        # NO CHANGE
│   ├── animations.ts     # NO CHANGE
│   ├── z-index.ts        # NO CHANGE
│   └── index.ts          # NO CHANGE
├── recipes/              # adjust ~18 hardcoded primary/secondary refs (see §5.6)
└── ...
docs/
├── design-system.md      # NEW — human-facing master spec
└── ...
CLAUDE-ANKER.md           # NEW — AI-consumable rules (package root)
CHANGELOG.md              # NEW — document the visual breaking change
package.json              # update `files` field, bump version
README.md                 # add "Using with Claude Code" section
```

## 5. Detailed changes

### 5.1 `colors.ts` — palette values

Position-by-position replacement. Keys preserved.

**`primary` (today: anchored at step 500 = `#2087d7`):**

| Step | Today | New | Source in proposal |
|---|---|---|---|
| `50` | `#f1f7fe` | `#eff6fc` | bay.50 |
| `100` | `#e2effc` | `#d9eafa` | bay.100 |
| `200` | `#bfddf8` | `#b8d6f5` | bay.200 |
| `300` | `#87c1f2` | `#88baeb` | bay.300 |
| `400` | `#48a3e8` | `#5995dc` | bay.400 |
| `500` | `#2087d7` | `#2f6fbf` | bay.500 |
| `600` | `#126ab7` | `#1c5aa8` | bay.600 |
| `700` | `#105595` | **`#134788`** | bay.700 — **new primary action anchor** |
| `800` | `#11497b` | `#0f395d` | bay.800 — equals `brand.navy` |
| `900` | `#143e66` | `#0a2740` | bay.900 |
| `950` | `#0d2744` | `#061a2c` | bay.950 |

**`secondary` (today: anchored at step 500 = `#e9580c`):**

| Step | Today | New | Source in proposal |
|---|---|---|---|
| `50` | `#FEF0E6` | `#fff5ed` | ember.50 |
| `100` | `#FCD9BF` | `#ffe6d4` | ember.100 |
| `200` | `#F9B888` | `#ffc8a8` | ember.200 |
| `300` | `#F59651` | `#ffa170` | ember.300 |
| `400` | `#F27726` | `#ff7c41` | ember.400 |
| `500` | `#e9580c` | `#f25f1c` | ember.500 |
| `600` | `#C54A0A` | **`#e9580c`** | ember.600 — **new orange anchor** (matches brand exactly) |
| `700` | `#9A3A08` | `#b73806` | ember.700 |
| `800` | `#6F2A06` | `#912e0d` | ember.800 |
| `900` | `#441A03` | `#762a0e` | ember.900 |
| `950` | *(missing)* | `#411208` | ember.950 — **new step** |

**`gray` (today: 50–900, blue-tinted slate scale; values already match):**

- All existing values unchanged (anker `gray.50–900` already equals proposal `slate.50–900`).
- **Add** `gray.950 = "#020617"` to complete the scale.

**`brand.*` (knk Brand Guidelines literals):**

- Unchanged. These are exact print-brand colors and stay as-is for branding contexts (logos, headers, about pages).

**New palettes** (today: anker inherits Chakra defaults `green/yellow/red/blue` for status colors via `defaultConfig`; we now define these explicitly):

```ts
success: { 50: "#ecfdf5", 100: "#d1fae5", 500: "#10b981", 600: "#059669", 700: "#047857" }
warning: { 50: "#fffbeb", 100: "#fef3c7", 500: "#f59e0b", 600: "#d97706", 700: "#b45309" }
danger:  { 50: "#fef2f2", 100: "#fee2e2", 500: "#ef4444", 600: "#dc2626", 700: "#b91c1c" }
info:    { 50: "#eff6fc", 100: "#d9eafa", 500: "#2f6fbf", 600: "#1c5aa8", 700: "#134788" }
```

These exist alongside the Chakra defaults — they don't replace `green.500` etc.; they add new explicit semantic palettes anker controls.

### 5.2 `semantic.ts` — anchor shift

The most consequential change: the proposal makes the **primary action anchor live at step 700**, not step 500. Semantic tokens that previously pointed at `primary.500` shift to `primary.700`. Same logic for `secondary` (anchor at step 600 because that's where `#e9580c` lands).

| Semantic token | Today | New |
|---|---|---|
| `primary.solid` (light) | `primary.500` | `primary.700` |
| `primary.solid` (dark) | `primary.500` | `primary.500` — kept lighter than the light-mode step to maintain contrast on dark backgrounds (the new `primary.700` would be too dark on dark canvas). Note this breaks the current "same step in both modes" pattern for `solid`, which is the right call now that the light-mode anchor has moved deeper into the scale. |
| `primary.focusRing` (light) | `primary.500` | `primary.700` |
| `primary.border` (light) | `primary.500` | `primary.700` |
| `primary.fg` (light) | `primary.700` | `primary.700` (unchanged) |
| `accent` (light) | `primary.500` | `primary.700` |
| `accent` (dark) | `primary.200` | `primary.300` |
| `bg-accent` (light) | `primary.600` | `primary.700` |
| `bg-accent-subtle` | `primary.500` | `primary.700` |
| `bg-accent-muted` | `primary.400` | `primary.500` |
| `secondary.solid` (light) | `secondary.500` | `secondary.600` |
| `secondary.focusRing` | `secondary.500` | `secondary.600` |
| `secondary.border` (light) | `secondary.500` | `secondary.600` |

**Shadow values** (in the same file): replace anker's current `rgba(45, 55, 72, …)` with the proposal's `rgba(0, 0, 0, …)` softer set. `_dark` variants stay structurally similar but use the new alpha values.

| Token | Today (light) | New (light) |
|---|---|---|
| `xs` | `0px 0px 1px rgba(45,55,72,0.05), 0px 1px 2px rgba(45,55,72,0.1)` | `0 1px 2px rgba(0,0,0,0.04)` |
| `sm` | `0px 0px 1px rgba(45,55,72,0.05), 0px 2px 4px rgba(45,55,72,0.1)` | `0 1px 2px rgba(0,0,0,0.06)` |
| `md` | `0px 0px 1px rgba(45,55,72,0.05), 0px 4px 8px rgba(45,55,72,0.1)` | `0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04)` |
| `lg` | `0px 0px 1px rgba(45,55,72,0.05), 0px 8px 16px rgba(45,55,72,0.1)` | `0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)` |
| `xl` | `0px 0px 1px rgba(45,55,72,0.05), 0px 16px 24px rgba(45,55,72,0.1)` | `0 20px 25px -5px rgba(0,0,0,0.10), 0 8px 10px -6px rgba(0,0,0,0.04)` |
| `2xl` | `0px 0px 1px rgba(45,55,72,0.04), 0px 24px 48px rgba(45,55,72,0.12)` | `0 25px 50px -12px rgba(0,0,0,0.18)` |
| `focus-ring` | `0 0 0 3px rgba(32,135,215,0.4)` | `0 0 0 3px rgba(19,71,136,0.18)` (new primary at 18% alpha) |

### 5.3 `typography.ts` — fonts and text styles

**Font stack:**

```ts
// Today
heading: "InterVariable, -apple-system, system-ui, sans-serif",
body:    "InterVariable, -apple-system, system-ui, sans-serif",

// New
heading: "'Inter Tight', system-ui, -apple-system, 'Segoe UI', sans-serif",
body:    "'Inter Tight', system-ui, -apple-system, 'Segoe UI', sans-serif",
mono:    "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
```

**Text styles** — keep the existing numeric scale (`7xl` … `xs`, `display`, `caption`, `overline`) for backward compatibility. **Add** the proposal's named styles alongside:

```ts
bodyLg:  { fontSize: "lg", fontWeight: "normal", lineHeight: "body" }
body:    { fontSize: "md", fontWeight: "normal", lineHeight: "body" }
bodySm:  { fontSize: "sm", fontWeight: "normal", lineHeight: "base" }
mono:    { fontFamily: "mono", fontSize: "md", lineHeight: "body" }
monoSm:  { fontFamily: "mono", fontSize: "xs", lineHeight: "base" }
```

The existing `display` and `overline` text styles keep their current values — `overline` already plays the role the proposal calls `caption` (uppercase eyebrow label). Anker's existing `caption` (small muted text, no transform) also stays — it serves a different role than the proposal's `caption` and renaming would break consumers. Net result: anker's `overline` ≈ proposal's `caption`; anker's `caption` is a non-conflicting addition unique to anker. Do **not** add proposal-style `h1`–`h5` named styles — anker's numeric scale (`7xl`–`xs`) already serves that role and adding parallel names would create two ways to express the same thing.

### 5.4 `radii.ts` — tighten by one step

Anker's current radii are one step looser than the proposal:

| Token | Today | New (proposal) |
|---|---|---|
| `sm` | `0.375rem` (6px) | `0.25rem` (4px) |
| `md` | `0.5rem` (8px) | `0.375rem` (6px) |
| `lg` | `0.75rem` (12px) | `0.5rem` (8px) |
| `xl` | `1rem` (16px) | `0.75rem` (12px) |
| `2xl` | `1.25rem` (20px) | `1rem` (16px) |

Effect: every rounded corner in every consumer becomes 2px less round. This is intentional and aligns with the proposal's "moderate radii, avoid old-fashioned extra-round" principle. Spec section §6 calls this out as a known visual change.

### 5.5 `spacing.ts` and `animations.ts` — no change

- **Spacing:** Anker only ships custom intermediate steps (`1.5`, `2.5`, `3.5`, `4.5`); the integer steps come from Chakra `defaultConfig` and already match the proposal's 4px-base scale.
- **Animations:** Anker's existing duration/easing tokens differ from the proposal in *naming* but the underlying values respect the proposal's principles (max 300ms outside `slower`, no bounce except the rarely-used `spring`). Renaming `normal` → `standard` would break consumers for no functional benefit. Out of scope.

### 5.6 Recipes — fix hardcoded references broken by the anchor shift

Inventory of recipe lines that reference `primary.500/600/700` or `secondary.500/600` directly and need adjustment so the anchor shift produces the right visual:

| File | Line | Today | After |
|---|---|---|---|
| `recipes/button.ts` | 108 | `bg: "primary.500"` | `bg: "primary.700"` |
| `recipes/button.ts` | 111 | `_hover: { bg: "primary.600" }` | `_hover: { bg: "primary.800" }` |
| `recipes/button.ts` | 113 | `_disabled: { bg: "primary.500" }` | `_disabled: { bg: "primary.700" }` |
| `recipes/button.ts` | 117 | `_active: { bg: "primary.700" }` | `_active: { bg: "primary.900" }` |
| `recipes/button.ts` | 157 | `color: "primary.500"` | `color: "primary.700"` |
| `recipes/input.ts` | 18 | `borderColor: "primary.500"` | `borderColor: "primary.700"` |
| `recipes/input.ts` | 38, 41 | `primary.100` / `primary.200` | unchanged (steps far from anchor) |
| `recipes/input.ts` | 66, 70, 75 | `primary.500` / `primary.600` | `primary.700` / `primary.800` |
| `recipes/textarea.ts` | 14 | `borderColor: "primary.500"` | `borderColor: "primary.700"` |
| `recipes/radio-card.ts` | 15 | `borderColor: "primary.500"` | `borderColor: "primary.700"` |
| `recipes/tag.ts` | 15 | `outlineColor: "primary.600"` | `outlineColor: "primary.700"` |
| `recipes/tag.ts` | 58 | `color: "primary.500"` | `color: "primary.700"` |
| `recipes/tree-item.ts` | 50 | `color: "primary.600"` | `color: "primary.700"` |

Implementation rule: every recipe that referenced `primary.500` as a "primary action" color should reference `primary.700` after; any reference to `primary.600` (hover) shifts to `primary.800`; `primary.700` (active) shifts to `primary.900`. References to `primary.50/100/200/300` (subtle backgrounds, borders) are unaffected by the anchor shift and stay.

### 5.7 Documentation — `docs/design-system.md`

Lives next to `docs/chakra-v3-reference.md` and `docs/react-table-reference.md`. English. Adapted from the proposal's German master document, but rewritten to use anker's actual keys. Structure:

1. About this document (scope: web products only; references to brand guidelines)
2. Five design principles (Refined Minimalism · Density over Air · Consistency over Creativity · Clear Hierarchy · Keyboard-First Where It Matters)
3. Foundations
   - 3.1 Colors (palettes + semantic tokens, with the rationale for the anchor-at-700 choice)
   - 3.2 Typography (Inter Tight rationale; type scale with named styles)
   - 3.3 Spacing (4px base, layout defaults)
   - 3.4 Border radius (the "tighten by one step" decision)
   - 3.5 Elevation & shadows (refined values)
   - 3.6 Motion (anker's existing tokens, mapped to the proposal's principles)
4. Implementation notes (using semantic tokens; recipe pattern; preset system; brand vs. UI palette distinction)
5. References (link to proposal, link to brand guidelines)
6. Changelog

Drops, vs. the source proposal: German prose, references to `bay`/`ember`/`honey`/`slate`, the Phase-2/3/4 roadmap (anker is past Phase 1), the consumer-side migration guide.

### 5.8 Documentation — `CLAUDE-ANKER.md`

Lives at the package root (`/CLAUDE-ANKER.md`). Shipped in the npm tarball via `package.json` `files`. ~150–200 lines, English, rule-focused. Designed for AI consumption when consumer projects @-import it.

Sections:

1. **Five design principles** (one paragraph each, same wording as `docs/design-system.md` §2)
2. **Token quick-reference** — palette anchors (`primary.700` for action, `secondary.600` for orange-brand), semantic tokens (`bg-canvas`, `bg-surface`, `accent`, `border`, etc.), default radius (`md` = 6px), default body size (`md` = 14px), font assumption (Inter Tight)
3. **Do** — use semantic tokens; primary action = `primary.700`; for branding elements use `brand.*`; respect `prefers-reduced-motion` (handled globally)
4. **Don't** — no hex inline; no Material-style large shadows; no `secondary.500` for standard CTAs (it's lighter than the brand orange now); no v2 patterns (`extendTheme`, `colorScheme`); no mixing radii within one component group
5. **Pointers** — full spec on the anker GitHub Pages site (URL recorded once anker docs deploy is set up); component layers at `node_modules/@knkcs/anker/dist/{primitives,components,atoms,forms,feedback}`. We deliberately do **not** ship `docs/design-system.md` inside the npm tarball — it stays browsable on the docs site, keeping the package payload small.
6. **Why these rules exist** — short "why" lines for each rule so a Claude in a consumer project can judge edge cases

### 5.9 Wiring

- `package.json` `files`: `["dist"]` → `["dist", "CLAUDE-ANKER.md"]`. Only `CLAUDE-ANKER.md` ships in the npm tarball; `docs/design-system.md` stays on the GitHub Pages docs site (referenced from `CLAUDE-ANKER.md` by URL).
- `package.json` `version`: `0.0.6` → `1.0.0`.
- `README.md`: add a short "Using with Claude Code" section showing the @-import pattern: a consumer adds `@node_modules/@knkcs/anker/CLAUDE-ANKER.md` to their own root `CLAUDE.md`.
- Anker's own root `CLAUDE.md`: add a small "Design System" pointer in the existing patterns section, linking to `docs/design-system.md`. The substance lives in `docs/design-system.md` and `CLAUDE-ANKER.md`, not in `CLAUDE.md` (which stays focused on Claude-specific behavior rules for working *on* anker).

### 5.10 `CHANGELOG.md`

Anker has none today. Create it with the 1.0.0 entry as the only content. Use the [Keep a Changelog](https://keepachangelog.com/) format — it pairs cleanly with the conventional-commits convention this repo already follows and groups changes under `Added` / `Changed` / `Removed` / `Fixed` headings. The entry must include a "Visual Changes" subsection that explicitly enumerates:

- Primary blue: `#2087d7` → `#134788`
- Anchor shift: `primary.500` is no longer the action color; `primary.700` is
- Secondary orange: `#e9580c` moved from `secondary.500` to `secondary.600`
- All radii tightened by ~2px
- Font stack changed: `InterVariable` → `Inter Tight`
- New explicit `success`/`warning`/`danger`/`info` palettes (additive, not breaking)

## 6. Known risks

1. **`primary.500` semantic drift.** Consumers using `primary.500` directly (vs. `accent`/`primary.solid` semantic tokens) get a visibly different blue. Anker's CLAUDE.md already says "use semantic tokens, not raw" — but the changelog must call this out by name. Mitigation: explicit changelog enumeration; consumer-side grep recommended.
2. **`secondary.500` semantic drift.** Same shape as risk 1 — `#e9580c` moved to step 600. Consumers expecting "the brand orange" at step 500 now get a lighter shade.
3. **Radius tightening.** Every rounded corner becomes ~2px less round. Visually subtle but global. Some custom layouts may look pinched.
4. **Dark-mode aesthetic drift.** The proposal doesn't address dark mode at all. We're inferring dark-mode steps from the new scale by analogy. Visual review in Storybook required before merging.
5. **JetBrains Mono assumption.** `mono` font tokens now reference JetBrains Mono. Consumers not loading it get the platform monospace fallback (acceptable, but worth noting).

All risks are accepted as the cost of the refined direction; the changelog is the user-facing mitigation.

## 7. Release sequence

Single PR to `main`, then `npm version major` + `npm publish`. Splitting into multiple PRs would mean intermediate states where tokens and recipes are out of sync land on `main`, complicating Storybook review and rollback.

Commit sequence inside the PR (conventional-commits format):

1. `feat(theme)!: replace primary palette with refined values` — `tokens/colors.ts`
2. `feat(theme)!: replace secondary palette with refined values` — `tokens/colors.ts`
3. `feat(theme): add gray.950 and explicit success/warning/danger/info palettes` — `tokens/colors.ts`
4. `feat(theme)!: shift primary/secondary anchors to step 700/600` — `tokens/semantic.ts`
5. `feat(theme)!: replace shadows with refined values` — `tokens/semantic.ts`
6. `feat(theme)!: switch font stack to Inter Tight + JetBrains Mono` — `tokens/typography.ts`
7. `feat(theme): add named text styles (body, bodyLg, mono, monoSm)` — `tokens/typography.ts`
8. `feat(theme)!: tighten radii scale by one step` — `tokens/radii.ts`
9. `fix(recipes): adjust hardcoded primary/secondary refs for anchor shift` — recipes listed in §5.6
10. `docs: add design-system.md master spec`
11. `docs: add CLAUDE-ANKER.md for AI-assisted consumers`
12. `chore: ship CLAUDE-ANKER.md and design-system.md in package` — `package.json` `files` field
13. `docs: add CHANGELOG.md with 1.0.0 entry`
14. `chore: bump to 1.0.0`

Verification at each commit: `npm run typecheck && npm run lint && npm run build && npm run test`. Storybook spot-check after commit 9 (recipe adjustments) and again after commit 11 (final visual state).

## 8. Open questions

None at brainstorm time. All Section-1-through-4 decisions confirmed by user.

## 9. References

- Source proposal files (in `~/Downloads/Archiv 2/`):
  - `design-system (1).md` — German master spec
  - `chakra-theme (1).ts` — proposed Chakra v3 system
  - `knk_design_system_foundations (2).jsx` — visual reference
  - `project-instructions (1).md` — proposal's AI behavior rules
- Existing anker docs:
  - `CLAUDE.md` — anker behavior rules
  - `docs/chakra-v3-reference.md` — Chakra v3 patterns
  - `docs/react-table-reference.md` — TanStack Table patterns
- knk Brand Guidelines, October 2021 (referenced in `tokens/colors.ts` comments)
