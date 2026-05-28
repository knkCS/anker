# Sticky Page Header — Design

**Date:** 2026-05-28
**Status:** Draft — awaiting review
**Service:** anker (`@knkcs/anker`)

## 1. Problem

`PageHeader` is the band at the top of every consumer page — breadcrumbs, title row, optional meta and tabs strip, action buttons (Save/Verwerfen, Texttyp hinzufügen, etc.). In `AppShell`'s grid the header Box sits in `gridRow="1"` with no `position: sticky`, so it scrolls out of view as the body scrolls. Users lose access to the page title, tabs, and primary actions on long pages. The sidebar is already sticky (`position: sticky; top: 0`); the header should match.

## 2. Decision

Make AppShell's header Box `position: sticky; top: 0; z-index: docked` by default. Allow each page template to opt out via `stickyHeader?: boolean` (default `true`). `PageHeader`'s existing `bg="bg-surface"` makes it opaque, so content scrolling beneath stays hidden.

The opt-out plumbs through the existing slot-store pattern in AppShell: `usePageHeader` gains a second optional argument carrying `{ sticky?: boolean }`. AppShell reads both the node and the flag from the slot and renders the wrapper Box accordingly.

## 3. Anker changes

### 3.1 `usePageHeader` slot store

Extend the header slot value from `ReactNode | null` to `{ node: ReactNode; sticky: boolean } | null`. The public hook keeps a backward-compatible signature:

```ts
// Before
usePageHeader(content: ReactNode): void

// After
usePageHeader(content: ReactNode, options?: { sticky?: boolean }): void
```

When `options` is omitted (existing call sites), the slot stores `{ node: content, sticky: true }`. The slot store internals adapt to the new shape with no public typed-API break.

### 3.2 `AppShell` render

The existing header Box (`gridColumn={…}`, `gridRow="1"`) gains conditional sticky props derived from the slot's `sticky` flag:

```tsx
{showHeaderRow ? (
  <Box
    data-testid="app-shell-header"
    data-sticky-header={headerSticky ? "true" : "false"}
    gridColumn={showRailColumn ? "2 / 4" : "2 / 3"}
    gridRow="1"
    minW="0"
    position={headerSticky ? "sticky" : undefined}
    top={headerSticky ? "0" : undefined}
    zIndex={headerSticky ? "docked" : undefined}
  >
    {headerNode}
  </Box>
) : null}
```

`docked` is Chakra's standard z-index token for sticky UI (above default content, below modal/popover/tooltip). `data-sticky-header` is added so tests and consumer CSS overrides can target it without prop drilling.

### 3.3 `PageHeader` itself

Unchanged. It already renders with `bg="bg-surface"` so it's opaque when its parent is sticky. The sticky behaviour is a parent concern, not a self-concern.

### 3.4 Page-template components

`DetailPageTemplate`, `SettingsPageTemplate`, `IndexPageTemplate` each accept a new optional prop:

```ts
stickyHeader?: boolean; // default true
```

and forward it through to the slot store call:

```tsx
usePageHeader(
  <PageHeader {...} />,
  { sticky: stickyHeader ?? true },
);
```

The default is `true` for all three. Consumers opt out with `stickyHeader={false}` on the specific page where pinning is undesirable (rare; e.g. print-style or full-bleed editor views).

## 4. Behaviour

- Sticky pins the entire header band — eyebrow / breadcrumbs / title row / meta row / **tabs strip** — as one unit. The tabs strip is rendered inside `PageHeader` already, so consumers automatically get a pinned tabs row when there are tabs.
- Scrolling happens at the document level (`AppShell` already uses `minH="100vh"` Grid). No need to introduce a separate scroll container.
- The sidebar's existing sticky position (`position: sticky; top: 0; gridRow: 1 / 3`) is unaffected.
- The rail keeps scrolling within its own row 2 column — no z-index conflict with the sticky header because the header sits in row 1.
- Inside the sticky header, Chakra's anchor-link / hover-card / popover portals open above (`z-index: popover` > `docked`), so menus and tooltips render correctly.

## 5. Out of scope

- Shrink-on-scroll / collapse-on-scroll header. Standard sticky only, no scroll-driven animation.
- Print-style hidden-header mode. (Consumers achieve this by passing `stickyHeader={false}` and adding their own `display: none` on print via media query if needed.)
- `scroll-margin-top` adjustments on anchor targets inside the body. Consumers add that to their anchor-targeted elements if they use within-page anchors.
- Sticky behaviour on the rail or any other AppShell column.
- A separate `usePageActions` sticky toggle. Actions are rendered inside `PageHeader`, so they inherit the parent's sticky behaviour.

## 6. Acceptance criteria

- [ ] `AppShell`'s header Box renders with `position: sticky; top: 0; z-index: docked` and `data-sticky-header="true"` when the header slot's `sticky` flag is `true` (default).
- [ ] When the slot's `sticky` flag is `false`, the header Box renders without sticky props and with `data-sticky-header="false"`.
- [ ] `usePageHeader(content)` (single-arg form) still compiles and stores `{ node: content, sticky: true }`.
- [ ] `usePageHeader(content, { sticky: false })` stores `{ node: content, sticky: false }`.
- [ ] `DetailPageTemplate`, `SettingsPageTemplate`, `IndexPageTemplate` each accept `stickyHeader?: boolean` (defaulting to `true`) and forward via the slot.
- [ ] Storybook gets a new story showing the sticky default (body scroll demo with header pinned) and the opt-out (header scrolls away).
- [ ] AppShell test gains a case asserting `data-sticky-header="true"` by default and `data-sticky-header="false"` when the registered slot opts out.
- [ ] Existing AppShell and page-template tests stay green.
- [ ] Anker minor version bump (additive prop + behaviour change — no breaking signature changes).

## 7. Phasing

Single PR: small surface change in one library, no consumer changes required for the default behaviour to take effect. After publishing the minor version, consumers can dep-bump at their own pace. Pages that were depending on the header scrolling away will continue to look fine because the sticky header is opaque and the body content position is unchanged — only that the header is now persistently visible.

If anything looks wrong in a consumer post-publish, that consumer can pin `stickyHeader={false}` on the offending page until the underlying issue (typically a stacking-context conflict) is fixed.
