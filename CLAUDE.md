# CLAUDE.md

This file provides guidance to Claude Code when working with the @knkcs/anker UI library.

## Project Overview

Anker is the shared UI component library for the knk software group, extracted and rebuilt from the knkCMS Core monolith. It provides design tokens, primitives, atoms, form controls, and feedback components used by all knkCMS microservices (Core, Shell, Odon, Template, and future services).

## Architecture

### Package Structure

Single npm package (`@knkcs/anker`) with subpath exports organized in six layers:

1. **`/theme`** — Chakra UI v3 design tokens, color scales, semantic tokens, shadows, typography, spacing, motion tokens, z-index scale, 24 component recipes, and a preset system (`createAnkerTheme()` + `ThemePreset`). Consumers use `<Provider>` (defaults to anker's system) or create a custom system via `createAnkerTheme(preset)`.
2. **`/primitives`** — Thin wrappers around Chakra UI components with consistent defaults (Accordion, Alert, Avatar, Breadcrumb, HoverCard, Menu, PinInput, Popover, Progress, SegmentedControl, Skeleton, Slider, Spinner, Tooltip, Switch, etc.). 23 components.
3. **`/components`** — Higher-level composites: Card, Drawer, Modal, NavList, Pagination, Stepper, Table, Timeline, TreeView, Widget, FactBox. 14 components.
4. **`/atoms`** — Small reusable UI units: Persona, StatusBadge, TypeBadge, SearchInput, DateTime, EmptyState, Comment, Select, Clipboard, DataList, etc. 16 component groups.
5. **`/forms`** — Form controls built on React Hook Form + Zod: InputField, TextareaField, ArrayField, DatePickerField, CodeField, etc. 19 components.
6. **`/feedback`** — Feedback patterns: ConfirmModal with provider + `useConfirmModal` hook.

### Key Technology Choices

| Concern | Choice |
|---------|--------|
| UI framework | Chakra UI v3 (recipes, slot recipes, semantic tokens) |
| Data tables | TanStack React Table v8 (headless, generic DataTable wrapper) |
| Icons | Lucide React (replacing FontAwesome from Core) |
| Form state | React Hook Form (replacing Formik from Core) |
| Validation | Zod (replacing Yup from Core) |
| Build | tsup (esbuild-based, ESM + .d.ts) |
| Docs | Storybook, deployed to GitHub Pages |
| Lint/format | Biome |
| Types | TypeScript strict mode |

### Directory Layout

```
src/
├── theme/           # Design tokens + recipes
│   ├── tokens/      # colors, semantic, shadows, spacing, radii, typography, animations, z-index
│   ├── recipes/     # Chakra component recipes (24 files)
│   ├── presets/     # Theme personality presets (ThemePreset, defaultPreset)
│   ├── create-theme.ts  # createAnkerTheme() factory
│   └── utils/       # Color manipulation helpers
├── primitives/      # Chakra wrappers (accordion, alert, avatar, breadcrumb, hover-card, menu, pin-input, popover, progress, segmented-control, skeleton, slider, spinner, tooltip, etc.)
├── components/      # Card, Drawer, Modal, Pagination, Stepper, Table, Timeline, TreeView, Widget, FactBox
├── atoms/           # Persona, StatusBadge, SearchInput, DateTime, Select, Clipboard, DataList, etc.
├── forms/           # React Hook Form controls (InputField, ArrayField, etc.)
├── feedback/        # ConfirmModal + provider
└── (no root index.ts — consumers use subpath imports)
```

Note: Stories are co-located with source files inside `src/` (e.g., `src/atoms/button/button.stories.tsx`), not in a separate `stories/` directory.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Storybook dev server
npm run build        # Build library with tsup
npm run lint         # Lint with Biome
npm run lint:write   # Lint and auto-fix
npm run typecheck    # TypeScript checking (tsc --noEmit)
npm run test         # Run tests
```

### Brand Color Guidelines

The knk Brand Guidelines (October 2021) define six brand colors. The theme includes these as exact `brand.*` tokens (`brand.blue`, `brand.navy`, `brand.light-blue`, `brand.orange`, `brand.gold`, `brand.light-gray`) alongside the UI-optimized `primary`/`secondary`/`gray` scales.

- **UI primary blue** is anchored at `primary.700: #134788` (used for action surfaces, links, focus rings via the `accent` semantic token). The brand-guideline navy `#0f395d` lives at `primary.800` (= `brand.navy`); the brand-guideline blue `#004576` (`brand.blue`) is intentionally NOT in the primary scale — it reads as too heavy as a CTA.
- **UI secondary orange** is anchored at `secondary.600: #e9580c`, matching the brand orange exactly. Reserved for branded moments (empty states, onboarding) — not standard CTAs.
- Use `brand.*` tokens for branding elements (logos, headers, about pages), use `primary.*`/`secondary.*` for interactive UI (buttons, links, focus rings)

## Design Principles

- **No domain coupling**: Components must not import from any service codebase (no @root/, no API calls, no service-specific types)
- **Token-first styling**: Use semantic tokens (bg-canvas, accent, border, etc.) instead of hardcoded colors
- **Props over i18n**: User-facing strings are props with English defaults, not i18n keys
- **Lucide icons only**: All icons use lucide-react. No FontAwesome.
- **React Hook Form**: Form controls use RHF Controller pattern. Provide ControlledFormField for non-RHF usage.
- **Accessibility**: All interactive components must have proper ARIA attributes (see Accessibility Conventions below)
- **RTL-ready**: Use logical CSS properties (`marginInlineStart`, `insetInlineEnd`) instead of physical direction properties (`ml`, `right`)
- **Reduced motion**: The theme handles `prefers-reduced-motion` globally — do not add per-component media queries
- **displayName required**: All exported components must have `displayName` set for React DevTools
- **Composable over opinionated**: Prefer render props and slots over baked-in behavior (e.g., Modal accepts children, not a Formik form)

## Patterns

### Design System

The full visual language — palettes, semantic tokens, typography, spacing, radii, motion — lives in `docs/design-system.md`. The token implementation lives in `src/theme/tokens/`. When making styling decisions, consult `docs/design-system.md` first; the rules in `CLAUDE-ANKER.md` (shipped to npm consumers) are a condensed version of the same source.

### Component File Structure

Each component follows this pattern:
```
component-name/
├── component-name.tsx    # Main component
├── types.ts              # Props interface (if complex)
├── index.ts              # Re-export
└── component-name.stories.tsx  # Storybook story
```

### Form Controls

Form controls follow the `*Field` naming convention and wrap RHF's Controller:
```tsx
// Example: InputField
import { Controller, useFormContext } from "react-hook-form";

interface InputFieldProps {
  name: string;
  label?: string;
  // ...
}
```

### Accessibility Conventions

- **FormField** provides `aria-describedby` automatically via the children render callback, linking inputs to their description, helper text, and error messages
- **Error messages** use `aria-live="polite"` so screen readers announce validation errors when they appear
- **Stepper** uses `aria-current="step"` on the active step
- **Touch targets**: All interactive elements (buttons, icon buttons) must meet the 44×44px minimum — use `minWidth="44px"` and `minHeight="44px"` if the visual size is smaller
- **Icon-only buttons**: Must always have an `aria-label` prop (configurable, with English default)

### Theme Recipes

Component recipes use Chakra v3's `defineRecipe` (single-part) or `defineSlotRecipe` (multi-part):
```tsx
import { defineRecipe } from "@chakra-ui/react";
export const buttonTheme = defineRecipe({ ... });
```

### Theme Preset System

Consumers can create customized theme systems via `createAnkerTheme()`:
```tsx
import { createAnkerTheme } from "@knkcs/anker/theme";
import type { ThemePreset } from "@knkcs/anker/theme";

const custom: ThemePreset = {
  name: "editorial",
  fonts: { heading: "Georgia, serif" },
  radii: { sm: "0", md: "0", lg: "0", xl: "0", "2xl": "0" },
};

<Provider system={createAnkerTheme(custom)}>
```

Presets override token layers (colors, semanticTokens, textStyles, fonts, radii, durations, easings). All component recipes and structural defaults are preserved. The default export from `@knkcs/anker/theme` is equivalent to `createAnkerTheme()` with no arguments.

Preset files live in `src/theme/presets/`. The `ThemePreset` interface is in `src/theme/presets/types.ts`.

### Button Variant Defaults

The button and tag recipes default `colorPalette` to `"primary"`. This means:
- `<Button variant="solid">` renders primary blue by default
- Override with `colorPalette="secondary"` or `colorPalette="gray"` when needed
- The `primary` variant is **deprecated** — use `variant="solid"` instead (they are now equivalent)

### Component Visual Polish

Several component recipes include built-in visual polish:
- **Button**: `boxShadow: "focus-ring"` on focus (primary-tinted glow), `scale(0.98)` on active press
- **Card**: Elevated variant lifts 1px + deepens shadow on hover
- **Tooltip**: `slideUp` entrance animation (150ms ease-out)
- **Modal**: `backdropFilter: blur(4px)` frosted glass overlay

### Dashboard & Widget Framework

`src/components/dashboard/` provides a domain-free dashboard framework (exported
from `@knkcs/anker/components`): the widget contract (`WidgetDefinition`,
`WidgetInstance`, `WidgetRenderProps`, …), `createWidgetRegistry`, and
`<Dashboard>` — a `react-grid-layout` engine with view/edit modes, a catalog, a
schema-driven config form, and a toolbar.

- **Controlled model**: consumers own the saved `widgets` + `mode`; the
  `useDashboardDraft` hook owns the ephemeral edit-session draft
  (add/remove/resize/discard/dirty). `<Dashboard>` emits `onCommit(draft)` on
  Save and reverts on Discard.
- **Domain-free**: widgets self-fetch data; strings are props
  (`DashboardLabels`); permissions are opaque `requiredPermissions` string
  tokens + an optional `isAvailable(ctx)` predicate.
- **react-grid-layout** is an optional peer dependency (`^2.2.3`). anker imports
  its flat-props API from the `react-grid-layout/legacy` subpath (2.x relocated
  it there) and injects the grid CSS via a Chakra `css` object — no stylesheet
  import. Both `react-grid-layout` and `react-grid-layout/legacy` are in tsup
  `external`.
- Full usage guide: the `Components/Dashboard` Storybook docs
  (`src/components/dashboard/dashboard.mdx`).

## Chakra v3 Anti-Patterns

This project uses Chakra UI v3. Never suggest v2 patterns:

| Never use (Chakra v2) | Use instead (Chakra v3) |
|---|---|
| `extendTheme()` | `createSystem(defaultConfig, { theme: {...} })` |
| `useStyleConfig()` / `useMultiStyleConfig()` | `useRecipe({ key })` / `useSlotRecipe({ key })` |
| `chakra()` factory for styled components | `defineRecipe()` / `defineSlotRecipe()` |
| `<ChakraProvider theme={theme}>` | `<ChakraProvider value={system}>` |
| `useColorModeValue(light, dark)` | `{ base: light, _dark: dark }` in tokens |
| `sx` prop for theme-level styling | Recipes + semantic tokens |
| `colorScheme` prop | `colorPalette` prop |
| `styleConfig` in theme | `recipes` / `slotRecipes` in system theme |
| Physical CSS props (`ml`, `mr`, `right`, `left`) | Logical CSS (`marginInlineStart`, `marginInlineEnd`, `insetInlineStart`, `insetInlineEnd`) |

Additional rules:
- Read `docs/chakra-v3-reference.md` before creating or modifying any theme recipe, token, or Chakra wrapper component
- Never add `prefers-reduced-motion` media queries — the theme handles this globally via `_motionReduce`
- Never import from `@chakra-ui/react` directly in atoms/components/forms if a primitives wrapper exists — use the wrapper instead

## TanStack React Table Conventions

This project uses TanStack React Table v8 (headless). The `DataTable` component wraps `useReactTable` and renders via Chakra's `Table.*` compound components.

| Never do | Do instead |
|----------|-----------|
| Define `columns` inside component body without `useMemo` | Define outside component or wrap in `useMemo`/`useState` |
| Inline data transforms: `data={items.filter(...)}` | `useMemo` on derived data for stable references |
| Client-side sort + server-side pagination | Use `manualSorting: true` for server data |
| Import `@tanstack/react-table` in cell components | Cells receive plain values — no TanStack coupling |
| `accessorKey: "address.city"` for nested paths | `accessorFn: (row) => row.address.city` + explicit `id` |
| `accessorFn` without providing `id` | Always add `id` when using `accessorFn` |
| Mutate data arrays in place | Produce new arrays immutably |

Additional rules:
- Read `docs/react-table-reference.md` before creating or modifying DataTable, column definitions, or cell components
- Prefer `createColumnHelper<T>()` over inline `ColumnDef` objects for full TypeScript inference
- Cell components are plain React — they receive extracted values and return JSX, with no TanStack imports
- Every cell must handle `null`/`undefined` → `emptyCellValue` (em-dash `—`)

## Component Scaffolding Checklist

### Primitive (thin Chakra wrapper)
1. Create `src/primitives/{name}.tsx` — wrap Chakra's namespaced API (e.g., `ChakraComponent.Root`, `.Content`, `.Trigger`)
2. Export a simplified props interface that surfaces the most-used Chakra props
3. Set `displayName` — e.g., `Component.displayName = "Component"`
4. Create `src/primitives/{name}.stories.tsx` — title: `"Primitives/{Name}"`
5. Add export to `src/primitives/index.ts` — both type and component
6. If a recipe is needed, create `src/theme/recipes/{name}.ts` and register in `src/theme/create-theme.ts` (which `index.ts` delegates to)

### Atom (small reusable UI unit)
1. Create directory `src/atoms/{name}/`
2. Create `src/atoms/{name}/{name}.tsx` — component with defaults, set `displayName`
3. Create `src/atoms/{name}/index.ts` — re-export component and types
4. Create `src/atoms/{name}/{name}.stories.tsx` — title: `"Atoms/{Name}"`
5. Add export to `src/atoms/index.ts`

### Component (higher-level composite)
- Simple: flat file at `src/components/{name}.tsx` + `src/components/{name}.stories.tsx`
- Complex (with hooks/subcomponents): directory at `src/components/{name}/` with `index.ts`, `{name}.tsx`, `use-{name}.tsx`, `{name}.stories.tsx`
- Add export to `src/components/index.ts`

### Sub-nav template (`<SubNavLayout>`)
1. Create `src/templates/subnav-layout.tsx`
2. Use `<NavList>` from `src/components/nav-list/` for the left column — same primitive `<Sidebar>` uses
3. Publish `NavListModeProvider` from the layout root so items collapse with the layout
4. Persist collapse via `storageKey` to `localStorage`, like `<Sidebar>` / `<ContextRail>`

### Form field (RHF wrapper)
1. Create `src/forms/{name}-field.tsx` — wrap `FormField<T>` with Controller render prop
2. Accept `FieldValues` generic, spread field props + `aria-describedby`
3. Set `displayName` via cast: `(Component as { displayName?: string }).displayName = "Name"`
4. Create `src/forms/{name}-field.stories.tsx` — include `FormProvider` decorator with `useForm`
5. Add export to `src/forms/index.ts`

### All layers
- Every exported component must have `displayName` set. For generic function components (e.g., form fields with `<T extends FieldValues>`), use the cast pattern: `(Component as { displayName?: string }).displayName = "Name"`
- Props interfaces must be exported alongside components
- Stories must include Default + at least one variant story
- Use `satisfies Meta<typeof Component>` in story meta

## Semantic Token & Recipe Quick Reference

### Available semantic tokens (use instead of hardcoded colors)

**Backgrounds:** `bg-canvas`, `bg-surface`, `bg-subtle`, `bg-muted`, `bg-accent`, `bg-accent-subtle`, `bg-accent-muted`

**Text:** `default`, `inverted`, `emphasized`, `muted`, `subtle`, `on-accent`, `on-accent-muted`, `on-accent-subtle`

**Interactive:** `accent`, `border`, `success`, `error`

**Shadows:** `xs`, `sm`, `md`, `lg`, `xl`, `2xl` (diffused hero-level), `focus-ring` (primary-tinted glow for focus states)

**Motion durations:** `fast` (150ms), `normal` (200ms), `slow` (300ms), `slower` (400ms), `entrance` (250ms), `exit` (200ms)

**Motion easings:** `ease-in`, `ease-out`, `ease-in-out`, `spring` (overshoot for micro-interactions)

**Global keyframes:** `fadeIn`, `fadeOut`, `slideUp`, `slideDown`, `scaleIn` — registered in globalCss, use in recipes as `animation: "slideUp 150ms ease-out"`

**Text style presets:** `7xl`–`xs` (size scale) + `display` (hero headings), `caption` (small muted), `overline` (uppercase labels)

**Color palette tokens** (per-palette): `{palette}.contrast`, `{palette}.fg`, `{palette}.subtle`, `{palette}.muted`, `{palette}.emphasized`, `{palette}.solid`, `{palette}.focusRing`, `{palette}.border`

### Registered recipes (single-part)
`button`, `container`, `prose`, `separator`, `formLabel`, `textarea`, `tooltip`, `tsRadioCard`, `tag`

### Registered slot recipes (multi-part)
`card`, `checkbox`, `comment`, `dialog`, `drawer`, `field` (inline in theme/index.ts), `input`, `menu`, `modal`, `persona`, `popover`, `stepper`, `table`, `tabs`, `tsProperty`, `treeItem`

## Breaking Changes

- **FactBox**: The `childs` prop on `FactBoxAction` has been renamed to `items`
- **Button**: Default `colorPalette` is now `"primary"` — `variant="solid"` buttons render blue instead of black/gray. Use `colorPalette="gray"` to restore the old appearance.
- **Button `primary` variant**: Deprecated — use `variant="solid"` instead (equivalent behavior). Will be removed in a future major release.

## Peer Dependencies

Consuming projects must install:
- react >= 18
- react-dom >= 18
- @chakra-ui/react ^3.0.0
- react-hook-form ^7.0.0
- @hookform/resolvers ^3.0.0
- zod ^3.0.0
- react-router-dom ^6.0.0
- react-i18next >= 12
- @tanstack/react-table ^8.0.0 (required for DataTable component)
- react-grid-layout ^2.2.3 (optional — required only for the Dashboard component)
