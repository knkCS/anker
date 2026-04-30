# Chakra v3 Reference — @knkcs/anker

This document describes how anker uses Chakra UI v3. Read this before creating or modifying any theme recipe, token, or Chakra wrapper component.

## System Setup

The theme system is created in `src/theme/index.ts`:

```tsx
import { createSystem, defaultConfig } from "@chakra-ui/react";

const system = createSystem(defaultConfig, {
  globalCss: { /* ... */ },
  theme: {
    tokens: { colors, durations, easings, fonts, spacing, radii, zIndex },
    textStyles,
    semanticTokens,
    recipes: { button, container, separator, formLabel, textarea, tooltip, ... },
    slotRecipes: { card, checkbox, dialog, drawer, field, input, menu, modal, ... },
  },
});

export default system;
```

The provider in `src/primitives/provider.tsx` wraps `ChakraProvider` with `value={system}`:

```tsx
<ChakraProvider value={system ?? defaultSystem}>
  <ColorModeProvider {...props} />
</ChakraProvider>
```

## Recipe Patterns

### Single-part recipe (`defineRecipe`)

Used for components with a single DOM element or where all styling applies to the root.

Registered: `button`, `container`, `separator`, `formLabel`, `textarea`, `tooltip`, `tsRadioCard`, `tsProperty`, `treeItem`, `tag`

Structure:

```tsx
import { defineRecipe } from "@chakra-ui/react";

export const buttonTheme = defineRecipe({
  base: {
    lineHeight: "1.2",
    borderRadius: "md",
    fontWeight: "semibold",
    transitionProperty: "common",
    transitionDuration: "normal",
    _focusVisible: {
      outlineOffset: "2px",
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary.600",
    },
    _disabled: {
      opacity: 0.4,
      cursor: "not-allowed",
    },
  },
  variants: {
    size: {
      lg: { h: "9", px: 3, fontSize: "sm" },
      md: { h: "8", px: 2.5, fontSize: "sm" },
      sm: { h: "7", px: 2, fontSize: "sm" },
    },
    variant: {
      primary: {
        bg: "primary.700",
        color: "white",
        _hover: { bg: "primary.800" },
      },
      secondary: {
        bg: { base: "white", _dark: "gray.800" },
        borderWidth: "1px",
        borderColor: "gray.200",
      },
      ghost: {
        _hover: { bg: "transparent", color: "primary.700" },
      },
    },
  },
  defaultVariants: {
    size: "lg",
    variant: "solid",
  },
});
```

Key points:
- Export the recipe from `src/theme/recipes/{name}.ts`
- Register it in `src/theme/index.ts` under `recipes: { ... }`
- Re-export from `src/theme/recipes/index.ts`
- This is a simplified excerpt — the actual button recipe has additional variants (solid, outline, link, link-gray)

### Multi-part recipe (`defineSlotRecipe`)

Used for composite components with multiple named slots.

Registered: `card`, `checkbox`, `comment`, `dialog`, `drawer`, `field` (inline), `input`, `menu`, `modal`, `persona`, `popover`, `stepper`, `table`, `tabs`

Structure:

```tsx
import { defineSlotRecipe } from "@chakra-ui/react";

export const cardSlotRecipe = defineSlotRecipe({
  slots: ["root", "header", "body", "footer", "title", "description"],
  base: {
    root: {
      bg: { base: "white", _dark: "gray.800" },
    },
  },
  variants: {
    variant: {
      elevated: { root: { boxShadow: "md" } },
      flat: { root: { shadow: "md" } },
    },
  },
  defaultVariants: {
    variant: "elevated",
  },
});
```

Key points:
- `slots` array declares all styleable parts
- Each entry in `base`/`variants` maps slot names to style objects
- `colorPalette` default uses `as never` cast: `defaultVariants: { colorPalette: "primary" as never }`

### Consuming recipes in components

**Pattern 1 — Automatic:** Chakra applies recipes automatically when the recipe key matches the Chakra component name. Button, Input, Card, etc. pick up their recipes from the system without any code.

**Pattern 2 — Manual with `useSlotRecipe`:** For custom multi-part components (e.g., Stepper):

```tsx
import { chakra, useSlotRecipe } from "@chakra-ui/react";
import { createContext, useContext } from "react";

// 1. Create a context for distributing slot styles
const StylesContext = createContext<StepperStyles>({});
const useStyles = () => useContext(StylesContext);

// 2. In the root component, call useSlotRecipe
const recipe = useSlotRecipe({ key: "stepper" });
const styles = recipe({ variant, size, orientation });

// 3. Provide styles via context
<StylesContext.Provider value={styles}>
  {children}
</StylesContext.Provider>

// 4. In child components, consume styles
const styles = useStyles();
<chakra.div css={styles.icon} data-active={dataAttr(isActive)}>
  {content}
</chakra.div>
```

## Token Inventory

### Color scales

**primary** (UI blue — anchored at `#134788` at step 700; the action color across the system, exposed via the `accent` semantic token):
50 `#eff6fc` · 100 `#d9eafa` · 200 `#b8d6f5` · 300 `#88baeb` · 400 `#5995dc` · 500 `#2f6fbf` · 600 `#1c5aa8` · **700 `#134788`** · 800 `#0f395d` · 900 `#0a2740` · 950 `#061a2c`

**secondary** (brand orange — anchored at `#e9580c` at step 600; reserved for branded moments, not standard CTAs):
50 `#fff5ed` · 100 `#ffe6d4` · 200 `#ffc8a8` · 300 `#ffa170` · 400 `#ff7c41` · 500 `#f25f1c` · **600 `#e9580c`** · 700 `#b73806` · 800 `#912e0d` · 900 `#762a0e` · 950 `#411208`

**gray** (blue-tinted, the workhorse — ~80% of UI pixels):
50 `#f8fafc` · 100 `#f1f5f9` · 200 `#e2e8f0` · 300 `#cbd5e1` · 400 `#94a3b8` · 500 `#64748b` · 600 `#475569` · 700 `#334155` · 800 `#1e293b` · 900 `#0f172a` · 950 `#020617`

**brand** (exact knk Brand Guidelines, October 2021 — use for logos, headers, about pages):
blue `#004576` · navy `#0f395d` (= `primary.800`) · light-blue `#6fa7d1` · orange `#e9580c` (= `secondary.600`) · gold `#f4b235` · light-gray `#f2f2f2`

**Status palettes** (anker-owned 5-step subsets — `50/100/500/600/700`):
`success` (greens) · `warning` (ambers) · `danger` (reds) · `info` (matches the primary blue scale; `info.700` = `primary.700`)

### Semantic color tokens

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `bg-canvas` | `gray.50` | `gray.900` | Page background |
| `bg-surface` | `white` | `gray.800` | Card/panel backgrounds |
| `bg-subtle` | `gray.50` | `gray.700` | Subtle background |
| `bg-muted` | `gray.100` | `gray.600` | Muted background |
| `default` | `gray.900` | `white` | Primary text |
| `inverted` | `white` | `gray.900` | Inverted text |
| `emphasized` | `gray.700` | `gray.100` | Emphasized text |
| `muted` | `gray.600` | `gray.300` | Muted text |
| `subtle` | `gray.500` | `gray.400` | Subtle text |
| `border` | `gray.200` | `gray.700` | Default borders |
| `accent` | `primary.700` | `primary.300` | Accent color (action) |
| `success` | `green.600` | `green.200` | Success indicators |
| `error` | `red.600` | `red.200` | Error indicators |

**Accent surface tokens:**
`bg-accent` (`primary.700` light / `primary.400` dark) · `bg-accent-subtle` (`primary.700` light / `primary.500` dark) · `bg-accent-muted` (`primary.500` light / `primary.600` dark) · `on-accent` (`white`) · `on-accent-muted` (`primary.50`) · `on-accent-subtle` (`primary.100`)

Note: `primary.solid` and `primary.focusRing` use `primary.700` in light and `primary.500` in dark — this asymmetry is intentional (see `src/theme/tokens/semantic.ts` and `docs/design-system.md` §3.1). Do not "fix" it back to symmetry.

**Color palette tokens** (per-palette, used by components with `colorPalette` prop):
`{palette}.contrast` · `{palette}.fg` · `{palette}.subtle` · `{palette}.muted` · `{palette}.emphasized` · `{palette}.solid` · `{palette}.focusRing` · `{palette}.border`

### Shadow tokens

All shadows have light/dark variants. Refined as of 1.0 — softer rgba(0,0,0,…) values; dark-mode alphas raised to remain visible on dark surfaces.

| Token | Light |
|---|---|
| `xs` | `0 1px 2px rgba(0, 0, 0, 0.04)` |
| `sm` | `0 1px 2px rgba(0, 0, 0, 0.06)` |
| `md` | `0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)` |
| `lg` | `0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)` |
| `xl` | `0 20px 25px -5px rgba(0, 0, 0, 0.10), 0 8px 10px -6px rgba(0, 0, 0, 0.04)` |
| `2xl` | `0 25px 50px -12px rgba(0, 0, 0, 0.18)` |
| `focus-ring` | `0 0 0 3px rgba(19, 71, 136, 0.18)` (primary.700 at 18% alpha) |

### Opacity tokens

`disabled`: 0.4 · `readOnly`: 0.8

### Spacing (custom additions to Chakra defaults)

`1.5` → `0.375rem` · `2.5` → `0.625rem` · `3.5` → `0.875rem` · `4.5` → `1.125rem`

### Border radii

`sm` → `0.25rem` (4px) · `md` → `0.375rem` (6px) · `lg` → `0.5rem` (8px) · `xl` → `0.75rem` (12px) · `2xl` → `1rem` (16px). Default radius for buttons, inputs, and small cards is `md`.

### Z-index scale

`dropdown` 1000 < `sticky` 1100 < `overlay` 1300 < `modal` 1400 < `popover` 1500 < `toast` 1700

### Motion tokens

**Durations:** `fast` 150ms · `normal` 200ms · `slow` 300ms

**Easings:** `ease-in` cubic-bezier(0.4, 0, 1, 1) · `ease-out` cubic-bezier(0, 0, 0.2, 1) · `ease-in-out` cubic-bezier(0.4, 0, 0.2, 1)

### Typography

**Font families** (consumers load via Google Fonts — anker ships only the stack, not the font files):
- `heading` / `body`: `'Inter Tight', system-ui, -apple-system, 'Segoe UI', sans-serif`
- `mono`: `'JetBrains Mono', ui-monospace, SFMono-Regular, monospace`

**Text styles:**
- Numeric scale: `7xl` through `xs` — `fontSize` + `lineHeight` (+ negative `letterSpacing` on 4xl+)
- Named: `display`, `bodyLg`, `body`, `bodySm`, `caption`, `overline`, `mono`, `monoSm` — see `src/theme/tokens/typography.ts`

## Dark Mode

- All semantic tokens use `{ base: "lightValue", _dark: "darkValue" }` syntax
- Never use `useColorModeValue` — it's a Chakra v2 pattern
- Components get dark mode automatically through semantic tokens
- `ColorModeProvider` in `src/primitives/color-mode.tsx` handles the toggle

## Global CSS Conventions

Defined in `src/theme/index.ts` `globalCss`:

- `body` uses `color: "default"` semantic token and `bg: { base: "white", _dark: "#000" }` (note: body background uses hardcoded `#000` for dark mode, not the `bg-canvas` semantic token)
- `*::placeholder` has `opacity: 1` and `color: "muted"`
- `*, *::before, *::after` and `table, td, th` inherit `borderColor: "border"` token
- `html, body` have `height: 100%`
- `#__next, #root, #app` are flex column containers with `minH: 100%`
- `_motionReduce` handles `prefers-reduced-motion` globally — sets `animationDuration`, `transitionDuration` to `0.01ms !important`, `animationIterationCount` to `1 !important`, and `scrollBehavior` to `auto !important`. Never add per-component reduced-motion queries.

## CSS Custom Properties Pattern

Some recipes use CSS custom properties for state-dependent styling (e.g., menu recipe):

```tsx
const $bg = "--menu-bg";

// In base styles:
{
  [$bg]: "colors.white",
  bg: `var(${$bg})`,
  _dark: {
    [$bg]: "colors.gray.800",
  },
}
```

This avoids duplication when multiple states need to reference the same computed value.
