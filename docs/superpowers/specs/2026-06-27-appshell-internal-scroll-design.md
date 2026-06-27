# AppShell Internal-Scroll Model — Design

**Date:** 2026-06-27
**Component(s):** `AppShell` (templates), `Sidebar` (components), `ContextRail` (components)
**Type:** Bug fix (layout / scroll model)
**Status:** Approved — ready for implementation plan

## Goal

Make the sidebar's account/profile footer (and the context rail) stay pinned
to the viewport while page content scrolls. Today they scroll out of view once
the main column or the rail is taller than the viewport.

## Problem

`AppShell` arranges sidebar / main / rail in a CSS grid and relies on
**document-level scrolling**: the grid is `minH="100vh"` and the side columns
are `position: sticky; top: 0; maxH: 100vh`. A sticky element only stays pinned
*while its containing block (the grid) is on screen*. The grid's laid-out
height is driven by the main column, but the rail renders its content without
an internal scroll, so the rail overflows the grid and extends the document
beyond it. Once the user scrolls past the grid's height, the sticky sidebar —
footer and all — scrolls away.

### Evidence (live DOM, asset-detail page)

Measured on a 549px-tall viewport, scrolled to y=340:

| Quantity | Value | Meaning |
|---|---|---|
| `viewport` | 549px | window height |
| `document.scrollHeight` | 1318px | page is far taller than viewport |
| grid laid-out height | ~705px | driven by the main column |
| `app-shell-sidebar` `position` | `sticky` | sticky **is** applied |
| `app-shell-sidebar` `maxHeight` | `549px` | correctly clamped to viewport |
| sticky-killer ancestors | none | no ancestor `overflow` breaks sticky |
| `app-shell-sidebar` `rectTop` | **-184px** | scrolled 184px **above** the viewport |

The math is exact: the sidebar can only stick within its ~705px containing
block. Its sticky range ends at scroll = 705 − 549 = 156px. At scroll 340 the
box is pinned to the **bottom** of its containing block, so
`rectTop = 156 − 340 = −184`. The footer scrolls away with it.

The extra document height (1318 vs 705) comes from the **rail**: it is
`maxH: 100vh` with no internal scroll, so its tall content overflows the grid.

### Root cause (one pattern, three places)

Each component uses `min-height: 100vh` — an unbounded **floor** — where a
**bounded** height is required for internal `overflow: auto` to engage:

- `AppShell` grid: `minH="100vh"` → grows with content → document scroll.
- `Sidebar` inner flex: `minH="100vh"` → grows past the viewport; `Sidebar.Body`'s
  `overflowY:auto` never has a bounded parent, so it never scrolls; the footer
  is pushed down instead of pinned.
- `ContextRail` root: `minH="100vh"` → its inner `<Stack h="full" overflowY="auto">`
  has no bounded parent to resolve `h: full` against, so the rail never scrolls
  and overflows the grid.

The page templates (`DetailPageTemplate`, `IndexPageTemplate`,
`DashboardPageTemplate`) already push their `<PageHeader>` into AppShell's
fixed row-1 header slot and render their body as `flex:1; minH:0`. They were
**designed for an internal-scroll shell**; AppShell's grid simply never
completed it.

## Solution — internal-scroll shell

Switch `AppShell` from document scroll to internal scroll:

- The grid is exactly `100vh` and **never scrolls the document** (`overflow:hidden`).
- The **header band** (row 1) stays fixed at the top (already where
  breadcrumbs / title / tabs render via the header slot).
- The **sidebar** and **rail** fill the full viewport height; their footers
  pin; their bodies scroll internally only when too tall.
- The **main** column scrolls internally below the fixed header.

This is purely a completion of the existing design intent. No consumer code
changes.

### Change set (3 files)

#### `src/templates/app-shell.tsx`

The `<Grid data-testid="app-shell">`:
- `minH="100vh"` → `h="100vh"` and add `overflow="hidden"`.

The sidebar `<Box data-testid="app-shell-sidebar">` (gridColumn 1, gridRow 1/3):
- Remove `position="sticky"`, `top="0"`, `alignSelf="start"`, `maxH="100vh"`.
  It now stretches (grid default `align-self: stretch`) to fill the 100vh grid.
- Keep `gridColumn`, `gridRow`, `minW="0"`, `zIndex={11}`.

The main `<Flex data-testid="app-shell-main">` (gridColumn 2, gridRow 2):
- Add `minH="0"` and `overflowY="auto"`.
- Keep `direction="column"`, `minW="0"`, bg, border.
- If a spurious horizontal scrollbar appears (because `overflow-y:auto` forces
  `overflow-x` to compute to `auto`), add `overflowX="hidden"`. Verify in browser.

The rail `<Box data-testid="app-shell-rail">` (gridColumn 3, gridRow 2):
- Remove `position="sticky"`, `top="0"`, `alignSelf="start"`, `maxH="100vh"`.
- Add `minH="0"` and `overflowY="auto"`.
- Keep `gridColumn`, `minW="0"`, bg, border.

The header `<Box data-testid="app-shell-header">` (row 1): **unchanged.** Its
`position: sticky` is now a harmless no-op in a non-scrolling grid; leaving it
preserves the `usePageHeader({ sticky })` opt-out API surface and minimizes the
diff.

#### `src/components/sidebar/sidebar.tsx`

`SidebarRoot` outer `<Box>` (position relative, width):
- Add `h="full"` (fills the 100vh sidebar grid cell).

`SidebarRoot` inner `<Flex data-testid="sidebar">`:
- `minH="100vh"` → `h="full"`.
- Keep `direction="column"`, `overflow="hidden"`, bg, border.

`SidebarBody`:
- Add `minH="0"`. Keep `flex="1"`, `overflowY="auto"`, `py="3"`.

`SidebarFooter`:
- Add `flexShrink={0}`. Keep `p="3"`, border.

#### `src/components/context-rail/context-rail.tsx`

`ContextRailRoot` `<Box data-testid="context-rail">`:
- `minH="100vh"` → `h="full"` (fills the bounded rail column).
- Keep width, `position="relative"`, transition.
- The existing inner `<Stack h="full" overflowY="auto">` (expanded) and
  `<Flex h="full" overflowY="auto">` (collapsed) now have a bounded parent and
  scroll correctly. No change to those.

### What does NOT change

- **No mediahub changes** beyond a version bump of `@knkcs/anker`.
- **No page-template changes** — they already conform.
- Sidebar / rail collapse-toggle behavior, widths, header semantics, props,
  and public APIs are untouched.

## Risks & verification

Verify in a running browser during implementation:

1. **Collapse toggles.** The sidebar toggle (`right: -3.5`) and rail toggle
   (`left: -3.5`) protrude into adjacent columns. Confirm the new grid
   `overflow: hidden` does not clip them (they sit inside the grid bounds, so
   they should be fine) and that neither column's `overflowY:auto` adds an
   unexpected scrollbar around them.
2. **No spurious horizontal scrollbar** on the main column (see `overflowX`
   note above).
3. **mediahub smoke test:** asset-library (`IndexPageTemplate`, long grid) and
   asset-detail (`DetailPageTemplate`, long rail) both scroll their content
   while the sidebar footer and header stay pinned; the rail scrolls internally.
4. **Short pages** (content < viewport) still render without empty scroll gaps.

No `window.scroll*`, `scrollIntoView`, `scrollRestoration`, infinite-scroll, or
`IntersectionObserver` usage exists in anker or mediahub, so the document→internal
scroll switch has no known JS dependency to update. (Verified by grep.)

## Tests

Update assertions where they encode the old model:
- `src/templates/app-shell.test.tsx`
- `src/components/sidebar/sidebar.test.tsx`
- `src/components/context-rail/context-rail.test.tsx`

Add/adjust coverage asserting the new contract: grid is `100vh` with
`overflow:hidden`; main and rail are `overflowY:auto`; sidebar footer is
`flexShrink:0`; sidebar inner and context-rail root are height-bounded (not
`minH:100vh`). Update any Storybook stories that assumed document scroll.

## Documentation

- **`docs/page-patterns.md`** (≈ lines 96–100): rewrite the scroll-model
  paragraph. Replace the "rail's `position: sticky; top: 0` pins to the bottom
  of the header… sidebar remains sticky to the viewport top" description with
  the internal-scroll model: the shell is a fixed `100vh` grid that does not
  scroll the document; the header band is fixed in row 1; the sidebar, main,
  and rail each scroll internally; the sidebar footer and rail stay pinned.
  Scan the surrounding sections for any other "sticky to the viewport" /
  document-scroll language and align it.
- **`CHANGELOG.md`**: add a `Fixed` entry under a new version describing the
  sidebar-footer / rail pinning fix and the internal-scroll model.

## Versioning & rollout

- **Version:** patch bump `2.10.0` → `2.10.1`. No public API changes; this is a
  behavioral bug fix. (Reconsider a minor bump only if the team prefers to
  signal the scroll-model change more loudly.)
- **Rollout:** land in anker → release → bump `@knkcs/anker` in mediahub
  (`web/package.json` and `packages/mediahub-ui/package.json`) → verify in the
  running cluster. Other products are version-pinned and unaffected until they
  choose to upgrade.
