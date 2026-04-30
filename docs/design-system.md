# anker Design System

**Version:** 1.0
**Status:** Active
**Last updated:** April 2026

---

## 1. About this document

This is the master design-system specification for `@knkcs/anker`, the shared UI library used by all knk web products (CMS, IDP Server, Aufgabenmanagement, Media Asset System, and others). It defines the visual language, token system, and design principles that every consuming application inherits.

The system applies **only to web products**. Print and InDesign materials continue to follow the knk Brand Guidelines (October 2021) using ITC Franklin Gothic and the original brand colors.

### Tech foundation

- React 18+ with Chakra UI v3 (recipes, slot recipes, semantic tokens)
- Lucide React for icons
- Inter Tight (UI) and JetBrains Mono (code) — consumers install both via Google Fonts
- Light + dark mode supported via `next-themes`

---

## 2. Design principles

Five principles guide every token, recipe, and component decision. When a choice is ambiguous, fall back on these.

### 2.1 Refined Minimalism

Inspired by GitHub, Linear, Vercel, and Sanity Studio — not Bootstrap or Material Design. Calm surfaces, precise typography, no decorative weight. Brand colors are the "crown" — they appear in primary CTAs, active states, and focus rings, never as full backgrounds.

### 2.2 Density over air

Power users spend hours in these tools. We use space densely — compact table rows, small UI sizes, tight spacing — but with clear hierarchies so nothing feels cramped. Linear is the model here.

### 2.3 Consistency over creativity

If a pattern exists (status pill, empty state, filter toolbar), it is used identically everywhere. No per-product creative one-offs. Someone who can operate the CMS can operate the task manager without retraining.

### 2.4 Clear hierarchy

Three questions must be answerable in under a second: **What is this page?** (page title) **What can I do here?** (primary action) **What am I looking at?** (content). Secondary elements visually retreat.

### 2.5 Keyboard-first where it matters

Recurring actions must be keyboard-operable: search (`/`), command palette (`⌘K`), navigation, selection. Tooltips show shortcuts.

### What we avoid

- Saturated brand colors as full-area backgrounds
- Multiple border-radii within one view
- Inconsistent status visualization (filled here, outlined there)
- Heavy dark sidebars that compete with content
- Animated micro-interactions without functional purpose
- Material Design cards with deep shadows

---

## 3. Foundations

### 3.1 Color

All UI palettes use 11-step scales (`50` very light → `950` very dark). The brand-guideline colors are embedded but recalibrated for web (higher contrasts, more steps).

#### `primary` — UI blue, anchored at step 700

The primary action color. Used for solid buttons, links, active states, focus rings. The anchor sits at step 700 (`#134788`), one step lighter than the brand-guideline navy `#004576` (which lives at `primary.800`). The lighter anchor reads as more lively in CTAs while keeping the serious character.

| Token | Hex | Use |
|---|---|---|
| `primary.50` | `#eff6fc` | Info-box backgrounds, outline-button hover |
| `primary.100` | `#d9eafa` | Selected-state backgrounds |
| `primary.200` | `#b8d6f5` | Outline-button borders |
| `primary.300` | `#88baeb` | Disabled primary |
| `primary.400` | `#5995dc` | — |
| `primary.500` | `#2f6fbf` | — |
| `primary.600` | `#1c5aa8` | — |
| **`primary.700`** | **`#134788`** | **Action anchor** — buttons, links, focus rings |
| `primary.800` | `#0f395d` | Hover on primary; equals `brand.navy` |
| `primary.900` | `#0a2740` | — |
| `primary.950` | `#061a2c` | — |

#### `secondary` — brand orange, anchored at step 600

The brand orange `#e9580c` sits at `secondary.600`. **Not used for standard CTAs** — on white it's WCAG-borderline and visually too dominant. Reserved for:
- Brand moments (empty-state illustrations, onboarding highlights)
- Marketing transitions (login screens, upgrade CTAs)

| Token | Hex |
|---|---|
| `secondary.50` | `#fff5ed` |
| `secondary.100` | `#ffe6d4` |
| `secondary.200` | `#ffc8a8` |
| `secondary.300` | `#ffa170` |
| `secondary.400` | `#ff7c41` |
| `secondary.500` | `#f25f1c` |
| **`secondary.600`** | **`#e9580c`** *(brand orange)* |
| `secondary.700` | `#b73806` |
| `secondary.800` | `#912e0d` |
| `secondary.900` | `#762a0e` |
| `secondary.950` | `#411208` |

#### `gray` — neutral (the workhorse)

The backbone of every screen. Roughly 80% of pixels are gray.

| Token | Hex | Use |
|---|---|---|
| `gray.50` | `#f8fafc` | Page backgrounds, sidebars, toolbar bg |
| `gray.100` | `#f1f5f9` | Hover, pressed, light dividers |
| `gray.200` | `#e2e8f0` | Borders between surfaces |
| `gray.300` | `#cbd5e1` | Input borders, disabled borders |
| `gray.400` | `#94a3b8` | Placeholder text, secondary icons |
| `gray.500` | `#64748b` | Secondary text, captions |
| `gray.600` | `#475569` | Body-text variant, primary icons |
| `gray.700` | `#334155` | Body text (standard) |
| `gray.800` | `#1e293b` | Strong body text |
| `gray.900` | `#0f172a` | Headings, page titles |
| `gray.950` | `#020617` | Rare highlights |

#### `brand.*` — exact brand-guideline colors

Reserved for branding contexts (logos, headers, about pages). Print-aligned.

| Token | Hex |
|---|---|
| `brand.blue` | `#004576` |
| `brand.navy` | `#0f395d` |
| `brand.light-blue` | `#6fa7d1` |
| `brand.orange` | `#e9580c` |
| `brand.gold` | `#f4b235` |
| `brand.light-gray` | `#f2f2f2` |

#### Status palettes

Explicit, anker-owned (rather than inheriting Chakra defaults).

| Role | 50 | 100 | 500 | 600 | 700 |
|---|---|---|---|---|---|
| **success** | `#ecfdf5` | `#d1fae5` | `#10b981` | `#059669` | `#047857` |
| **warning** | `#fffbeb` | `#fef3c7` | `#f59e0b` | `#d97706` | `#b45309` |
| **danger** | `#fef2f2` | `#fee2e2` | `#ef4444` | `#dc2626` | `#b91c1c` |
| **info** | `#eff6fc` | `#d9eafa` | `#2f6fbf` | `#1c5aa8` | `#134788` |

#### Semantic tokens

These are the **preferred API** in application code — they describe meaning, not color.

| Semantic token | Light → | Dark → | Use |
|---|---|---|---|
| `bg-canvas` | `gray.50` | `gray.900` | Page frame |
| `bg-surface` | `white` | `gray.800` | Cards, modals |
| `bg-subtle` | `gray.50` | `gray.700` | Toolbar bg |
| `bg-muted` | `gray.100` | `gray.600` | Hover, secondary surfaces |
| `default` | `gray.900` | `white` | Body text default |
| `emphasized` | `gray.700` | `gray.100` | Standard body |
| `muted` | `gray.600` | `gray.300` | Secondary text |
| `subtle` | `gray.500` | `gray.400` | Tertiary text, placeholders |
| `border` | `gray.200` | `gray.700` | Standard borders |
| `accent` | `primary.700` | `primary.300` | Action color |
| `bg-accent` | `primary.700` | `primary.400` | Action surface bg |
| `success` | `green.600` | `green.200` | Status success |
| `error` | `red.600` | `red.200` | Status error |

**Rule of thumb:** wherever a semantic token fits, use it. Raw tokens (`primary.700`, `gray.500`) are the implementation; semantic tokens are the contract.

### 3.2 Typography

We use **Inter Tight** in the web app (consumers install via Google Fonts). It is a humanist-geometric sans designed for screen readability, OFL-licensed, and reads cleanly at small UI sizes — unlike the print brand face (ITC Franklin Gothic), which is licensed and not optimized for small UI text.

```css
font-family: 'Inter Tight', system-ui, -apple-system, 'Segoe UI', sans-serif;
font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace; /* code, IDs, API keys */
```

#### Text styles

Anker exposes both a numeric scale (`7xl`–`xs`) and named styles (`display`, `body`, `bodyLg`, `mono`, etc.). Both can be used via `<Text textStyle="…">`.

| `textStyle` | Size | Line-height | Use |
|---|---|---|---|
| `display` | 6xl | 4.5rem | Hero headlines |
| `7xl`–`xs` | scale | scale | Standard heading/body sizes |
| `bodyLg` | lg (16px) | 1.5 | Lead paragraphs |
| `body` | md (14px) | 1.5 | Standard UI text |
| `bodySm` | sm (13px) | 1.45 | Secondary text |
| `caption` | xs | 1rem | Small muted text |
| `overline` | xs | 1rem | Uppercase eyebrow labels |
| `mono` | md | 1.5 | IDs, API keys |
| `monoSm` | xs | 1.45 | Mono in tables |

#### Typography rules

- Headings are always `default` color (semantic), never tinted (except in marketing contexts).
- Body text is `emphasized` semantic — never pure black.
- Tracking on large headings (`-0.02em`) prevents the "stretched" feeling.
- Never more than two font sizes in one component.
- All-caps only on `caption`/`overline` styles — never on body or buttons.

### 3.3 Spacing

4-pixel base. All distances are multiples of 4. Anker inherits the Chakra default spacing scale and adds intermediate steps (`1.5`, `2.5`, `3.5`, `4.5`) for fine-grained control.

| Token | Pixels | Typical use |
|---|---|---|
| `0.5` | 2px | Icon-to-text micro-spacing |
| `1` | 4px | Pill vertical padding |
| `2` | 8px | Button-content spacing |
| `3` | 12px | Button horizontal padding (sm) |
| `4` | 16px | Standard card padding |
| `6` | 24px | Section header spacing |
| `8` | 32px | Page horizontal padding |
| `12` | 48px | Section dividers |
| `16` | 64px | Hero padding |

### 3.4 Border radius

Moderate radii. The 1.0 release tightened every step by ~2px to align with the refined direction.

| Token | Value | Use |
|---|---|---|
| `sm` | 4px | Pills, status badges, icon buttons |
| **`md`** | **6px** | **Default — buttons, inputs, small cards** |
| `lg` | 8px | Larger cards, containers |
| `xl` | 12px | Modals, popovers |
| `2xl` | 16px | Very large elements, marketing |

**Rule:** within one component group, use only one radius step. A card with `lg` can contain inputs with `md`, but not a mix of `md` and `lg` at the same level.

### 3.5 Elevation & shadows

Very dezent. Shadows communicate *which layer is above which*, not *how big the element is*. Anker prefers borders over shadows in dense UIs — they read clearer and stay calmer.

| Token | Use |
|---|---|
| `xs` | Subtle elevation (buttons, inputs) |
| `sm` | Cards (default) |
| `md` | Dropdowns, selects |
| `lg` | Popovers, tooltips |
| `xl` | Dialogs, modals |
| `2xl` | Hero-level diffused shadow |
| `focus-ring` | Primary-tinted glow on focus states |

### 3.6 Motion

Used sparingly. Transitions emphasize functionality, never decoration. The `prefers-reduced-motion` media query is honored globally — components do not need per-instance handling.

| Token | Duration | Use |
|---|---|---|
| `fast` | 150ms | Hover, color changes |
| `normal` | 200ms | Standard transitions, modal/toast |
| `slow` | 300ms | Larger state changes (drawer, sidebar) |
| `slower` | 400ms | Onboarding/marketing only |
| `entrance` | 250ms | Element entrance animations |
| `exit` | 200ms | Element exit animations |

Easings: `ease-out` (entry), `ease-in` (exit), `ease-in-out` (movement), `spring` (rare micro-interactions only).

**Rules:**
- No animations over 300ms outside marketing/onboarding contexts.
- No bouncy easings — they read as playful and don't fit enterprise B2B.

---

## 4. Implementation notes

### 4.1 Use semantic tokens before raw tokens

Every consumer should reach for `accent` before `primary.700`, `border` before `gray.200`, `bg-canvas` before `gray.50`. Raw tokens are escape hatches.

### 4.2 Recipes are the contract

Components are styled via Chakra v3 recipes (`defineRecipe`, `defineSlotRecipe`) — never via inline `sx` props for theme-level styling. If a recipe doesn't fit, extend it; don't bypass it.

### 4.3 Theme presets

Consumers can build a customized system via `createAnkerTheme(preset)`. The preset overrides token layers (colors, semantic tokens, text styles, fonts, radii, durations, easings) while preserving all component recipes. The default export from `@knkcs/anker/theme` equals `createAnkerTheme()` with no preset.

### 4.4 Brand vs. UI

`brand.*` tokens are the print-guideline literals. Use them for branding contexts: logo backdrops, marketing headers, about pages. Use `primary.*` / `secondary.*` for interactive UI.

---

## 5. References

- knk Brand Guidelines (October 2021) — print/InDesign source
- `docs/chakra-v3-reference.md` — v3 patterns this repo enforces
- `docs/react-table-reference.md` — TanStack Table patterns
- `CLAUDE.md` — anker development rules
- `CLAUDE-ANKER.md` — design-system rules for AI-assisted consumers

---

## 6. Changelog

### 1.0 — April 2026

- Adopted refined design-system value set (GitHub-inspired).
- Primary action anchor moved to `primary.700` (`#134788`).
- Brand-orange anchor moved to `secondary.600`.
- Added `gray.950` and explicit `success`/`warning`/`danger`/`info` palettes.
- Switched font stack to Inter Tight + JetBrains Mono.
- Added named text styles: `bodyLg`, `body`, `bodySm`, `mono`, `monoSm`.
- Tightened all radii by one step.
- Replaced shadows with softer values; updated `focus-ring` to new primary tint.
- Bumped to `1.0.0` (first stable release).
