# CLAUDE.md

This file provides guidance to Claude Code when working with the @knkcs/anker UI library.

## Project Overview

Anker is the shared UI component library for the knk software group, extracted and rebuilt from the knkCMS Core monolith. It provides design tokens, primitives, atoms, form controls, and feedback components used by all knkCMS microservices (Core, Shell, Odon, Template, and future services).

## Architecture

### Package Structure

Single npm package (`@knkcs/anker`) with subpath exports organized in nine layers:

1. **`/theme`** — Chakra UI v3 design tokens, color scales, semantic tokens, shadows, typography, spacing, motion tokens, z-index scale, 30 component recipes, and a preset system (`createAnkerTheme()` + `ThemePreset`). Consumers use `<Provider>` (defaults to anker's system) or create a custom system via `createAnkerTheme(preset)`.
2. **`/primitives`** — Thin wrappers around Chakra UI components with consistent defaults (Accordion, Alert, Avatar, Breadcrumb, HoverCard, Menu, PinInput, Popover, Progress, SegmentedControl, Skeleton, Slider, Spinner, Tooltip, Switch, etc.). 23 components.
3. **`/components`** — Higher-level composites: Card, Drawer, Modal, NavList, Pagination, Stepper, Table, Timeline, TreeView, Widget, FactBox, MessageGroup/MessageBubble, VirtualizedMessageList, Composer, ConversationListItem, ReactionChips/ReactionQuickSetPopover.
4. **`/atoms`** — Small reusable UI units: Persona, StatusBadge, TypeBadge, UnreadBadge, TypingIndicator, DateTime, EmptyState, Comment, Select, Clipboard, DataList, etc.
5. **`/forms`** — Form controls built on React Hook Form + Zod: InputField, TextareaField, ArrayField, DatePickerField, CodeField, etc. Also the canonical home of SearchInput (`/atoms` re-exports it for backwards compatibility).
6. **`/feedback`** — Feedback patterns: ConfirmModal with provider + `useConfirmModal` hook, UploadToastStack.
7. **`/dashboard`** — Domain-free dashboard framework: the widget contract (`WidgetDefinition`, `WidgetInstance`), `createWidgetRegistry`, and the `<Dashboard>` grid engine (see Dashboard & Widget Framework below).
8. **`/templates`** — Page-level layouts: AppShell, SubNavLayout, and page templates (index, detail, settings, auth, dashboard, marketing, error/loading/maintenance).
9. **`/navigation`** — Unsaved-changes navigation guards: `UnsavedChangesGuard`, `useUnsavedChangesBlocker`, tab dirty context.

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
│   ├── recipes/     # Chakra component recipes (28 files)
│   ├── presets/     # Theme personality presets (ThemePreset, defaultPreset)
│   ├── create-theme.ts  # createAnkerTheme() factory
│   └── utils/       # Color manipulation helpers
├── primitives/      # Chakra wrappers (accordion, alert, avatar, breadcrumb, hover-card, menu, pin-input, popover, progress, segmented-control, skeleton, slider, spinner, tooltip, etc.)
├── components/      # Card, Drawer, Modal, Pagination, Stepper, Table, Timeline, TreeView, Widget, FactBox
├── atoms/           # Persona, StatusBadge, DateTime, Select, Clipboard, DataList, etc.
├── forms/           # React Hook Form controls (InputField, ArrayField, etc.) + SearchInput
├── feedback/        # ConfirmModal + provider, UploadToastStack
├── dashboard/       # Widget contract, registry, <Dashboard> grid engine
├── templates/       # AppShell, SubNavLayout, page templates
├── navigation/      # Unsaved-changes guards, tab dirty context
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

### Message Primitives (Chat)

`src/components/message/` provides presentation-only chat primitives:
`MessageGroup` (one consecutive same-author run — author/avatar render once,
`isSelf` right-aligns and tints child bubbles via context) and `MessageBubble`
(timestamp + edited marker, deleted tombstone, floating `actions` toolbar on
hover/`focus-within`, and an **opaque segment slot** — children render
untouched; anker never knows what segment kinds exist). Styled by the
`message` slot recipe. Self bubbles use `primary.subtle` (soft tint, default
text stays readable) — NOT `bg-accent-subtle`, which is an inverted accent
surface. Usage guide: `src/components/message/message.mdx`.

`src/components/conversation-list-item/` provides `ConversationListItem`: one
row in a conversation list — title, preview/subtitle slot, timestamp, avatar
slot, badge slot (all opaque `ReactNode`s; no data assumptions), hover +
selected states. The row is a native `<button>` (`onSelect` callback,
keyboard activation for free); `isSelected` sets `aria-current="true"` and
the soft `primary.subtle` tint (same rule as message self bubbles — never
`bg-accent-subtle`). Title/preview truncate to one line via the
`conversationListItem` slot recipe. Usage guide:
`src/components/conversation-list-item/conversation-list-item.mdx`.

`src/atoms/unread-badge/` provides `UnreadBadge` (the `badge` slot's usual
occupant): a count pill with a `max` cap (`99+`) and a `hasMention` variant.
It renders `null` when there is nothing to show, so call sites pass a count
unconditionally instead of guarding. Plain counts stay on the neutral
`gray.solid` fill — an unread count is information, not an action, so the
`primary.solid` fill is reserved for mentions, which also carry an `@` glyph
so the two states never rely on hue alone. The cap/hide decision lives in the
pure, TDD-tested `formatUnreadCount()` rather than the render path. Styled by
the single-part `unreadBadge` recipe, read by hand via `useRecipe` (the
`prose` pattern) and pinned in `create-theme.test.ts`.

`src/atoms/typing-indicator/` provides `TypingIndicator`: the "who is typing"
row — three staggered bouncing dots plus the names, truncated to
`maxNames` (default 2) with the tail folded into "and N others". The cap is
hard, so three names at `maxNames={2}` read "Alice, Bob and 1 other" rather
than growing unpredictably. Names in, presentation out: TTL/expiry stays with
the consumer, so a name shows for exactly as long as it is passed. The
sentence is composed by `formatLabel(summary)` — a callback, not a string, so
a localised label truncates identically to the English default. The pure,
TDD-tested `summarizeTypists()` does the truncation and `defaultTypingLabel()`
the English wording; both stay internal (only `TypistSummary` is public, as
`formatLabel`'s argument) — the same line unread-badge draws around
`formatUnreadCount`. Renders `null` when nobody is typing;
`reserveSpace` instead keeps the row mounted and fades it out, which holds the
message list still and leaves the `role="status"` live region in the DOM
before the first name arrives. Styled by the `typingIndicator` slot recipe
(open/closed via `data-state`, dots bouncing off the new global
`typingBounce` keyframe), pinned in `create-theme.test.ts`.

`src/components/composer/` provides `Composer`: the chat message input —
auto-growing textarea, send button with submit-on-enter (IME-safe,
Shift+Enter = newline, blank never submits; uncontrolled clears after
submit), `disabled` for archived conversations, an `onInputActivity`
keystroke callback (consumers throttle + wire typing signals), and an
injected mention autocomplete: `mention.getSuggestions(query)` supplies
opaque items (rendered via `renderSuggestion`/`getSuggestionKey`),
`onSelect` returns the replacement text for the `@query` token (or nothing —
insertion semantics are the consumer's). Trigger detection, insertion, and
highlight movement are pure TDD-tested functions in `mention.ts`. Styled by
the `composer` slot recipe; dropdown opens upward (composers sit at the
bottom). Usage guide: `src/components/composer/composer.mdx`.

`src/components/virtualized-message-list/` provides `VirtualizedMessageList`:
virtualized history on `@tanstack/react-virtual` (regular dependency, API
never exposed) — newest at the bottom via the virtualizer's `anchorTo: "end"`
plus component-owned follow-on-append driven by DOM-based pinned state (NOT
the virtualizer's `followOnAppend`/`scrollEndThreshold` — widening that
threshold makes measurement deltas re-anchor to the end and fight upward
scrolls), day dividers from a `getItemDate` accessor, a jump-to-
latest pill, and an edge-triggered `onLoadOlder` callback (fires once per
approach to the top; consumer prepends, position is preserved). Items are
opaque: `getItemKey` + `renderItem` render prop. Pure logic (row building,
day labels, load-older gate) lives in separate TDD-tested modules. Styled by
the `messageList` slot recipe. Usage guide:
`src/components/virtualized-message-list/virtualized-message-list.mdx`.

`src/components/reactions/` provides the reaction pair: `ReactionChips` (a
message's aggregated reactions — emoji, count, and whether the viewer is one of
them) and `ReactionQuickSetPopover` (a curated grid of emoji to add one from).
They are joined by a slot, not welded: the popover normally fills the chips'
`addAction` slot, and either works alone. Each chip is a **toggle button** —
`aria-pressed` carries reacted-by-me to assistive tech, while the
`primary.subtle` tint (never `bg-accent-subtle`) and a bolder count carry it
visually, so the state never rests on hue alone. `onToggle` reports the emoji
only: add-or-remove is the consumer's decision, and an already-reacted chip
reports exactly like a fresh one. `maxVisible` (default 8) is a hard cap and the
tail folds into one `+N` chip, which is a real button only when `onShowAll` is
supplied and an inert `role="img"` readout otherwise — the readout takes the
recipe's `inert` variant, which hands back the pointer cursor, the hover tint,
the focus ring and the 44px hit pseudo rather than patching them off inline. The pure, TDD-tested
`partitionReactions()` does the dropping (counts below 1, fractional,
non-finite), the merging of a repeated emoji, and the cap; it stays internal,
the same line unread-badge draws around `formatUnreadCount`. Renders `null` when
there is nothing to show *and* no `addAction` — the slot is how a message's
first reaction gets added. The quick set is **sixteen hand-written glyphs**
(`DEFAULT_REACTION_QUICK_SET`) with English accessible names, in two rows of
eight; the searchable picker that would need an emoji catalogue is v2 behind an
optional subpath (messengerhub ADR-0009), and
`src/components/reactions/no-emoji-dependency.test.ts` pins that no emoji-data
package and no foreign import reaches this directory. The popover is
`lazyMount unmountOnExit`: one hangs off every message, so eager mounting would
put sixteen hidden buttons in the DOM per message. Styled by the
`reactionChips` and `reactionQuickSet` slot recipes, pinned in
`create-theme.test.ts`. Usage guide: `src/components/reactions/reactions.mdx`.

`src/primitives/avatar.tsx` grows the chat set's one primitive-layer piece:
an optional `presence` prop on `Avatar` — a binary online/offline dot anchored
to the bottom-inline-end corner. The prop is `"online" | "offline"` and
omittable rather than a boolean, because **absent is not offline**: an avatar
with no presence to report renders exactly today's markup (a test strips the
dot and compares the two renders byte-for-byte, so the variant stays additive
for every existing consumer). Online is a filled `success` dot and offline a
hollow ring drawn with an inset shadow, so the states never rely on hue alone —
the same WCAG 1.4.1 line unread-badge draws around its `@` glyph. The dot sizes
itself from Chakra's `--avatar-size` custom property, so one ratio covers `2xs`
through `2xl` and `size="full"` without per-size overrides; it carries that size
on its own `font-size` (it holds no text) so both rings can be `em` and scale
with it — flat 2px rings fill the 7.2px `2xs` dot completely and collapse the
hollow variant into a solid disc. It carries `zIndex: 1` because `AvatarGroup`
overlaps each avatar with the next (`spaceX: -3`, no stacking order) and would
otherwise bury the corner the dot sits in; that lift does **not** survive
`<AvatarGroup stacking="…">`, which z-indexes every avatar root into its own
stacking context. Styled by the new single-part `avatarPresence` recipe, read by hand via
`useRecipe` and pinned in `create-theme.test.ts`. It is a separate recipe rather
than a slot on Chakra's `avatar` recipe: those slots come from `avatarAnatomy`,
so an anker-only slot would have no Chakra component to render it.

### Dashboard & Widget Framework

`src/dashboard/` provides a domain-free dashboard framework (exported
from `@knkcs/anker/dashboard`): the widget contract (`WidgetDefinition`,
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
  (`src/dashboard/dashboard.mdx`).

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

**Global keyframes:** `fadeIn`, `fadeOut`, `slideUp`, `slideDown`, `scaleIn`, `typingBounce` (looping dot bounce) — registered in globalCss, use in recipes as `animation: "slideUp 150ms ease-out"`

**Text style presets:** `7xl`–`xs` (size scale) + `display` (hero headings), `caption` (small muted), `overline` (uppercase labels)

**Color palette tokens** (per-palette): `{palette}.contrast`, `{palette}.fg`, `{palette}.subtle`, `{palette}.muted`, `{palette}.emphasized`, `{palette}.solid`, `{palette}.focusRing`, `{palette}.border`

### Registered recipes (single-part)
`avatarPresence`, `button`, `container`, `prose`, `separator`, `formLabel`, `input`, `inputAddon`, `textarea`, `tooltip`, `tsRadioCard`, `tag`, `unreadBadge`

### Registered slot recipes (multi-part)
`card`, `checkbox`, `composer`, `conversationListItem`, `dialog`, `drawer`, `field` (inline in create-theme.ts), `menu`, `message`, `messageList`, `popover`, `reactionChips`, `reactionQuickSet`, `stepper`, `table`, `tabs`, `typingIndicator`

## Breaking Changes

- **FactBox**: The `childs` prop on `FactBoxAction` has been renamed to `items`
- **Button**: Default `colorPalette` is now `"primary"` — `variant="solid"` buttons render blue instead of black/gray. Use `colorPalette="gray"` to restore the old appearance.
- **Button `primary` variant**: Deprecated — use `variant="solid"` instead (equivalent behavior). Will be removed in a future major release.

## Peer Dependencies

Consuming projects must install:
- react >= 19
- react-dom >= 19
- @chakra-ui/react ^3.0.0
- react-hook-form ^7.0.0
- @hookform/resolvers ^3.0.0
- zod ^3.0.0
- react-router-dom >= 6
- react-i18next >= 12
- @tanstack/react-table ^8.0.0 (required for DataTable component)
- react-grid-layout ^2.2.3 (optional — required only for the Dashboard component)

Note: React 18 is **not** a supported target. 4.0.0 raised the floor to `>= 19` as a breaking change because the ref-as-prop convention used across atoms and form wrappers relies on React 19's ref-as-prop semantics — on React 18 those refs are silently stripped, so every ref-based API in the library is dead without an error. See the **Breaking** entry under 4.0.0 in `CHANGELOG.md` (#150).

This list is pinned to `package.json`'s `peerDependencies` by `src/test/peer-deps-docs.test.ts` — change both together.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues (knkCS/anker), managed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
