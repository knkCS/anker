# Context Rail position & unified collapse toggle

**Date:** 2026-05-13
**Scope:** `@knkcs/anker` only. Consumers (odon, core, future solutions) pick up the change via a version bump — no per-consumer migration required.

## Problem

The context rail currently spans the full viewport height: its top edge sits beside the sidebar, level with the very top of the page. Reference designs show a layout where the page header (breadcrumbs + title + page actions) forms a horizontal band that crosses **both** the main column and the rail column, with the rail's content beginning below that band. The rail's collapse/expand toggle is also styled and positioned inconsistently with the sidebar's toggle — the sidebar uses an elegant floating round button overflowing its trailing edge, while the rail uses a flat ghost icon button sitting inside its top-right corner.

Because anker's job is to keep the shell shape identical across every knkCMS solution, this is the only place to fix it.

## Goals

1. Move the rail's vertical start point to **below the page header band**, so the header visually spans main + rail.
2. Replace the rail's collapse toggle with the sidebar's pattern, mirrored on the leading edge — same shape, same offset, same hover treatment.
3. Update anker's design documentation so future solutions inherit the new shape without re-deriving it.

## Non-goals

- Rail width, three-variant rail content model (`Overview`, `Detail-context`, `Bulk-selection`) — unchanged.
- Sidebar behavior — unchanged. The sidebar's toggle is already the master pattern; we are not editing it.
- `usePageActions` / `usePageRail` slot APIs — unchanged.
- Rail icons (`PanelRightOpen` / `PanelRightClose`) — already semantically correct.

## Design

### 1. AppShell — header slot

Add `"header"` as a third named slot alongside `"actions"` and `"rail"`. Page templates register their `<PageHeader>` via a new hook:

```tsx
export function usePageHeader(content: ReactNode): void
```

Implementation mirrors `usePageRail` exactly — same `useRef` + dual `useEffect` pattern, same no-op-outside-AppShell behavior.

`AppShellInner` becomes a 2-row grid:

```
gridTemplateColumns: showRailColumn ? "auto 1fr auto" : "auto 1fr"
gridTemplateRows:    "auto 1fr"
```

Cell placement:

| Element  | gridColumn | gridRow | Notes |
|---|---|---|---|
| Sidebar  | `1 / 2`    | `1 / 3` | Spans both rows; sticky `top: 0`, `maxH: 100vh` — unchanged. |
| Header   | `2 / -1`   | `1 / 2` | Spans main + rail when rail is present; spans just main otherwise. |
| Children | `2 / 3`    | `2 / 3` | Body content. |
| Rail     | `3 / 4`    | `2 / 3` | Sticky `top: 0` relative to row 2 — visually below the header band. |

The header cell renders the slot value (`useSlotValue("header")`). When no descendant has registered a header, the cell collapses (no auto-row height) and the layout falls back to today's shape — important for pages without a page template.

### 2. ContextRail — unified collapse toggle

Replace the in-rail ghost `IconButton` with a sidebar-style floating button:

```tsx
<IconButton
  data-testid="context-rail-toggle"
  aria-label={collapsed ? "Expand context rail" : "Collapse context rail"}
  onClick={toggle}
  variant="outline"
  size="xs"
  position="absolute"
  top="6"
  left="-3.5"
  width="7" height="7" minW="7"
  borderRadius="full"
  bg="bg-surface"
  borderColor="border"
  boxShadow="sm"
  zIndex={1}
  _hover={{ bg: "bg-muted" }}
>
  {collapsed ? <PanelRightOpen size={14} /> : <PanelRightClose size={14} />}
</IconButton>
```

Structural changes around the toggle:

- The outer `Box` switches from `overflow="hidden"` to `overflow="visible"` so the button can overflow the leading edge.
- The inner scroll container (currently `<Box flex="1" overflowY="auto" px="4" pb="4">`) keeps its own `overflow="auto"` so content still clips inside the column.
- The collapsed-state branch no longer needs `<Flex justify="flex-end" pt="3">` — the toggle is now positioned absolutely and identical in both states. The icon swap is the only conditional.

Vertical alignment: with the new AppShell layout, the rail's coordinate origin sits below the header band, so `top="6"` on the rail toggle visually aligns with `top="6"` on the sidebar toggle — both buttons float just under the header on opposite sides of the screen.

### 3. Page templates

`IndexPageTemplate`, `DetailPageTemplate`, and (where applicable) `SettingsPageTemplate` move their `<PageHeader>` render from inline JSX into a `usePageHeader(<PageHeader …/>)` registration. Their template JSX renders only the body that follows the header — tabs, toolbar, table/body content.

Page-template props and the `usePageActions` integration inside `<PageHeader>` are unchanged.

### 4. Edge case — pages without a page template

Pages that render an `<AppShell>` directly, without using one of the page templates, will not register a header via `usePageHeader`. AppShell's header row collapses to zero height in that case, leaving today's shape (no header band, rail starts at the top). Such pages can adopt the new layout by calling `usePageHeader` themselves.

No fallback `header?: ReactNode` prop is added to AppShell — consistent with how `usePageActions` has no static-prop fallback today.

## Documentation updates

### `docs/page-patterns.md`

- §App shell composition: replace the ASCII diagram with the new shape showing the header band crossing main + rail.
- §App shell composition → slot mechanism: add a `header` entry next to `actions` and `rail`.
- §App shell composition: add a paragraph describing the rail's new vertical origin and the page-template responsibility to register headers via `usePageHeader`.
- §ContextRail patterns → "Collapsed state" and "Rail Root contract": update to describe the floating toggle that mirrors the sidebar.

### `CLAUDE-ANKER.md`

- Update the `<AppShell>` row (currently line 80) to mention `usePageHeader` alongside `usePageActions` and `usePageRail`.

### `src/templates/app-shell.tsx` header comment

- Update the ASCII diagram (lines 8–13) to match the new 2-row shape.
- Extend the "Slot mechanism" section to describe `header`.

## Testing

- Extend `app-shell.test.tsx` with a case: when a descendant registers a header via `usePageHeader`, it renders in grid row 1 spanning columns 2–3 (or 2–`-1` without a rail).
- Extend `app-shell.test.tsx` with a case: without a registered header, the header row collapses and rail/children render at the top.
- Add a story `app-shell.stories.tsx` → "Layout B with header band" showing a registered header + rail + body.
- Update `context-rail.test.tsx` to assert the new toggle position (`left=-3.5`) and outline styling.
- Update `index-page-template.test.tsx` and `detail-page-template.test.tsx` if they assert inline header rendering — they should now assert the header is registered via the slot.

## Risks

- **Visual regression for consumers that don't bump anker.** Mitigated by SemVer minor bump (additive: new hook, new grid rows, no breaking export changes). Consumers upgrade when they want the new look.
- **Pages without a page template lose the spanning header until they call `usePageHeader`.** Acceptable per the open-question resolution; one-line fix per page.
- **Sticky positioning interaction with the new 2-row grid.** Rail's `position: sticky; top: 0` resolves relative to its containing block — in a CSS grid cell that's the cell itself, so the rail still pins. To verify in the browser before release.

## Rollout

1. Implement and merge in anker; cut a minor release.
2. Bump anker in odon, verify the Users/User-detail screens match the reference designs.
3. Bump anker in core when convenient; no migration work required.
