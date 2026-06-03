# SubNavLayout Self-Stretching + NavList Density

**Status:** Approved (brainstorm 2026-06-03)
**Repos:** `anker` (primary) + `layout` (consumer bump + DEFAULT_CATALOG)

## Problem

Three issues found while polishing the layout-ui catalogs sub-nav. Two are anker-wide gaps; one is layout-ui-specific:

1. **NavList items are vertically cramped.** `NavListGroup` uses `<Flex direction="column" gap="0.5">` (2px between items). Every consumer of anker NavList (odon, layout-ui, future solutions) inherits this tight default. Both expanded items and collapsed icons feel jammed.

2. **SubNavLayout requires its parent to be a flex container with available height** — undocumented. The root `<Grid flex="1" minH="0">` relies on the parent being a flex column; otherwise the rail collapses to content height. Future consumers will hit "rail doesn't fill page" without obvious cause.

3. **layout-ui catalogs tab defaults to "glue"** (`DEFAULT_CATALOG = "glue"`). The first sub-nav entry is "page-geometries" — that's what users expect when they land on the tab.

## Goals

1. NavList items have visible breathing room by default (across all anker consumers).
2. SubNavLayout self-stretches inside a parent with a definite height — no special parent wrapper required.
3. The contract that remains ("parent must give SubNavLayout a definite height") is documented in `docs/page-patterns.md`.
4. layout-ui Catalogs tab opens on Page geometries.

## Non-goals

- Density variants for NavList (`compact`/`comfortable`). Single sensible default is enough today.
- Auto-detecting parent height — too magical; consumers should be explicit.
- Refactoring odon or other consumers to use the new defaults — those will pick up the change passively when they bump their anker pin.

## Detailed design

### A. NavList `gap` bump

`anker/src/components/nav-list/nav-list.tsx:44`:

```diff
-      <Flex direction="column" gap="0.5">
+      <Flex direction="column" gap="1">
         {children}
       </Flex>
```

`gap="1"` resolves to `var(--chakra-spacing-1)` = 4px. Doubles the current spacing.

Affects both expanded and collapsed modes (gap is on the column flex, applies regardless of item visual style).

### B. SubNavLayout self-stretching wrapper

`anker/src/templates/subnav-layout.tsx` — wrap the existing `<Grid>` in a `<Box>` that takes full height of its parent and establishes a flex column:

```tsx
return (
  <NavListModeProvider value={navMode}>
    <Box h="100%" display="flex" flexDirection="column" minH="0">
      <Grid
        data-testid="subnav-layout"
        data-collapsed={collapsed ? "true" : "false"}
        gridTemplateColumns={`${collapsed ? COLLAPSED_NAV : EXPANDED_NAV} 1fr`}
        alignItems="stretch"
        minH="0"
        flex="1"
        position="relative"
        transition="grid-template-columns 250ms ease-out"
      >
        {children}
        {/* …existing IconButton… */}
      </Grid>
    </Box>
  </NavListModeProvider>
);
```

Effect: the inner Grid's `flex="1"` now resolves against anker's own flex wrapper instead of the consumer's parent. As long as the consumer's parent has a definite height (any common pattern: page templates, `h="100vh"`, flex child with `flex="1"`, etc.), the sub-nav fills it.

### C. Page-patterns doc update

`anker/docs/page-patterns.md` — add a short subsection under the templates section (or under a new "Sub-navigation" heading):

```markdown
### SubNavLayout sizing

`<SubNavLayout>` self-stretches to fill its parent's height. The only
requirement on the parent is that it have a definite height. Inside a
page template's main column this is automatic — page templates establish
the grid row that gives content its height.

Outside a page template (e.g. inside a tab body), wrap the SubNavLayout
in a container with a definite height:

```tsx
// in a tab body inside a fixed-height shell
<Box flex="1" minH="0">
  <SubNavLayout …>…</SubNavLayout>
</Box>
```

Or set `h="100%"` if the parent has explicit height. Without a definite
parent height, the rail collapses to its content height.
```

### D. CHANGELOG entries

`anker/CHANGELOG.md`:

```markdown
### Changed
- `NavList.Group`: increased default gap between items from 2px to 4px.
  Visual change for all consumers. No API change.
- `SubNavLayout`: now wraps its inner Grid in a flex column so it
  self-stretches inside any parent with a definite height. Consumers no
  longer need to wrap SubNavLayout in their own flex container.
```

### E. layout-ui consumer changes

`layout/packages/layout-ui/src/components/stylesheet-detail/catalogs-tab.tsx`:

```diff
-const DEFAULT_CATALOG: CatalogKey = "glue";
+const DEFAULT_CATALOG: CatalogKey = "page-geometries";
```

`layout/packages/layout-ui/package.json` — bump `@knkcs/anker` to the new version published in step (A+B).

The current per-pages `Box` wrapping inside catalogs-tab around SubNavLayout (if any) becomes optional after B; no removal needed unless there's clearly redundant code.

## Testing

### Anker

- `nav-list.test.tsx` — assert the rendered group's flex `gap` style equals 4px (or however the test asserts; if it doesn't currently snapshot the gap, add a small `getByTestId("nav-list-group").style` check).
- `subnav-layout.test.tsx` — render SubNavLayout inside a fixed-height parent, assert the rendered sub-nav rail has `getBoundingClientRect().height === parent height`. If jsdom doesn't compute layout, drop to: assert the wrapper `<Box>` is present with the expected styles (the structural change).

### Layout

- `catalogs-tab.test.tsx` — extend the existing default-catalog test to assert the URL/active catalog defaults to `"page-geometries"`, not `"glue"`.

### Cross-consumer smoke

After anker release, manually verify odon's existing SubNavLayout usages still render correctly (no broken layouts from the new flex wrapper).

## Migration / rollout

1. Anker PR: gap + SubNavLayout wrapper + docs + CHANGELOG + tests.
2. Anker release with a new version (likely `2.x.y` minor — visual change but no API break).
3. Layout PR: bump `@knkcs/anker` dep, change DEFAULT_CATALOG, run `make ship-layout` once anker is published.

If anker is consumed locally via path/link in dev, the layout PR can land in parallel with the anker PR; production consumers will pick up the changes when they bump their pin.

## Risks

- **NavList gap visible regression for odon**: 2px → 4px is a small visual change but might shift screenshots in any pixel-level visual regression test. Mitigated by being a non-breaking visual improvement; if odon visual tests break, update the baselines.
- **SubNavLayout flex wrapper interacting with existing parent flex chains**: if a consumer wrapped SubNavLayout in a `<Box display="flex">` of their own, the new outer wrapper sits between, but the inner Grid still gets `flex="1"` against an immediate flex parent (the new wrapper). Net behavior: same or better in all cases tested. No expected regression.
- **DEFAULT_CATALOG visible in URL** — users currently bookmarked at `/catalogs/glue` keep working (the validator accepts it); only the default landing changes.

## Out of scope

- NavList density variants
- SubNavLayout responsive density / mobile rules (already noted in page-patterns)
- Dynamic first-item default in layout-ui catalogs-tab
