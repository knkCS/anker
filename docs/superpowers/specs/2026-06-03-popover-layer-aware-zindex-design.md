# Popover/Menu/HoverCard Layer-Aware z-index

**Status:** Approved (brainstorm 2026-06-03)
**Repos:** `anker` (only). Layout-ui (and other consumers) pick up via dep bump.

## Problem

Anker's Popover, Menu, and HoverCard positioners hardcode `style={{ zIndex: 1500 }}` (added in commit `5fc5967` to keep popovers above sticky page chrome at `zIndex.docked = 10`). This works against docked chrome but **breaks nested-overlay stacking against modals/drawers** because it bypasses Chakra v3's `--layer-index` mechanism.

Observed in layout-ui: a ColorPickerField popover opening inside a DrawerRoot appears BELOW the drawer's Content panel. The drawer's white panel clips the popover's right edge.

### Verified root cause

Chakra v3 z-index tokens:
- `modal = 1400`
- `popover = 1500`

Chakra's Drawer recipe (`drawer.js`):
```
content: { zIndex: "calc(var(--drawer-z-index) + var(--layer-index, 0))" }
// --drawer-z-index resolves to zIndex.popover (= 1500)
```

Chakra's Popover recipe (`popover.js`):
```
positioner: { zIndex: "calc(var(--popover-z-index) + var(--layer-index, 0))" }
// --popover-z-index resolves to zIndex.popover (= 1500)
```

Both base at 1500. The `--layer-index` is set by Chakra's automatic layer manager: when a popover opens inside an already-open drawer, the popover gets a HIGHER `--layer-index`, naturally stacking above.

Anker's `style={{ zIndex: 1500 }}` overrides this calc to a constant. Popover stays at 1500+0=1500; Drawer climbs to 1500+(layer)>=1500. Result: popover ends up at or below drawer.

### Why the literal-zIndex commit was added

The previous fix (`5fc5967`) addressed "popover renders below sticky page header" where the sticky header is at `zIndex.docked = 10`. A literal 1500 fixed it, but went further than necessary — it also clobbered the layer-manager behavior. We need both: above docked chrome AND respecting layer stacking.

## Goals

1. Anker Popover, Menu, and HoverCard positioners stack ABOVE sticky page chrome (the original fix) AND ABOVE modals/drawers when opened nested.
2. No consumer changes required beyond a version bump.

## Non-goals

- Touching Drawer/Modal/Dialog — they already use the correct pattern.
- Adding a configurable z-index prop to anker primitives.
- Reproducing/regression-testing the docked-chrome scenario beyond static structural check.

## Detailed design

Replace the hardcoded inline `style={{ zIndex: 1500 }}` with a layer-aware CSS calc that mirrors Chakra's recipe pattern. Fall back through multiple var levels for robustness:

```ts
const POPOVER_Z_INDEX =
  "calc(var(--popover-z-index, var(--chakra-z-index-popover, 1500)) + var(--layer-index, 0))";
```

Apply the same pattern to:

| File | Slot var |
|---|---|
| `src/primitives/popover.tsx` | `--popover-z-index` |
| `src/primitives/menu.tsx` | `--menu-z-index` |
| `src/primitives/hover-card.tsx` | `--hover-card-z-index` |

Each falls back to `--chakra-z-index-popover` (= 1500) and then the literal 1500. Adds `--layer-index` so the layer manager can lift nested overlays.

### How this satisfies both cases

- **Sticky docked chrome (zIndex.docked = 10)**: minimum value = 1500 + 0 = 1500 ≫ 10. Popover renders above sticky header.
- **Inside a drawer/modal (zIndex.modal/popover = 1400/1500)**: popover gets `--layer-index` offset assigned by Chakra's layer manager (typically +1, +2, etc. — Chakra v3 uses unit increments per nested overlay). Effective popover z-index = 1500 + 1 = 1501; drawer at 1500 + 0 = 1500. Popover wins.

## Files

- `anker/src/primitives/popover.tsx` — replace inline style
- `anker/src/primitives/menu.tsx` — same
- `anker/src/primitives/hover-card.tsx` — same
- `anker/src/primitives/popover.tsx` — update existing tests if any
- `anker/CHANGELOG.md` — entry under new 2.9.2
- `anker/package.json` — bump to 2.9.2

## Testing

For each of the three primitives, add (or extend) a test that asserts the rendered positioner's `style` attribute (or `getAttribute('style')`) contains `var(--layer-index, 0)`. jsdom doesn't compute layout, so this is a STRUCTURAL assertion — the calc is in the style; we trust Chakra's layer manager to set `--layer-index` at runtime.

Example for popover:
```ts
it("Positioner z-index participates in Chakra's layer manager", () => {
  const { container } = renderWithChakra(/* PopoverRoot + Trigger + Content; force open */);
  const positioner = container.querySelector('[data-part="positioner"]');
  expect(positioner?.getAttribute("style") ?? "").toMatch(/--layer-index/);
});
```

## Migration / rollout

1. Anker PR + merge + tag `v2.9.2` → publish via GH Actions.
2. Layout-ui bumps `@knkcs/anker` to `^2.9.2`. No code changes — the same `<ColorPickerField>` works.
3. Other consumers (odon etc.) pick up the fix when they bump their pin. No breaking change.

## Risks

- **Layer-index unit ambiguity**: Chakra v3 documents `--layer-index` but the exact increment per nested overlay isn't load-bearing here — as long as nested overlays get `+1` or more, popovers stack above. If a future Chakra version changes this, both Popover AND Drawer/Modal participate in the same mechanism, so they continue to coordinate.
- **Tests can't verify actual stacking** in jsdom. Structural assertion (`--layer-index` present in style) is the proxy. Visual verification falls to deployed browser smoke test.

## Out of scope

- A more invasive refactor of anker overlays to drop the `<Portal>` wrapper or use a different stacking strategy.
- Removing the inline style entirely (relying on the recipe alone) — this was the state before commit `5fc5967` and known-broken vs sticky chrome.
