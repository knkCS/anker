# Touch Target Enforcement — Design Spec

## Problem

Multiple buttons across the library use `size="xs"` (24px) or `size="sm"` (28px), falling below the WCAG 2.5.8 minimum 44×44px touch target. This affects all `xs`/`sm` Button and IconButton instances, including but not limited to: ClipboardLink, ClipboardButton, ClipboardInput, CommentAction, CommentReplyBox buttons, FactBox collapse, Pagination buttons, Modal close, Drawer close, ColorModeButton, ArrayField remove, and ConfirmModal buttons. The visual sizes are intentionally compact for a desktop CMS admin UI — growing them to 44px visually would break layouts.

## Goal

Enforce 44×44px minimum touch targets on all buttons without changing their visual size, by expanding the invisible hit area using a `::after` pseudo-element in the button recipe.

## Design

### Approach

Add a `::after` pseudo-element to the `base` of the button recipe (`src/theme/recipes/button.ts`). The pseudo is absolutely positioned, centered on the button, with `minWidth: 44px` and `minHeight: 44px`. It's transparent and captures pointer events, expanding the clickable area without affecting the visual layout.

Applied to `base` rather than per-size because:
- Covers all sizes (`xs` through `xl` are all below 44px)
- For buttons already >= 44px (custom sizes), the pseudo is smaller than the button and has no effect
- Single rule, zero maintenance

### File

| File | Action | Description |
|------|--------|-------------|
| `src/theme/recipes/button.ts` | Modify | Add `_after` pseudo to `base` |

### Change

Add to the existing `base` block in `src/theme/recipes/button.ts`:

```ts
base: {
    // ... existing styles ...
    _after: {
        content: '""',
        position: "absolute",
        top: "50%",
        insetInlineStart: "50%",
        minWidth: "44px",
        minHeight: "44px",
        transform: "translate(-50%, -50%)",
    },
},
```

**Note on `position: "relative"`:** The Chakra v3 upstream button recipe already sets `position: "relative"` in its base. We do not need to add it — the `_after` pseudo will position correctly against the existing relative positioning.

**Note on `insetInlineStart`:** Uses `insetInlineStart: "50%"` instead of `left: "50%"` per the project's RTL-ready convention. The `transform: translate(-50%, -50%)` centering works correctly with logical properties because the translate percentages are relative to the element's own dimensions, independent of writing direction.

### Scope of impact

No component files change. All `xs` and `sm` Button/IconButton instances across the library inherit the fix through the recipe. This includes:

**Originally flagged (from repo review):**
- `ClipboardLink` — `IconButton size="xs"`
- `CommentAction` — `Button size="xs"`
- `FactBox` collapse — `IconButton size="sm"`
- `Pagination` prev/next — `IconButton size="sm"`
- `Pagination` page buttons — `Button size="sm" minW="36px"`

**Also covered (full scope):**
- `ClipboardButton` — `IconButton size="sm"`
- `ClipboardInput` — `IconButton size="sm"`
- `Modal` close — `IconButton size="sm"`
- `Drawer` close — `IconButton size="sm" position="absolute"`
- `ColorModeButton` — `IconButton size="sm"`
- `ArrayField` remove — `IconButton size="sm"`
- `CommentReplyBox` — `ButtonGroup size="sm"`
- `ConfirmModal` — buttons within the dialog
- Any future `xs`/`sm` buttons added to the library

### Drawer close button consideration

The Drawer close button has `position="absolute"` as an inline style prop, which overrides the recipe's `position: "relative"`. However, the `::after` pseudo-element is still a child of the button in the DOM — it positions itself relative to the button's own box regardless of how the button is positioned in its parent. The centering (`top: 50%; insetInlineStart: 50%; transform: translate(-50%, -50%)`) works correctly because it references the button's own dimensions. The expanded touch area may extend beyond the button's visual bounds into surrounding drawer content, but this is the intended behavior (larger touch target) and matches the same pattern used for all other small buttons.

### Overflow clipping caveat

The `::after` pseudo extends up to ~10px beyond the button's visual edge (for `xs` at 24px: `(44-24)/2 = 10px` per side). If a parent container has `overflow: hidden` or `overflow: clip`, the expanded area will be clipped and the touch target may not reach the full 44px. In practice, the affected buttons in this codebase are not inside overflow-clipping containers — `ButtonGroup`, `HStack`, `Flex`, and dialog footers all use visible overflow. This should be verified visually in Storybook.

### How it works

The `::after` pseudo-element:
1. Is positioned absolutely within the button (which already has `position: relative` from Chakra's upstream base)
2. Is centered on the button via `top: 50%; insetInlineStart: 50%; transform: translate(-50%, -50%)`
3. Has `minWidth: 44px; minHeight: 44px` — expands beyond the button's visual bounds when the button is smaller than 44px
4. Is transparent (no `background`) — invisible to the user
5. Captures pointer events — click/tap anywhere within the 44px area triggers the button
6. For buttons >= 44px, the pseudo is fully contained within the button and has no effect

### Public API

No changes. No new props, no changed behavior, no visual changes.

## Verification

- `npm run typecheck` passes
- `npm run lint` passes
- `npm run build` passes
- `npm run test` passes
- Storybook visual check: buttons render identically at all sizes
- DevTools check: inspect a `size="xs"` button's `::after` — should show a 44×44px area centered on the button
- Verify no overflow clipping in Drawer close, Modal close, and ButtonGroup contexts
