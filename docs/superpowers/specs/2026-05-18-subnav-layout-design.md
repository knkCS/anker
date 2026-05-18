# SubNavLayout + shared NavList primitive — design

**Issue:** [#124 — Add `<SubNavLayout>` template](https://github.com/knkCS/anker/issues/124)
**Author:** Jesko Iwanovski
**Status:** Draft — pending implementation
**Date:** 2026-05-18

---

## 1. Summary

Add a reusable `<SubNavLayout>` template to `@knkcs/anker` for the **in-tab sub-nav + detail-pane** pattern (grouped vertical list on the left, detail content on the right, collapsible). Promotes a layout currently being built in the Layout service Catalogs tab into a shared primitive.

Before building it, extract the icon-row-with-active-state-and-pill pattern out of `<Sidebar>` into a shared `<NavList>` primitive, so `<Sidebar>` and `<SubNavLayout>` consume the same visual contract instead of duplicating it.

Both changes ship in a single PR.

## 2. Goals

- One reusable template for multi-resource navigation inside a `<DetailPageTemplate>` tab body.
- A single source of truth for the "group-labeled icon-list with active state" visual — used by both `<Sidebar>` and `<SubNavLayout>`.
- Visual contract preserved: existing `<Sidebar>` consumers must look pixel-identical after the refactor.

## 3. Non-goals

- No change to `<AppShell>`, `<DetailPageTemplate>`, `<PageHeader>`, `<ContextRail>`, `<DataTable>`, or `<Toolbar>`. The pattern composes alongside them.
- Not a router. `<SubNavLayout>` does not own URL state; consumers wire `<NavList.Item asChild>` to `<NavLink>` the same way `<Sidebar>` does.
- No dark-mode bespoke work — semantic tokens carry through.

## 4. Composition

Canonical use (Layout service Catalogs tab):

```
AppShell
├── Sidebar             (existing)
├── DetailPageTemplate  (existing — owns the white PageHeader band)
│   └── tab body
│       └── SubNavLayout      ← NEW
│           ├── .Nav          (NavList.Group × N)
│           └── .Detail
│               ├── .Toolbar  (full-bleed, optional)
│               └── children  (DataTable, editor, …)
└── ContextRail         (existing — optional 3rd column)
```

`<SubNavLayout>` sits flush in the main column — no wrapping card, no border, no padding. The divider between `.Nav` and `.Detail` is `border-left: 1px solid border` on `.Detail`, matching the AppShell main/rail seam (`templates/app-shell.tsx:336`).

## 5. New component — `<NavList>`

Location: `src/components/nav-list/`

### 5.1 API

```tsx
<NavList aria-label="Catalogs sub-navigation">
  <NavList.Group label="Page">
    <NavList.Item icon={<FileText size={14} />} count={1}>Page geometries</NavList.Item>
    <NavList.Item icon={<Newspaper size={14} />} count={5}>Master pages</NavList.Item>
  </NavList.Group>
  <NavList.Group label="Typography">
    <NavList.Item icon={<Type size={14} />} count={2}>Fonts</NavList.Item>
    <NavList.Item icon={<AlignVerticalJustifyCenter size={14} />} count={10} active>
      Glue patterns
    </NavList.Item>
  </NavList.Group>
</NavList>
```

### 5.2 Sub-components

| Component | Purpose |
|---|---|
| `<NavList>` | Semantic `<nav>` wrapper. Accepts `aria-label`. |
| `<NavList.Group label?>` | Labeled cluster — uppercase muted label hidden when in a collapsed parent. |
| `<NavList.Item icon? count? active? asChild? label?>` | A row: leading icon, label, trailing count, trailing 3×14 active pill. |

### 5.3 Visual contract (lifted verbatim from `sidebar.tsx:251-296`)

Row:
- `display: flex; align-items: center; gap: var(--chakra-spacing-2);`
- `padding: 7px 12px; border-radius: var(--chakra-radii-sm); font-size: sm;`
- Hover: `bg: bg-muted`

Active state:
- `background: bg-surface`
- `color: primary.700`, including the leading icon
- `font-weight: medium`
- `box-shadow: inset 0 0 0 1px border, 0 1px 2px rgba(0,0,0,0.04)` — inset shadow, **not** a border (avoids the 1px size shift)
- Trailing pill: `3px × 14px`, `bg: primary.700`, `border-radius: 999px`, **flex child** pushed by `margin-inline-start: auto` — never absolutely positioned

Count:
- `font-size: xs; color: text.subtle; font-variant-numeric: tabular-nums; flex-shrink: 0`
- Inherits `primary.700` color when the item is active
- When both `count` and the active pill are present, the count sits first and the pill follows with a small `margin-inline-start`

Group label:
- `text-transform: uppercase; letter-spacing: 0.07em; font-size: 10px (2xs); font-weight: 600`
- `color: text.subtle`
- `padding: 4px 12px 6px`
- Hidden when the parent reports `collapsed: true`

### 5.4 Collapsed mode

`<NavList>` does not own collapse state. It reads a context (`useNavListMode`) that returns `{ collapsed: boolean }`. When `collapsed` is `true`:

- `<NavList.Group label>` hides the label
- `<NavList.Item>` hides label, count, and pill; renders icon only, centered
- `<NavList.Item>` wraps itself in `<Tooltip>` with the label text (or `label` prop override) — same `Tooltip` import as Sidebar.Item

If no context provider is present, `collapsed` defaults to `false` (allowing standalone use, e.g. in MDX or a tab body without a collapse toggle).

Both `<Sidebar>` (existing) and `<SubNavLayout>` (new) provide that context.

### 5.5 `asChild` router integration

Identical to `Sidebar.Item`'s implementation (`sidebar.tsx:309-332`). When `asChild` is set, the single child element is cloned with the computed inline style, the active data attribute, and the icon / label / pill nodes injected. Used as:

```tsx
<NavList.Item icon={<…/>} asChild active={pathname === "/catalogs/glue"}>
  <NavLink to="/catalogs/glue">Glue patterns</NavLink>
</NavList.Item>
```

## 6. Sidebar refactor

`<Sidebar.Section>` and `<Sidebar.Item>` become thin wrappers that delegate to `<NavList.Group>` and `<NavList.Item>`. They preserve their existing prop surface so consumers are unaffected.

- `<Sidebar.Section label children>` → renders `<NavList.Group label>{children}</NavList.Group>`
- `<Sidebar.Item icon active asChild label children>` → renders `<NavList.Item …>{children}</NavList.Item>`
- The collapsed state read by NavList comes from `useSidebarContext()` via a small adapter that publishes `{ collapsed }` on the `NavListModeContext` provider when inside a Sidebar.

No new props, no behavior changes. The existing Sidebar tests should pass without modification.

## 7. New component — `<SubNavLayout>`

Location: `src/templates/subnav-layout.tsx` (single file; sub-parts as named exports on the root).

### 7.1 API

```tsx
<SubNavLayout
  storageKey="boorberg-catalogs-subnav"
  defaultCollapsed={false}
  toggleAriaLabel="Collapse catalogs sub-nav"
>
  <SubNavLayout.Nav aria-label="Catalogs sub-navigation">
    <NavList.Group label="Page">…</NavList.Group>
    <NavList.Group label="Typography">…</NavList.Group>
  </SubNavLayout.Nav>

  <SubNavLayout.Detail>
    <SubNavLayout.Toolbar>
      <Input placeholder="Filter patterns…" />
      <Text fontSize="xs" color="muted">10 patterns · ordered by usage</Text>
      <Button colorPalette="primary" ml="auto">+ Add pattern</Button>
    </SubNavLayout.Toolbar>
    <DataTable … />
  </SubNavLayout.Detail>
</SubNavLayout>
```

### 7.2 Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `storageKey` | `string?` | — | `localStorage` key for persisted collapse state |
| `defaultCollapsed` | `boolean?` | `false` | Initial state when no stored value |
| `toggleAriaLabel` | `string?` | `"Collapse sub-nav"` / `"Expand sub-nav"` | Override for the toggle's aria-label |
| `children` | `ReactNode` | — | Exactly one `<SubNavLayout.Nav>` and one `<SubNavLayout.Detail>` |

### 7.3 Geometry

| Element | Expanded | Collapsed |
|---|---|---|
| `<SubNavLayout.Nav>` width | `220px` | `56px` |
| `<SubNavLayout.Detail>` width | `1fr` | `1fr` |
| Grid | `align-items: stretch` so divider spans the full body height | — |
| Transition | `width 250ms ease-out` on Nav column | — |

No background on the layout itself — it inherits the surrounding column's `bg-canvas`. No border, radius, padding, or margin on the layout root.

### 7.4 Divider

`border-left: 1px solid var(--chakra-colors-border)` on `<SubNavLayout.Detail>`. Same pattern as `<AppShell>`'s main/rail seam.

### 7.5 Collapse toggle

Floats half-off the trailing edge of `<SubNavLayout.Nav>` so it sits centered on the divider:

- `position: absolute; top: 14px; right: -14px`
- `28×28; border-radius: 999px`
- `bg: bg-surface; border: 1px solid border; box-shadow: sm`
- Hover: `bg: bg-muted`
- Icons: `PanelLeftClose` (expanded) / `PanelLeftOpen` (collapsed) at `size={14}`
- `z-index: 4` (must sit above the Detail column's divider edge; ContextRail's toggle uses `z-index: 10` on its own wrapper and is unaffected)

### 7.6 Toolbar

`<SubNavLayout.Toolbar>` is a thin slot rendered as the first child of `.Detail`. Padding `14px 20px` so its inputs sit clearly inset from the divider and the rail edge. Bottom border `1px solid border-muted` separates it from the content below. Background defaults to `bg-canvas` — call out in docs that this is the standard toolbar surface, matching `<Toolbar>` conventions.

The toolbar is **not** full-bleed in the negative-margin sense; it lives inside `.Detail` and respects the divider. (This is a deliberate departure from the issue's original description — keeps the geometry simpler and matches the screenshot consumers signed off on.)

### 7.7 Collapsed-state details

In collapsed mode, the `NavListModeContext` reports `{ collapsed: true }`, which propagates to every `<NavList.Group>` and `<NavList.Item>` inside `.Nav`:

- Group labels hidden
- Item labels and counts hidden; trailing pill hidden
- Items center their icon
- Items show a `<Tooltip>` on hover with the label
- Subsequent groups are separated by a `1px` `border-muted` top border (icon-only column otherwise reads as a single undifferentiated stack)

### 7.8 Persistence

Same mechanism as `<Sidebar>` / `<ContextRail>`:

- On mount, read `localStorage[storageKey]` ("true" / "false"); fall back to `defaultCollapsed`, then `false`.
- On every change, write the new value when `storageKey` is set.
- SSR-safe: `typeof window === "undefined"` short-circuit returns `defaultCollapsed ?? false`.

## 8. File plan

### New

- `src/components/nav-list/nav-list.tsx`
- `src/components/nav-list/nav-list-context.tsx` *(NavListModeContext + provider + `useNavListMode`)*
- `src/components/nav-list/index.ts`
- `src/components/nav-list/nav-list.stories.tsx`
- `src/components/nav-list/nav-list.test.tsx`
- `src/templates/subnav-layout.tsx`
- `src/templates/subnav-layout.stories.tsx`
- `src/templates/subnav-layout.test.tsx`
- `src/templates/subnav-layout.mdx` *(optional — long-form docs page)*
- `docs/superpowers/specs/2026-05-18-subnav-layout-design.md` *(this document)*

### Modified

- `src/components/sidebar/sidebar.tsx` — `Sidebar.Section` and `Sidebar.Item` become wrappers over `NavList.Group` / `NavList.Item`; Sidebar publishes its `collapsed` state on `NavListModeContext`.
- `src/components/index.ts` — export `NavList`.
- `src/templates/index.ts` — export `SubNavLayout`.
- `docs/page-patterns.md` — add **§ 8 Sub-nav layout** after Tab patterns; brief sentence in § 3 (Sidebar IA) noting the shared primitive.
- `CLAUDE.md` (project) — update template count, list `<SubNavLayout>` and `<NavList>` in scaffolding overview.
- `CLAUDE-ANKER.md` (npm-shipped) — one-line rule under Page templates.

### Unchanged

`<AppShell>`, `<DetailPageTemplate>`, `<PageHeader>`, `<ContextRail>`, `<DataTable>`, `<Toolbar>` — composed alongside, not modified.

## 9. Testing

### `nav-list.test.tsx`

- Renders group label when expanded; hides it when context reports collapsed.
- Active item renders trailing 3×14 pill; non-active items do not.
- Active item applies the inset box-shadow border and `primary.700` color to icon + text.
- Hover applies `bg-muted`.
- `asChild` clones the child, forwards refs, and applies the inline style to the cloned element.
- Collapsed mode wraps items in `<Tooltip>` and uses `label` prop when provided.

### `subnav-layout.test.tsx`

- Renders `.Nav` and `.Detail` in a 220 / 1fr grid by default.
- Toggle button flips state on click; `storageKey` reads + writes `localStorage`.
- After collapse, grid is `56px / 1fr` and `NavListModeContext` reports `collapsed: true` (assert by rendering a probe child).
- Toggle's `aria-label` flips between Expand / Collapse and respects `toggleAriaLabel` override.
- Toolbar renders inside Detail and respects the divider (no full-bleed negative margins).

### `sidebar.test.tsx`

- All existing tests pass unchanged after the refactor.

## 10. Stories

`subnav-layout.stories.tsx` — 8 stories from the issue's acceptance criteria:

1. **Default** — expanded, three groups, one active item, mock detail content (Catalogs example).
2. **Collapsed by default** — same structure, `defaultCollapsed`.
3. **No groups** — flat list, groups optional.
4. **Without toolbar** — Detail contains raw children only.
5. **With toolbar** — uses `<SubNavLayout.Toolbar>`.
6. **Embedded in DetailPageTemplate tab** — canonical full composition (matches the v3 mockup).
7. **Long detail content** — verifies divider spans the full body height regardless of detail content length.
8. **Router integration** — `asChild` with `<NavLink>`, mirroring the `Sidebar.Item` story.

`nav-list.stories.tsx` — 4 stories:

1. **Default** — two groups, one active item.
2. **Without group labels** — flat list.
3. **Collapsed (via mock provider)** — icon-only with tooltips.
4. **`asChild` router** — NavLink composition.

## 11. Documentation updates

### `docs/page-patterns.md`

- **§ 3 Sidebar IA** — one paragraph after the existing `<Sidebar.Item>` structure subsection: *"Sidebar's section + item rendering is implemented via the shared `<NavList>` primitive. The same primitive powers `<SubNavLayout>` (see § 8). If you need the visual standalone — group label + icon row + count + active pill — import `<NavList>` directly from `@knkcs/anker/components`."*
- **§ 8 Sub-nav layout (NEW)** — when to use vs. don't, composition diagram, slot reference, geometry table, collapse behavior, three-column-with-ContextRail example. Mirrors the issue body but written as canonical pattern doc rather than a proposal.

### `CLAUDE.md` (project, repo-local)

Add to the templates count and to the Component Scaffolding Checklist:

> **SubNavLayout** — for multi-resource navigation inside a `<DetailPageTemplate>` tab. Uses `<NavList>` for the left column; composes alongside `<ContextRail>` if a third column is needed.

### `CLAUDE-ANKER.md` (npm-shipped)

Under "Page templates":

> For multi-resource navigation inside a tab body, use `<SubNavLayout>` rather than rolling your own master-detail. It owns collapse state, persistence, and the divider — wire `<NavList.Item asChild>` to `<NavLink>` for URL deep-linking.

## 12. Accessibility

- `<NavList>` renders as `<nav>` and accepts `aria-label`.
- `<NavList.Item>` renders with `aria-current="page"` when `active`.
- Toggle button has `aria-label` (configurable via `toggleAriaLabel`, with English defaults).
- Collapsed items expose their label via `<Tooltip>` (mouse) and via `aria-label` on the row (keyboard / SR).
- Touch targets: 44×44px enforced on the toggle (per anker convention `minWidth="44px"`); rows are 30–34px tall, which is acceptable for keyboard-driven nav lists per the existing Sidebar precedent.

## 13. Migration

None. `<Sidebar>` consumers are unaffected (prop surface preserved). No existing usage of "rolled-your-own master-detail inside a tab body" needs to migrate — the Layout service Catalogs tab is the first consumer.

## 14. Risks

- **Sidebar visual regression** — the refactor must produce pixel-identical output. Mitigation: snapshot test on the Sidebar story before/after; explicit test asserting the active-item shadow string.
- **Tooltip flicker in collapsed mode** — Sidebar already ships this and the pattern is stable; reusing the same Tooltip wrapping logic.
- **Storage-key collisions** — three components (`<Sidebar>`, `<ContextRail>`, `<SubNavLayout>`) all use `localStorage` for collapse state. Mitigation: document a naming convention (`<feature>-subnav` / `<feature>-rail`) in § 8 of page-patterns.

## 15. Effort estimate

~1.5 days total — the issue's estimate was correct, and the `<NavList>` extraction is essentially a code move with no new visual work.

- NavList extract + Sidebar refactor: 4h (mostly mechanical)
- SubNavLayout implementation: 4h
- Stories + tests: 3h
- Docs: 2h
