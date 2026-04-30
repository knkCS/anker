# Design System 1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adopt the refined design-system value set (GitHub-inspired palette, Inter Tight font, tighter radii, softer shadows) in `@knkcs/anker` as a `1.0.0` release while preserving the public API (`primary`, `secondary`, `gray`, `brand.*` keys all unchanged).

**Architecture:** Update token *values* in `src/theme/tokens/{colors,semantic,typography,radii}.ts`. Shift semantic anchors from step 500 → 700 (primary) and 500 → 600 (secondary). Adjust ~13 hardcoded recipe references that the anchor shift would otherwise leave pointing at the wrong step. Add two new docs: `docs/design-system.md` (human spec, hosted on GitHub Pages) and `CLAUDE-ANKER.md` (rule-focused, shipped in npm tarball for consumer projects to `@`-import). Single PR to `main`, then publish.

**Tech Stack:** TypeScript, Chakra UI v3, tsup, Vitest, Storybook, Biome.

**Reference spec:** `docs/superpowers/specs/2026-04-30-design-system-1.0-design.md`

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/theme/tokens/colors.ts` | modify | Replace `primary` and `secondary` palette values; add `gray.950`; add `success`/`warning`/`danger`/`info` palettes |
| `src/theme/tokens/semantic.ts` | modify | Shift primary/secondary semantic anchors; replace shadow values |
| `src/theme/tokens/typography.ts` | modify | Switch font stack; add named text styles |
| `src/theme/tokens/radii.ts` | modify | Tighten by one step |
| `src/theme/recipes/button.ts` | modify | Update deprecated `primary` variant + `ghost` hover for anchor shift |
| `src/theme/recipes/input.ts` | modify | Update `outline` and `link` variants for anchor shift |
| `src/theme/recipes/textarea.ts` | modify | Update `outline` variant border for anchor shift |
| `src/theme/recipes/radio-card.ts` | modify | Update `_checked` border for anchor shift |
| `src/theme/recipes/tag.ts` | modify | Update outline + ghost hover for anchor shift |
| `src/theme/recipes/tree-item.ts` | modify | Update icon color for anchor shift |
| `docs/design-system.md` | create | Human-facing master spec |
| `CLAUDE-ANKER.md` | create | AI-consumable rules, ships in npm |
| `CHANGELOG.md` | create | Keep-a-Changelog format, 1.0.0 entry |
| `package.json` | modify | Add `CLAUDE-ANKER.md` to `files`; bump to `1.0.0` |
| `README.md` | modify | Add "Using with Claude Code" section |
| `CLAUDE.md` | modify | Add design-system pointer |

**Verification model:** Tokens have no behavioral tests — verification at every commit is `npm run typecheck && npm run lint && npm run build`. The recipes (Tasks 10–15) and final Storybook review (Task 16) catch visual regressions. Vitest (`npm test`) should pass throughout — if it doesn't, a test was depending on an exact color value, which means the test (not the change) is wrong.

---

## Task 0: Set up feature branch

**Files:** none (git only)

- [ ] **Step 1: Create the feature branch from main**

```bash
git checkout main && git pull && git checkout -b release/1.0.0
```

Expected: switched to a new branch `release/1.0.0`, working tree clean.

- [ ] **Step 2: Verify clean baseline by running the full check**

```bash
npm run typecheck && npm run lint && npm run build && npm test
```

Expected: all four commands pass. If any fail on `main`, stop and surface the failure — the plan assumes a green baseline.

---

## Task 1: Replace `primary` palette values

**Files:**
- Modify: `src/theme/tokens/colors.ts:15-27`

- [ ] **Step 1: Replace the `primary` block**

Open `src/theme/tokens/colors.ts`. Find the `primary` object and replace its 11 step values. The keys (50, 100, …, 950) stay; only the hex values change.

Before:
```ts
primary: {
    "50": { value: "#f1f7fe" },
    "100": { value: "#e2effc" },
    "200": { value: "#bfddf8" },
    "300": { value: "#87c1f2" },
    "400": { value: "#48a3e8" },
    "500": { value: "#2087d7" },
    "600": { value: "#126ab7" },
    "700": { value: "#105595" },
    "800": { value: "#11497b" },
    "900": { value: "#143e66" },
    "950": { value: "#0d2744" },
},
```

After:
```ts
primary: {
    "50": { value: "#eff6fc" },
    "100": { value: "#d9eafa" },
    "200": { value: "#b8d6f5" },
    "300": { value: "#88baeb" },
    "400": { value: "#5995dc" },
    "500": { value: "#2f6fbf" },
    "600": { value: "#1c5aa8" },
    "700": { value: "#134788" },
    "800": { value: "#0f395d" },
    "900": { value: "#0a2740" },
    "950": { value: "#061a2c" },
},
```

- [ ] **Step 2: Verify**

```bash
npm run typecheck && npm run lint && npm run build
```

Expected: all pass. Storybook will not yet reflect the visual shift — semantic tokens still point to `primary.500` (will be addressed in Task 4).

- [ ] **Step 3: Commit**

```bash
git add src/theme/tokens/colors.ts
git commit -m "feat(theme)!: replace primary palette with refined values"
```

---

## Task 2: Replace `secondary` palette values

**Files:**
- Modify: `src/theme/tokens/colors.ts:28-39`

- [ ] **Step 1: Replace the `secondary` block**

Find the `secondary` object and replace its values. Note: this adds a `"950"` step that didn't exist before.

Before:
```ts
secondary: {
    "50": { value: "#FEF0E6" },
    "100": { value: "#FCD9BF" },
    "200": { value: "#F9B888" },
    "300": { value: "#F59651" },
    "400": { value: "#F27726" },
    "500": { value: "#e9580c" },
    "600": { value: "#C54A0A" },
    "700": { value: "#9A3A08" },
    "800": { value: "#6F2A06" },
    "900": { value: "#441A03" },
},
```

After:
```ts
secondary: {
    "50": { value: "#fff5ed" },
    "100": { value: "#ffe6d4" },
    "200": { value: "#ffc8a8" },
    "300": { value: "#ffa170" },
    "400": { value: "#ff7c41" },
    "500": { value: "#f25f1c" },
    "600": { value: "#e9580c" },
    "700": { value: "#b73806" },
    "800": { value: "#912e0d" },
    "900": { value: "#762a0e" },
    "950": { value: "#411208" },
},
```

- [ ] **Step 2: Verify**

```bash
npm run typecheck && npm run lint && npm run build
```

Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add src/theme/tokens/colors.ts
git commit -m "feat(theme)!: replace secondary palette with refined values"
```

---

## Task 3: Add `gray.950` and explicit status palettes

**Files:**
- Modify: `src/theme/tokens/colors.ts` (extend `gray`; add four new top-level palettes)

- [ ] **Step 1: Add `gray.950`**

In the `gray` object, append the 950 step after `"900"`:

Before:
```ts
gray: {
    "50": { value: "#f8fafc" },
    "100": { value: "#f1f5f9" },
    "200": { value: "#e2e8f0" },
    "300": { value: "#cbd5e1" },
    "400": { value: "#94a3b8" },
    "500": { value: "#64748b" },
    "600": { value: "#475569" },
    "700": { value: "#334155" },
    "800": { value: "#1e293b" },
    "900": { value: "#0f172a" },
},
```

After:
```ts
gray: {
    "50": { value: "#f8fafc" },
    "100": { value: "#f1f5f9" },
    "200": { value: "#e2e8f0" },
    "300": { value: "#cbd5e1" },
    "400": { value: "#94a3b8" },
    "500": { value: "#64748b" },
    "600": { value: "#475569" },
    "700": { value: "#334155" },
    "800": { value: "#1e293b" },
    "900": { value: "#0f172a" },
    "950": { value: "#020617" },
},
```

- [ ] **Step 2: Add the four new status palettes**

After the `gray` block (before the closing `}` of the `colors` object), add four new top-level palettes:

```ts
success: {
    "50": { value: "#ecfdf5" },
    "100": { value: "#d1fae5" },
    "500": { value: "#10b981" },
    "600": { value: "#059669" },
    "700": { value: "#047857" },
},
warning: {
    "50": { value: "#fffbeb" },
    "100": { value: "#fef3c7" },
    "500": { value: "#f59e0b" },
    "600": { value: "#d97706" },
    "700": { value: "#b45309" },
},
danger: {
    "50": { value: "#fef2f2" },
    "100": { value: "#fee2e2" },
    "500": { value: "#ef4444" },
    "600": { value: "#dc2626" },
    "700": { value: "#b91c1c" },
},
info: {
    "50": { value: "#eff6fc" },
    "100": { value: "#d9eafa" },
    "500": { value: "#2f6fbf" },
    "600": { value: "#1c5aa8" },
    "700": { value: "#134788" },
},
```

- [ ] **Step 3: Update the JSDoc comment at the top of the file**

Find the leading JSDoc block (lines 1–13). Update the second sentence to reflect the new additions:

Before:
```ts
/**
 * Raw color scales for the design system.
 *
 * `primary` is the UI blue (optimized for web contrast/readability),
 * `secondary` is the brand orange (anchored to brand guideline #e9580c),
 * `gray` is a blue-tinted gray scale, and `brand` contains the exact
 * hex values from the knk Brand Guidelines (October 2021) for use in
 * branding elements like headers, logos, and about pages.
 *
 * NOTE: The primary UI blue (#2087d7) intentionally differs from the brand
 * guideline blue (#004576). The brand blue is a deep navy designed for print;
 * the UI blue is brighter for web accessibility and matches the existing Core app.
 */
```

After:
```ts
/**
 * Raw color scales for the design system.
 *
 * `primary` is the UI blue (anchored at step 700 = #134788 — used for
 * action surfaces, links, focus rings). `secondary` is the brand orange
 * (anchored at step 600 = #e9580c — matches the brand guideline exactly).
 * `gray` is a blue-tinted neutral scale (~80% of UI pixels). `brand`
 * contains the exact hex values from the knk Brand Guidelines (October
 * 2021) for branding contexts like logos, headers, and about pages.
 *
 * `success`, `warning`, `danger`, `info` are explicit status palettes
 * owned by anker (rather than inheriting Chakra's defaults), so consumers
 * get stable status colors regardless of Chakra version.
 *
 * NOTE: The brand-guideline blue (#004576) lives at `primary.800`. The
 * action anchor (`primary.700` = #134788) is one step lighter for web
 * legibility — the original navy is too heavy as a CTA.
 */
```

- [ ] **Step 4: Verify**

```bash
npm run typecheck && npm run lint && npm run build
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/theme/tokens/colors.ts
git commit -m "feat(theme): add gray.950 and explicit status palettes"
```

---

## Task 4: Shift `primary` semantic anchors

**Files:**
- Modify: `src/theme/tokens/semantic.ts:43-44, 54-98, 146-159`

The light-mode anchor for primary moves from `primary.500` to `primary.700`. Dark-mode `solid` stays at `primary.500` (not 700) for contrast on dark backgrounds — see spec §5.2.

- [ ] **Step 1: Update the `accent` semantic token**

Find:
```ts
accent: {
    value: { base: "primary.500", _dark: "primary.200" },
},
```

Replace with:
```ts
accent: {
    value: { base: "primary.700", _dark: "primary.300" },
},
```

- [ ] **Step 2: Update the `primary` per-palette tokens**

Find the `primary` block (the colorPalette tokens, lines ~54-98). Update only the four entries listed below; leave `contrast`, `subtle`, `muted`, `emphasized` unchanged.

Find:
```ts
fg: {
    value: {
        base: "{colors.primary.700}",
        _dark: "{colors.primary.300}",
    },
},
```
(unchanged — `primary.700` is already the right answer for `fg`)

Find:
```ts
solid: {
    value: {
        base: "{colors.primary.500}",
        _dark: "{colors.primary.500}",
    },
},
```
Replace with:
```ts
solid: {
    value: {
        base: "{colors.primary.700}",
        _dark: "{colors.primary.500}",
    },
},
```

Find:
```ts
focusRing: {
    value: {
        base: "{colors.primary.500}",
        _dark: "{colors.primary.500}",
    },
},
```
Replace with:
```ts
focusRing: {
    value: {
        base: "{colors.primary.700}",
        _dark: "{colors.primary.500}",
    },
},
```

Find:
```ts
border: {
    value: {
        base: "{colors.primary.500}",
        _dark: "{colors.primary.400}",
    },
},
```
Replace with:
```ts
border: {
    value: {
        base: "{colors.primary.700}",
        _dark: "{colors.primary.400}",
    },
},
```

- [ ] **Step 3: Update `bg-accent*` semantic tokens**

Find:
```ts
"bg-accent": { value: { base: "primary.600", _dark: "primary.400" } },
"bg-accent-subtle": {
    value: { base: "primary.500", _dark: "primary.500" },
},
"bg-accent-muted": {
    value: { base: "primary.400", _dark: "primary.600" },
},
```

Replace with:
```ts
"bg-accent": { value: { base: "primary.700", _dark: "primary.400" } },
"bg-accent-subtle": {
    value: { base: "primary.700", _dark: "primary.500" },
},
"bg-accent-muted": {
    value: { base: "primary.500", _dark: "primary.600" },
},
```

- [ ] **Step 4: Verify**

```bash
npm run typecheck && npm run lint && npm run build
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/theme/tokens/semantic.ts
git commit -m "feat(theme)!: shift primary semantic anchor to step 700"
```

---

## Task 5: Shift `secondary` semantic anchors

**Files:**
- Modify: `src/theme/tokens/semantic.ts:100-144`

The brand-orange anchor moves from `secondary.500` to `secondary.600` (where `#e9580c` now lives).

- [ ] **Step 1: Update the `secondary` per-palette tokens**

Find:
```ts
solid: {
    value: {
        base: "{colors.secondary.500}",
        _dark: "{colors.secondary.500}",
    },
},
```
Replace with:
```ts
solid: {
    value: {
        base: "{colors.secondary.600}",
        _dark: "{colors.secondary.500}",
    },
},
```

Find:
```ts
focusRing: {
    value: {
        base: "{colors.secondary.500}",
        _dark: "{colors.secondary.500}",
    },
},
```
Replace with:
```ts
focusRing: {
    value: {
        base: "{colors.secondary.600}",
        _dark: "{colors.secondary.500}",
    },
},
```

Find:
```ts
border: {
    value: {
        base: "{colors.secondary.500}",
        _dark: "{colors.secondary.400}",
    },
},
```
Replace with:
```ts
border: {
    value: {
        base: "{colors.secondary.600}",
        _dark: "{colors.secondary.400}",
    },
},
```

Leave `contrast`, `fg`, `subtle`, `muted`, `emphasized` unchanged.

- [ ] **Step 2: Verify**

```bash
npm run typecheck && npm run lint && npm run build
```

Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add src/theme/tokens/semantic.ts
git commit -m "feat(theme)!: shift secondary semantic anchor to step 600"
```

---

## Task 6: Replace shadow values

**Files:**
- Modify: `src/theme/tokens/semantic.ts:161-210` (the `shadows` block)

- [ ] **Step 1: Replace the `shadows` block**

Find the entire `shadows: { ... }` object inside `semanticTokens`.

Before:
```ts
shadows: {
    xs: {
        value: {
            base: "0px 0px 1px rgba(45, 55, 72, 0.05), 0px 1px 2px rgba(45, 55, 72, 0.1)",
            _dark:
                "0px 0px 1px rgba(13, 14, 20, 1), 0px 1px 2px rgba(13, 14, 20, 0.9)",
        },
    },
    sm: {
        value: {
            base: "0px 0px 1px rgba(45, 55, 72, 0.05), 0px 2px 4px rgba(45, 55, 72, 0.1)",
            _dark:
                "0px 0px 1px rgba(13, 14, 20, 1), 0px 2px 4px rgba(13, 14, 20, 0.9)",
        },
    },
    md: {
        value: {
            base: "0px 0px 1px rgba(45, 55, 72, 0.05), 0px 4px 8px rgba(45, 55, 72, 0.1)",
            _dark:
                "0px 0px 1px rgba(13, 14, 20, 1), 0px 4px 8px rgba(13, 14, 20, 0.9)",
        },
    },
    lg: {
        value: {
            base: "0px 0px 1px rgba(45, 55, 72, 0.05), 0px 8px 16px rgba(45, 55, 72, 0.1)",
            _dark:
                "0px 0px 1px rgba(13, 14, 20, 1), 0px 8px 16px rgba(13, 14, 20, 0.9)",
        },
    },
    xl: {
        value: {
            base: "0px 0px 1px rgba(45, 55, 72, 0.05), 0px 16px 24px rgba(45, 55, 72, 0.1)",
            _dark:
                "0px 0px 1px rgba(13, 14, 20, 1), 0px 16px 24px rgba(13, 14, 20, 0.9)",
        },
    },
    "2xl": {
        value: {
            base: "0px 0px 1px rgba(45, 55, 72, 0.04), 0px 24px 48px rgba(45, 55, 72, 0.12)",
            _dark:
                "0px 0px 1px rgba(13, 14, 20, 1), 0px 24px 48px rgba(13, 14, 20, 0.9)",
        },
    },
    "focus-ring": {
        value: {
            base: "0 0 0 3px rgba(32, 135, 215, 0.4)",
            _dark: "0 0 0 3px rgba(32, 135, 215, 0.6)",
        },
    },
},
```

After:
```ts
shadows: {
    xs: {
        value: {
            base: "0 1px 2px rgba(0, 0, 0, 0.04)",
            _dark: "0 1px 2px rgba(0, 0, 0, 0.4)",
        },
    },
    sm: {
        value: {
            base: "0 1px 2px rgba(0, 0, 0, 0.06)",
            _dark: "0 1px 2px rgba(0, 0, 0, 0.5)",
        },
    },
    md: {
        value: {
            base: "0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)",
            _dark: "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.3)",
        },
    },
    lg: {
        value: {
            base: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
            _dark: "0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.3)",
        },
    },
    xl: {
        value: {
            base: "0 20px 25px -5px rgba(0, 0, 0, 0.10), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
            _dark: "0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
        },
    },
    "2xl": {
        value: {
            base: "0 25px 50px -12px rgba(0, 0, 0, 0.18)",
            _dark: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
        },
    },
    "focus-ring": {
        value: {
            base: "0 0 0 3px rgba(19, 71, 136, 0.18)",
            _dark: "0 0 0 3px rgba(47, 111, 191, 0.4)",
        },
    },
},
```

Note: dark-mode shadow alphas are higher to remain visible on dark surfaces. The `focus-ring` light value uses the new `primary.700` rgb (`19, 71, 136`); the dark value uses `primary.500` rgb (`47, 111, 191`).

- [ ] **Step 2: Verify**

```bash
npm run typecheck && npm run lint && npm run build
```

Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add src/theme/tokens/semantic.ts
git commit -m "feat(theme)!: replace shadows with refined values"
```

---

## Task 7: Switch font stack to Inter Tight + JetBrains Mono

**Files:**
- Modify: `src/theme/tokens/typography.ts:7-10`

- [ ] **Step 1: Update the `fonts` export**

Before:
```ts
export const fonts = {
    heading: "InterVariable, -apple-system, system-ui, sans-serif",
    body: "InterVariable, -apple-system, system-ui, sans-serif",
};
```

After:
```ts
export const fonts = {
    heading: "'Inter Tight', system-ui, -apple-system, 'Segoe UI', sans-serif",
    body: "'Inter Tight', system-ui, -apple-system, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
};
```

- [ ] **Step 2: Verify**

```bash
npm run typecheck && npm run lint && npm run build
```

Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add src/theme/tokens/typography.ts
git commit -m "feat(theme)!: switch font stack to Inter Tight + JetBrains Mono"
```

---

## Task 8: Add named text styles

**Files:**
- Modify: `src/theme/tokens/typography.ts:12-81`

Add five new named styles (`bodyLg`, `body`, `bodySm`, `mono`, `monoSm`) to the existing `textStyles` export. Do **not** add `h1`–`h5` styles (the existing numeric scale `7xl`–`xs` plays that role) and do **not** modify the existing `display`, `caption`, `overline`, or numeric entries.

- [ ] **Step 1: Add the new entries**

In `textStyles`, after the existing `overline` entry, add:

```ts
bodyLg: {
    fontSize: "lg",
    fontWeight: "normal",
    lineHeight: "1.5", // unitless multiplier — scales with fontSize
},
body: {
    fontSize: "md",
    fontWeight: "normal",
    lineHeight: "1.5",
},
bodySm: {
    fontSize: "sm",
    fontWeight: "normal",
    lineHeight: "1.45",
},
mono: {
    fontFamily: "mono",
    fontSize: "md",
    lineHeight: "1.5",
},
monoSm: {
    fontFamily: "mono",
    fontSize: "xs",
    lineHeight: "1.45",
},
```

Note: The existing numeric-scale text styles (`md`, `lg`, etc.) use absolute units like `lineHeight: "1.5rem"`. The new named styles use unitless multipliers because they're meant to scale cleanly when nested inside elements with different font sizes. This is intentional, not an inconsistency to fix.

- [ ] **Step 2: Verify**

```bash
npm run typecheck && npm run lint && npm run build
```

Expected: all pass. The `mono` text style relies on the new `fonts.mono` entry from Task 7.

- [ ] **Step 3: Commit**

```bash
git add src/theme/tokens/typography.ts
git commit -m "feat(theme): add named text styles (body, bodyLg, mono, monoSm)"
```

---

## Task 9: Tighten radii by one step

**Files:**
- Modify: `src/theme/tokens/radii.ts`

- [ ] **Step 1: Replace the radii values**

Before:
```ts
const radii = {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    "2xl": "1.25rem",
};
```

After:
```ts
const radii = {
    sm: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
};
```

- [ ] **Step 2: Update the JSDoc**

Replace the leading JSDoc to reflect the new direction:

Before:
```ts
/**
 * Border-radius tokens.
 *
 * Bumped for a more modern, rounded feel.
 * Previous: sm=0.25, md=0.375, lg=0.5, xl=0.75, 2xl=1
 */
```

After:
```ts
/**
 * Border-radius tokens.
 *
 * Tightened (1.0): sm=4px, md=6px, lg=8px, xl=12px, 2xl=16px.
 * The refined design system favors moderate radii — every component
 * was previously one step looser. `md` (6px) is the default for
 * buttons, inputs, and small cards.
 */
```

- [ ] **Step 3: Verify**

```bash
npm run typecheck && npm run lint && npm run build
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/theme/tokens/radii.ts
git commit -m "feat(theme)!: tighten radii scale by one step"
```

---

## Task 10: Adjust `button.ts` recipe for anchor shift

**Files:**
- Modify: `src/theme/recipes/button.ts:107-119, 153-162`

The deprecated `primary` variant references `primary.500/600/700` literally and needs updating; the `ghost` variant's hover color shifts from `primary.500` to the new action color `primary.700`.

- [ ] **Step 1: Update the deprecated `primary` variant**

Find:
```ts
primary: {
    bg: "primary.500",
    color: "white",
    _hover: {
        bg: "primary.600",
        _disabled: {
            bg: "primary.500",
        },
    },
    _active: {
        bg: "primary.700",
    },
},
```

Replace with:
```ts
primary: {
    bg: "primary.700",
    color: "white",
    _hover: {
        bg: "primary.800",
        _disabled: {
            bg: "primary.700",
        },
    },
    _active: {
        bg: "primary.900",
    },
},
```

- [ ] **Step 2: Update the `ghost` variant hover color**

Find:
```ts
ghost: {
    _hover: {
        bg: "transparent",
        color: "primary.500",
    },
    _active: {
        bg: "gray.200",
    },
},
```

Replace with:
```ts
ghost: {
    _hover: {
        bg: "transparent",
        color: "primary.700",
    },
    _active: {
        bg: "gray.200",
    },
},
```

- [ ] **Step 3: Verify**

```bash
npm run typecheck && npm run lint && npm run build
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/theme/recipes/button.ts
git commit -m "fix(button): adjust hardcoded primary refs for anchor shift"
```

---

## Task 11: Adjust `input.ts` recipe for anchor shift

**Files:**
- Modify: `src/theme/recipes/input.ts:13-21, 59-78`

- [ ] **Step 1: Update the `outline` variant focus state**

Find:
```ts
outline: {
    field: {
        borderRadius: "md",
        bg: { base: "white", _dark: "gray.800" },
        _hover: { borderColor: { base: "gray.300", _dark: "gray.600" } },
        _focus: {
            borderColor: { base: "primary.500", _dark: "primary.200" },
            boxShadow: "0px 0px 0px 1px var(--chakra-colors-primary-500)",
        },
    },
    addon: {
        borderRadius: "md",
        bg: { base: "gray.50", _dark: "gray.700" },
    },
},
```

Replace with:
```ts
outline: {
    field: {
        borderRadius: "md",
        bg: { base: "white", _dark: "gray.800" },
        _hover: { borderColor: { base: "gray.300", _dark: "gray.600" } },
        _focus: {
            borderColor: { base: "primary.700", _dark: "primary.300" },
            boxShadow: "0px 0px 0px 1px var(--chakra-colors-primary-700)",
        },
    },
    addon: {
        borderRadius: "md",
        bg: { base: "gray.50", _dark: "gray.700" },
    },
},
```

- [ ] **Step 2: Update the `link` variant**

Find:
```ts
link: {
    field: {
        background: "transparent",
        border: "none",
        boxShadow: "none",
        padding: 0,
        minHeight: "auto",
        color: "primary.500",
        textDecoration: "underline",
        cursor: "pointer",
        _hover: {
            color: "primary.600",
            textDecoration: "underline",
        },
        _focus: {
            boxShadow: "none",
            color: "primary.600",
        },
    },
},
```

Replace with:
```ts
link: {
    field: {
        background: "transparent",
        border: "none",
        boxShadow: "none",
        padding: 0,
        minHeight: "auto",
        color: "primary.700",
        textDecoration: "underline",
        cursor: "pointer",
        _hover: {
            color: "primary.800",
            textDecoration: "underline",
        },
        _focus: {
            boxShadow: "none",
            color: "primary.800",
        },
    },
},
```

Note: leave the `outline-on-accent` variant alone (it uses `primary.50/100/200` — far from the anchor, unaffected by the shift). Leave the comment on lines 3-7 as historical context.

- [ ] **Step 3: Verify**

```bash
npm run typecheck && npm run lint && npm run build
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/theme/recipes/input.ts
git commit -m "fix(input): adjust hardcoded primary refs for anchor shift"
```

---

## Task 12: Adjust `textarea.ts` recipe for anchor shift

**Files:**
- Modify: `src/theme/recipes/textarea.ts:13-19`

- [ ] **Step 1: Update the `outline` variant focus border**

Find:
```ts
outline: {
    borderRadius: "md",
    bg: { base: "white", _dark: "gray.800" },
    _hover: { borderColor: { base: "gray.300", _dark: "gray.600" } },
    _focus: {
        borderColor: { base: "primary.500", _dark: "primary.200" },
        boxShadow: {
            base: "0px 0px 0px 1px var(--chakra-colors-primary-500)",
            _dark: "0px 0px 0px 1px var(--chakra-colors-primary-200)",
        },
    },
},
```

Replace with:
```ts
outline: {
    borderRadius: "md",
    bg: { base: "white", _dark: "gray.800" },
    _hover: { borderColor: { base: "gray.300", _dark: "gray.600" } },
    _focus: {
        borderColor: { base: "primary.700", _dark: "primary.300" },
        boxShadow: {
            base: "0px 0px 0px 1px var(--chakra-colors-primary-700)",
            _dark: "0px 0px 0px 1px var(--chakra-colors-primary-300)",
        },
    },
},
```

- [ ] **Step 2: Verify**

```bash
npm run typecheck && npm run lint && npm run build
```

Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add src/theme/recipes/textarea.ts
git commit -m "fix(textarea): adjust hardcoded primary refs for anchor shift"
```

---

## Task 13: Adjust `radio-card.ts` recipe for anchor shift

**Files:**
- Modify: `src/theme/recipes/radio-card.ts:14-20`

- [ ] **Step 1: Update the `_checked` state**

Find:
```ts
_checked: {
    borderColor: { base: "primary.500", _dark: "primary.200" },
    boxShadow: {
        base: "0px 0px 0px 1px var(--chakra-colors-primary-500)",
        _dark: "0px 0px 0px 1px var(--chakra-colors-primary-200)",
    },
},
```

Replace with:
```ts
_checked: {
    borderColor: { base: "primary.700", _dark: "primary.300" },
    boxShadow: {
        base: "0px 0px 0px 1px var(--chakra-colors-primary-700)",
        _dark: "0px 0px 0px 1px var(--chakra-colors-primary-300)",
    },
},
```

- [ ] **Step 2: Verify**

```bash
npm run typecheck && npm run lint && npm run build
```

Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add src/theme/recipes/radio-card.ts
git commit -m "fix(radio-card): adjust hardcoded primary refs for anchor shift"
```

---

## Task 14: Adjust `tag.ts` recipe for anchor shift

**Files:**
- Modify: `src/theme/recipes/tag.ts:10-16, 55-63`

- [ ] **Step 1: Update the focus-visible outline color**

Find:
```ts
_focusVisible: {
    boxShadow: "none",
    outlineOffset: "2px",
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.600",
},
```

Replace with:
```ts
_focusVisible: {
    boxShadow: "none",
    outlineOffset: "2px",
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.700",
},
```

- [ ] **Step 2: Update the `ghost` variant hover color**

Find:
```ts
ghost: {
    _hover: {
        bg: "transparent",
        color: "primary.500",
    },
    _active: {
        bg: "transparent",
    },
},
```

Replace with:
```ts
ghost: {
    _hover: {
        bg: "transparent",
        color: "primary.700",
    },
    _active: {
        bg: "transparent",
    },
},
```

- [ ] **Step 3: Verify**

```bash
npm run typecheck && npm run lint && npm run build
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/theme/recipes/tag.ts
git commit -m "fix(tag): adjust hardcoded primary refs for anchor shift"
```

---

## Task 15: Adjust `tree-item.ts` recipe for anchor shift

**Files:**
- Modify: `src/theme/recipes/tree-item.ts:47-54`

- [ ] **Step 1: Update the `treeItemIcon` color**

Find:
```ts
treeItemIcon: {
    width: "45px",
    height: "22px",
    color: "primary.600",
    "&[aria-leaf=true],&[data-leaf]": {
        color: "gray.400",
    },
},
```

Replace with:
```ts
treeItemIcon: {
    width: "45px",
    height: "22px",
    color: "primary.700",
    "&[aria-leaf=true],&[data-leaf]": {
        color: "gray.400",
    },
},
```

Note: leave `treeItemToggle._expanded.color: "primary.400"` alone — that's a deliberately lighter step, unaffected by the anchor shift.

- [ ] **Step 2: Verify**

```bash
npm run typecheck && npm run lint && npm run build && npm test
```

Expected: all pass. Run the full test suite this time — Tasks 10–15 are the last token-touching commits before docs work, and we want a clean green baseline before the visual review.

- [ ] **Step 3: Commit**

```bash
git add src/theme/recipes/tree-item.ts
git commit -m "fix(tree-item): adjust hardcoded primary refs for anchor shift"
```

---

## Task 16: Storybook visual smoke test

**Files:** none (manual review only)

This is a checkpoint, not a code change. Token-only commits don't break tests, but they can subtly break visuals. Catch regressions here before moving to docs work.

- [ ] **Step 1: Start Storybook**

```bash
npm run dev
```

Storybook opens at http://localhost:6006.

- [ ] **Step 2: Walk the buttons story**

Navigate: Atoms → Button → Variants. Confirm:
- `solid` variant renders the new dark navy `#134788` (visibly darker than the previous `#2087d7`)
- Hover state darkens further
- `outline` variant border uses the new color
- Focus ring (Tab into the button) shows the new `rgba(19,71,136,0.18)` glow

- [ ] **Step 3: Walk the form story**

Navigate: Forms → InputField. Tab into a field; confirm the focus border is the new dark navy.

- [ ] **Step 4: Walk the data-table story**

Navigate: Components → Table or Atoms → DataList. Confirm rows are still readable and accent colors look intentional.

- [ ] **Step 5: Toggle dark mode (if Storybook addon supports it) and re-walk the same stories**

Confirm dark-mode primary surfaces use `primary.500` (not the new `700`, which would be invisible on dark backgrounds).

- [ ] **Step 6: Document observations**

If anything looks wrong (over-saturated, illegible, broken hover), stop and fix before continuing. If all looks good, kill the dev server (`Ctrl+C`) and proceed to Task 17.

No commit at this step — review only.

---

## Task 17: Write `docs/design-system.md`

**Files:**
- Create: `docs/design-system.md`

The human-facing master spec. English. Adapted from the proposal but using anker's actual keys.

- [ ] **Step 1: Create the file with this content**

Create `docs/design-system.md` with the exact content below.

````markdown
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
````

- [ ] **Step 2: Verify the file renders cleanly**

```bash
ls -la docs/design-system.md && wc -l docs/design-system.md
```

Expected: file exists, ~280-320 lines.

- [ ] **Step 3: Commit**

```bash
git add docs/design-system.md
git commit -m "docs: add design-system.md master spec"
```

---

## Task 18: Write `CLAUDE-ANKER.md`

**Files:**
- Create: `CLAUDE-ANKER.md` (at repo root)

The AI-consumable rules file. Will ship inside the npm tarball for consumer projects to `@`-import into their own CLAUDE.md.

- [ ] **Step 1: Create the file with this content**

Create `CLAUDE-ANKER.md` at the repo root with the exact content below.

````markdown
# anker Design System — AI Rules

This file is designed to be `@`-imported into a consumer project's `CLAUDE.md` so Claude Code instances working on that project automatically follow the anker design system. Add this line to your root `CLAUDE.md`:

```
@node_modules/@knkcs/anker/CLAUDE-ANKER.md
```

The full human-facing spec lives at the anker GitHub Pages docs site (linked from the `@knkcs/anker` README).

---

## Five design principles

1. **Refined Minimalism.** Surfaces are calm. Brand colors are the crown, not the carpet — primary action only.
2. **Density over air.** Power users spend hours here. Compact rows, tight spacing, small UI sizes — never cramped.
3. **Consistency over creativity.** If a pattern exists (status pill, empty state, filter toolbar), use it as-is. No per-product variants.
4. **Clear hierarchy.** Page title, primary action, content — answerable in under a second.
5. **Keyboard-first where it matters.** Search (`/`), command palette (`⌘K`), navigation must be keyboard-operable. Show shortcuts in tooltips.

---

## Token quick reference

**Palette anchors** (the visually-load-bearing step in each scale):
- `primary.700` (`#134788`) — action color (buttons, links, focus rings, active states)
- `secondary.600` (`#e9580c`) — brand orange (use sparingly; not for standard CTAs)
- `gray.700` — body text
- `gray.900` — headings

**Brand colors** (`brand.*`) — exact knk Brand Guidelines values for logos, headers, about pages. Do **not** use for interactive UI.

**Semantic tokens** (prefer these over raw):
- `bg-canvas` (page frame), `bg-surface` (cards/modals), `bg-subtle` (toolbars), `bg-muted` (hover)
- `default` / `emphasized` / `muted` / `subtle` (text)
- `border` (standard 1px), `accent` (action), `success`, `error`

**Defaults:**
- Border radius: `md` = 6px (use this for buttons, inputs, small cards)
- Body font size: `md` = 14px
- Font stack assumes Inter Tight (UI) and JetBrains Mono (code) — consumer must load via Google Fonts
- Light + dark mode supported via `next-themes`

---

## Do

- **Use semantic tokens before raw tokens.** Reach for `accent` before `primary.700`. Why: semantic tokens are the contract, raw tokens are the implementation; raw use becomes a search-and-replace cost on the next visual update.
- **Use `<Button variant="solid">` (not `variant="primary"`).** The `primary` variant is deprecated in anker. Why: `solid` reads from `colorPalette` automatically, so the same component works for `colorPalette="primary"`, `colorPalette="secondary"`, `colorPalette="gray"`.
- **Use `brand.*` only for branding surfaces.** Logos, headers, about pages. Why: brand colors are print-aligned and not WCAG-tuned for interactive UI.
- **Use anker components instead of raw Chakra.** Import from `@knkcs/anker/{primitives,components,atoms,forms,feedback}`. Why: anker wraps Chakra with consistent defaults; consuming raw Chakra bypasses those defaults and creates visual drift.
- **Respect `prefers-reduced-motion`.** No per-component handling needed — anker's theme enforces this globally. Why: users who set this OS preference get a broken UI if components add their own motion.

---

## Don't

- **No hex codes inline in components.** Always use tokens. Why: hex codes don't update when the design system evolves; tokens do.
- **No Material-style large shadows.** Anker shadows are deliberately dezent. Why: heavy shadows read as Material/Bootstrap-4-era and clash with the refined direction.
- **No `secondary.500` for standard CTAs.** The brand orange now lives at `secondary.600`; `secondary.500` is a lighter shade. Why: standard CTAs use `primary.700`, not orange — orange is for branded moments only.
- **No mixing radii within one component group.** A card with `lg` can hold inputs with `md`, but not a mix of `md` and `lg` siblings. Why: visual rhythm breaks when adjacent elements have different roundness.
- **No animations over 300ms.** Outside marketing/onboarding. Why: long animations slow down power users; the design language values immediacy.
- **No Chakra v2 patterns.** No `extendTheme`, `colorScheme`, `useColorMode` from `@chakra-ui/react`. Use `createSystem`, `colorPalette`, `next-themes`. Why: anker is built on Chakra v3 throughout; v2 patterns either error at build time or silently no-op.
- **No new color introductions.** If a color isn't in `colors.ts`, it doesn't exist. Why: the palette is closed by design — adding ad-hoc colors fragments the system.

---

## Pointers

- Full spec: anker GitHub Pages docs site (`/design-system`)
- Components: `node_modules/@knkcs/anker/dist/{primitives,components,atoms,forms,feedback}`
- Theme entry: `import system from "@knkcs/anker/theme"`
- Provider entry: `import { Provider } from "@knkcs/anker/primitives"`
- Anker development rules (for working *on* anker, not consuming it): `node_modules/@knkcs/anker/CLAUDE.md` is **not** included in the package; see the anker GitHub repo
````

- [ ] **Step 2: Verify**

```bash
ls -la CLAUDE-ANKER.md && wc -l CLAUDE-ANKER.md
```

Expected: file exists, ~80-120 lines.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE-ANKER.md
git commit -m "docs: add CLAUDE-ANKER.md for AI-assisted consumers"
```

---

## Task 19: Update `package.json` to ship `CLAUDE-ANKER.md`

**Files:**
- Modify: `package.json` (the `files` field)

- [ ] **Step 1: Update the `files` array**

Find:
```json
"files": [
    "dist"
],
```

Replace with:
```json
"files": [
    "dist",
    "CLAUDE-ANKER.md"
],
```

- [ ] **Step 2: Verify the file shows up in the npm pack output**

```bash
npm pack --dry-run 2>&1 | grep -E "(CLAUDE-ANKER|dist/)" | head -10
```

Expected: output includes `CLAUDE-ANKER.md` and entries from `dist/`.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: ship CLAUDE-ANKER.md in npm package"
```

---

## Task 20: Update README with "Using with Claude Code" section

**Files:**
- Modify: `README.md` (append after the "Imports by layer" section)

- [ ] **Step 1: Add the new section**

Open `README.md`. After the closing ` ``` ` of the "Imports by layer" code block (around line 55) and before the "## Brand Colors" heading, insert:

```markdown
## Using with Claude Code

If your consumer project uses Claude Code, add this line to your root `CLAUDE.md` to import anker's design-system rules automatically:

```
@node_modules/@knkcs/anker/CLAUDE-ANKER.md
```

Claude will then follow anker's design principles, token rules, and component conventions when assisting with your code.

```

- [ ] **Step 2: Verify the README still renders cleanly**

```bash
head -80 README.md
```

Expected: the new section sits between "Imports by layer" and "Brand Colors", well-formatted.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs(readme): add 'Using with Claude Code' section"
```

---

## Task 21: Add design-system pointer to root `CLAUDE.md`

**Files:**
- Modify: `CLAUDE.md` (add a one-paragraph pointer in the "Patterns" section)

- [ ] **Step 1: Open `CLAUDE.md` and find the "## Patterns" section**

The section header reads `## Patterns` and contains subsections like "Component File Structure", "Form Controls", etc.

- [ ] **Step 2: Insert a new subsection at the top of "## Patterns"**

Right after the `## Patterns` header (before the first subsection), add:

```markdown
### Design System

The full visual language — palettes, semantic tokens, typography, spacing, radii, motion — lives in `docs/design-system.md`. The token implementation lives in `src/theme/tokens/`. When making styling decisions, consult `docs/design-system.md` first; the rules in `CLAUDE-ANKER.md` (shipped to npm consumers) are a condensed version of the same source.

```

- [ ] **Step 3: Verify**

```bash
grep -A 2 "### Design System" CLAUDE.md
```

Expected: the new subsection appears at the top of the Patterns section.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude): add design-system pointer in patterns section"
```

---

## Task 22: Create `CHANGELOG.md` with the 1.0.0 entry

**Files:**
- Create: `CHANGELOG.md`

Use the [Keep a Changelog](https://keepachangelog.com/) format.

- [ ] **Step 1: Create the file with this content**

Create `CHANGELOG.md` at the repo root with the exact content below.

````markdown
# Changelog

All notable changes to `@knkcs/anker` are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] — 2026-04-30

First stable release. Adopts the refined design-system value set across all token layers.

### Changed (visual — breaking)

- **Primary blue shifted from `#2087d7` to `#134788`** (a darker, more legible navy). Every solid button, link, focus ring, and accent surface in every consumer will visibly change color on upgrade.
- **Primary action anchor moved from `primary.500` to `primary.700`.** The semantic tokens `accent`, `bg-accent`, and `primary.solid`/`focusRing`/`border` now point to step 700. The full primary palette was replaced position-by-position; consumers using `primary.500` directly as a "primary blue" reference will see a different shade — switch to the `accent` semantic token.
- **Brand orange anchor moved from `secondary.500` to `secondary.600`.** `#e9580c` (the brand-guideline orange) now lives at `secondary.600`. Consumers using `secondary.500` for the brand orange now get `#f25f1c` (a lighter shade).
- **All radii tightened by one step.** `md` is now 6px (was 8px); other steps shifted accordingly. Every rounded corner in every consumer becomes ~2px less round.
- **Font stack changed from `InterVariable` to `Inter Tight`.** Consumers must load Inter Tight from Google Fonts; the platform fallback differs slightly.
- **Shadows replaced with softer values.** Diffused, lower-alpha rgba values; the `focus-ring` shadow now uses the new primary tint (`rgba(19,71,136,0.18)`).

### Added

- `gray.950` (`#020617`) — closes the gray scale.
- `secondary.950` (`#411208`) — closes the secondary scale.
- Explicit `success`, `warning`, `danger`, `info` palettes (anker-owned, replacing reliance on Chakra defaults).
- `mono` font stack (`'JetBrains Mono', ui-monospace, …`) for code, IDs, and API keys.
- Named text styles: `bodyLg`, `body`, `bodySm`, `mono`, `monoSm`.
- `docs/design-system.md` — human-facing master spec (hosted on GitHub Pages).
- `CLAUDE-ANKER.md` — AI-consumable design-system rules, shipped in the npm tarball. Consumer projects using Claude Code can `@`-import via `@node_modules/@knkcs/anker/CLAUDE-ANKER.md`.

### Migration notes

Consumers using semantic tokens (`accent`, `bg-canvas`, `border`, `primary.solid`, etc.) get the new visual direction automatically. Consumers using raw tokens (`primary.500`, `secondary.500`) should grep for those references and replace with the corresponding semantic token where possible. The `<Button variant="primary">` variant remains deprecated; prefer `<Button variant="solid">`.

````

- [ ] **Step 2: Verify**

```bash
ls -la CHANGELOG.md && head -10 CHANGELOG.md
```

Expected: file exists, header looks right.

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: add CHANGELOG.md with 1.0.0 entry"
```

---

## Task 23: Bump version to 1.0.0

**Files:**
- Modify: `package.json` (the `version` field)

- [ ] **Step 1: Bump the version**

Find:
```json
"version": "0.0.6",
```

Replace with:
```json
"version": "1.0.0",
```

(Use the `Edit` tool, not `npm version` — `npm version` would create a tag and an extra commit, which we don't want until after the PR merges.)

- [ ] **Step 2: Run the full check one last time**

```bash
npm run typecheck && npm run lint && npm run build && npm test
```

Expected: all pass. This is the final verification before the version commit.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: bump to 1.0.0"
```

- [ ] **Step 4: Verify the commit log**

```bash
git log main..HEAD --oneline
```

Expected: ~22 commits in order, last one being `chore: bump to 1.0.0`.

---

## Task 24: Open the PR

**Files:** none (git/gh only)

- [ ] **Step 1: Push the branch**

```bash
git push -u origin release/1.0.0
```

- [ ] **Step 2: Open the PR**

```bash
gh pr create --title "release: 1.0.0 — refined design-system values" --body "$(cat <<'EOF'
## Summary

- Adopt the refined design-system value set: GitHub-inspired palette (`primary.700` = `#134788`), Inter Tight font, tighter radii, softer shadows.
- Keep the public API stable: all palette keys (`primary`, `secondary`, `gray`, `brand.*`) and semantic tokens are unchanged. Only the values behind them change.
- Add `docs/design-system.md` (human-facing spec) and `CLAUDE-ANKER.md` (shipped in the npm tarball for consumer projects to `@`-import into their own `CLAUDE.md`).
- First stable release — bumped to `1.0.0`.

See `docs/superpowers/specs/2026-04-30-design-system-1.0-design.md` for the full design rationale and `CHANGELOG.md` for the visual breaking changes consumers should expect.

## Test plan

- [ ] CI green: `npm run typecheck && npm run lint && npm run build && npm test`
- [ ] Storybook visual review: solid/outline/ghost button, input focus state, table rows, status badges — light and dark mode
- [ ] `npm pack --dry-run` confirms `CLAUDE-ANKER.md` ships in the tarball
- [ ] Consumer smoke test (optional): apply this branch in one of CMS/IDP/Tasks/MAS via `npm pack` + local install, confirm the visual shift looks right in a real product context

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Capture the PR URL and report it back**

After `gh pr create` returns a URL, the work is ready for human review. Do **not** publish to npm from this plan — that step happens after PR review and merge to `main`.

---

## Post-merge (out of plan, for the human)

After the PR merges to `main`:

1. `git checkout main && git pull`
2. `npm publish` (publishes `1.0.0` to the npm registry)
3. `git tag v1.0.0 && git push --tags`
4. Create a GitHub Release for `v1.0.0` with the `CHANGELOG.md` 1.0.0 entry as the body.
5. Notify consumer-team channels (CMS, IDP, Tasks, MAS) about the visual breaking change so they can plan their upgrade.
