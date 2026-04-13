# MenuCell Design Spec

**Issue:** [knkCS/anker#80](https://github.com/knkCS/anker/issues/80)
**Date:** 2026-04-13

## Summary

Add a `MenuCell` component to DataTable cells for rendering action menus (three-dot dropdown) in table rows. Standalone sibling to the existing `ActionCell` — MenuCell handles dropdown menus, ActionCell handles always-visible icon buttons.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Relationship to ActionCell | Standalone sibling (A) | Simpler, independent evolution, no coupling |
| Single-action optimization | Configurable threshold | `menuThreshold` prop (default 1) — at or below: inline buttons; above: all in dropdown |
| Generics / row context | None | Flat `React.FC` like all other cells; consumers filter actions in column definitions |
| `isHidden` callbacks | Omitted | Consumers filter the actions array before passing |
| Permission handling | Omitted | No domain coupling; consumers handle permissions externally |
| Default trigger icon | `Ellipsis` (horizontal dots) from lucide-react | Standard web convention; configurable via `menuIcon` prop |

## Types

```tsx
import type React from "react";

export interface MenuCellAction {
  /** Display label — shown as menu item text or as tooltip for inline buttons */
  label: string;
  /** Handler called when the action is triggered */
  onClick: () => void;
  /** Lucide icon component — shown in menu items and inline buttons */
  icon?: React.ElementType;
  /** Disables the action */
  disabled?: boolean;
  /** Color palette override (e.g., "red" for destructive actions) */
  colorPalette?: string;
}

export interface MenuCellProps {
  /** List of actions to render */
  actions: MenuCellAction[];
  /**
   * Max number of actions to render inline.
   * If actions.length > menuThreshold, all actions collapse into a dropdown.
   * @default 1
   */
  menuThreshold?: number;
  /** Override the default menu trigger icon (Ellipsis) */
  menuIcon?: React.ElementType;
}
```

## Rendering Behavior

### Below/at threshold (inline mode)

- Each action renders as an `IconButton` (`size="sm"`, `variant="ghost"`) wrapped in a `Tooltip` showing the label.
- If an action has no `icon`, render a `Button` (`size="sm"`, `variant="ghost"`) with the label text instead (no tooltip needed since the label is visible).
- Disabled actions render as disabled buttons.

### Above threshold (menu mode)

- A single `IconButton` trigger with `Ellipsis` icon (or custom `menuIcon`) and `aria-label="Actions"`.
- Opens a `MenuContent` (portalled) with a `MenuItem` for each action.
- Each `MenuItem` shows the icon (if provided) alongside the label text.
- Disabled actions render as disabled menu items.
- Destructive actions use `colorPalette` for visual differentiation (e.g., red text).

### Event propagation

- The outermost wrapper gets `onClick={e => e.stopPropagation()}` to prevent `onRowClick` from firing.
- Follows the same pattern used by `SwitchCell` and the DataTable checkbox.

### Accessibility

- Menu trigger: `aria-label="Actions"` (English default, "props over i18n" convention).
- Inline icon buttons: `aria-label={action.label}`.
- Menu items: inherently accessible via Chakra's Menu primitive.
- All interactive elements meet 44x44px touch targets via `IconButton` defaults.

## File Structure

```
src/components/data-table/cells/
├── menu-cell.tsx          # Component + types
├── menu-cell.stories.tsx  # Stories
└── index.ts               # Updated — add MenuCell export
```

No changes needed to `data-table/index.ts` or `components/index.ts` — they re-export via `export * from "./cells"`.

## Exports

Added to `cells/index.ts`:

```tsx
export { MenuCell, type MenuCellAction, type MenuCellProps } from "./menu-cell";
```

## Dependencies

Internal only — no new packages:

- `IconButton`, `Button` from `../../../atoms/button`
- `Tooltip` from `../../../primitives/tooltip`
- `MenuRoot`, `MenuTrigger`, `MenuContent`, `MenuItem` from `../../../primitives/menu`
- `HStack` from `../../../primitives/layout`
- `Ellipsis` from `lucide-react`

## Stories

File: `menu-cell.stories.tsx` — Title: `"Components/DataTable/Cells/MenuCell"`

| Story | Description |
|-------|-------------|
| `Default` | Single action rendered as inline button |
| `MultipleActions` | 3-4 actions in dropdown menu |
| `WithDestructiveAction` | Includes a red "Delete" action |
| `CustomThreshold` | `menuThreshold={2}` — 2 inline, 3+ as menu |
| `CustomIcon` | Custom `menuIcon` prop |
| `DisabledActions` | Mix of enabled and disabled actions |
| `InTable` | Full DataTable integration with MenuCell in a column |
