# Selection Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement SelectableCard (grid card with hover-visible checkbox) and BulkActionBar (sticky bottom bar for bulk operations).

**Architecture:** Both are compound components in the components layer. SelectableCard uses `role="group"` + `_groupHover` for checkbox visibility. BulkActionBar uses Chakra's Collapsible for slide-in animation. Both use directory-based structure with barrel exports.

**Tech Stack:** Chakra UI v3 (Collapsible, Popover), anker primitives (Checkbox, Button, IconButton), lucide-react icons

**Spec:** `docs/superpowers/specs/2026-03-26-selection-components-design.md`

---

## File Map

| File | Action | Component |
|------|--------|-----------|
| `src/components/selectable-card/selectable-card.tsx` | Create | SelectableCard |
| `src/components/selectable-card/index.ts` | Create | SelectableCard |
| `src/components/selectable-card/selectable-card.stories.tsx` | Create | SelectableCard |
| `src/components/selectable-card/selectable-card.mdx` | Create | SelectableCard |
| `src/components/bulk-action-bar/bulk-action-bar.tsx` | Create | BulkActionBar |
| `src/components/bulk-action-bar/index.ts` | Create | BulkActionBar |
| `src/components/bulk-action-bar/bulk-action-bar.stories.tsx` | Create | BulkActionBar |
| `src/components/bulk-action-bar/bulk-action-bar.mdx` | Create | BulkActionBar |
| `src/components/index.ts` | Modify | Add exports for both |

---

### Task 1: SelectableCard (#55)

**Files:**
- Create: `src/components/selectable-card/selectable-card.tsx`
- Create: `src/components/selectable-card/index.ts`
- Create: `src/components/selectable-card/selectable-card.stories.tsx`
- Create: `src/components/selectable-card/selectable-card.mdx`
- Modify: `src/components/index.ts`

- [ ] **Step 1: Create selectable-card.tsx**

Compound component with root + 3 sub-components attached as properties.

Root component (`SelectableCard`):
- Props: `selected`, `selectionVisible`, `onSelect`, `onClick`, `disabled`, `children`
- `role="group"` on outer Box for `_groupHover` propagation
- `rounded="lg"`, `overflow="hidden"`, `borderWidth="1px"`, `borderColor="border"`, `bg="bg.surface"`
- Selected state: `outline="2px solid"`, `outlineColor="accent"`, `outlineOffset="-2px"`
- Hover: `_hover={{ shadow: "md" }}`
- Disabled: `opacity={0.5}`, ignore clicks
- Checkbox (when `onSelect` provided): absolute positioned `top={2}`, `insetInlineStart={2}`, `zIndex={1}`
  - Opacity: `0` by default, `1` on `_groupHover`, always `1` when `selected` or `selectionVisible`
  - Import `Checkbox` from `../../primitives/checkbox`
  - `onClick={(e) => e.stopPropagation()}` to prevent triggering card `onClick`
  - `onCheckedChange={() => onSelect()}`

Sub-components (attached to SelectableCard as static properties):
- `SelectableCard.Thumbnail`: `Box` with `h={height ?? "160px"}`, `overflow="hidden"`, `bg="bg.subtle"`, centered flex content, `objectFit="cover"` on images
- `SelectableCard.Body`: `Box` with `p={3}`
- `SelectableCard.Footer`: `Flex` with `p={3}`, `borderTopWidth="1px"`, `borderColor="border"`, `justify="space-between"`, `align="center"`

Set `displayName` on all 4: `"SelectableCard"`, `"SelectableCard.Thumbnail"`, `"SelectableCard.Body"`, `"SelectableCard.Footer"`.

Export all props interfaces.

- [ ] **Step 2: Create index.ts barrel**

```ts
export {
	SelectableCard,
	type SelectableCardProps,
	type SelectableCardThumbnailProps,
	type SelectableCardBodyProps,
	type SelectableCardFooterProps,
} from "./selectable-card";
```

- [ ] **Step 3: Create selectable-card.stories.tsx**

Title: `"Components/SelectableCard"`, `satisfies Meta<typeof SelectableCard>`.

Stories:
- `Default` — single card with image thumbnail (use a placeholder colored Box as image), body with title text, footer with badge
- `Selected` — `selected={true}`
- `SelectionVisible` — `selectionVisible={true}` (checkbox always visible)
- `WithIconFallback` — no image, just a lucide-react icon in thumbnail (e.g., `FileText`)
- `Grid` — interactive demo with `useState` managing `Set<string>` of selected IDs, 4 cards in `Grid templateColumns="repeat(2, 1fr)"`, shared `selectionVisible={selectedIds.size > 0}`
- `Disabled` — `disabled={true}`

The `Grid` story must use a named component (not inline function) to satisfy Biome's hook rules.

- [ ] **Step 4: Create selectable-card.mdx**

```mdx
import { Canvas, Meta, ArgTypes } from "@storybook/blocks";
import * as Stories from "./selectable-card.stories";

<Meta of={Stories} />

# SelectableCard

Card with hover-visible checkbox for multi-select grid views. Click the card body to navigate, click the checkbox to toggle selection.

## Usage

<Canvas of={Stories.Default} />

## Selected

<Canvas of={Stories.Selected} />

## Grid Multi-Select

<Canvas of={Stories.Grid} />

## Props

<ArgTypes of={Stories} />
```

- [ ] **Step 5: Add to components/index.ts**

Read the file. Add before the `// SidebarSection` section:

```ts
// SelectableCard
export type {
	SelectableCardBodyProps,
	SelectableCardFooterProps,
	SelectableCardProps,
	SelectableCardThumbnailProps,
} from "./selectable-card";
export { SelectableCard } from "./selectable-card";
```

- [ ] **Step 6: Verify and commit**

Run: `npm run typecheck && npm run lint && npm run build && npm run test`
All must pass.

```bash
git add src/components/selectable-card/ src/components/index.ts
git commit -m "feat(components): add SelectableCard for multi-select grid views

Compound card component with hover-visible checkbox, thumbnail/body/footer
slots, selected state styling, and click separation (card vs checkbox).

Closes #55"
```

---

### Task 2: BulkActionBar (#50)

**Files:**
- Create: `src/components/bulk-action-bar/bulk-action-bar.tsx`
- Create: `src/components/bulk-action-bar/index.ts`
- Create: `src/components/bulk-action-bar/bulk-action-bar.stories.tsx`
- Create: `src/components/bulk-action-bar/bulk-action-bar.mdx`
- Modify: `src/components/index.ts`

- [ ] **Step 1: Create bulk-action-bar.tsx**

Compound component with root + 2 sub-components.

Root (`BulkActionBar`):
- Props: `selectedCount`, `onClear`, `visible`, `position`, `children`, `countLabel`
- `isVisible = visible ?? selectedCount > 0`
- `label = countLabel ? countLabel(selectedCount) : \`${selectedCount} items selected\``
- Wraps content in `Collapsible` from `../../primitives/collapsible` for slide animation:
  ```tsx
  <Collapsible open={isVisible}>
    <Collapsible.Content>
      <Flex position={position ?? "fixed"} bottom={0} insetInline={0} zIndex="sticky" ...>
        ...
      </Flex>
    </Collapsible.Content>
  </Collapsible>
  ```
- Left side: `HStack` with count `Text` + clear `IconButton` (X icon, size="sm", variant="ghost")
- Right side: `HStack` with `{children}` (actions)
- Styling: `bg="bg.surface"`, `borderTopWidth="1px"`, `borderColor="border"`, `shadow="lg"`, `px={4}`, `py={3}`

Sub-components:
- `BulkActionBar.Action`: renders a `Button` from `../../atoms/button` with `size="sm"`, forwarding `label`, `icon`, `onClick`, `colorPalette`, `disabled`, `loading`
- `BulkActionBar.PopoverAction`: renders a `Button` inside `Popover`/`PopoverTrigger` from `../../primitives/popover`, `PopoverContent` wraps `children`

Set `displayName` on all 3: `"BulkActionBar"`, `"BulkActionBar.Action"`, `"BulkActionBar.PopoverAction"`.

Export all props interfaces.

- [ ] **Step 2: Create index.ts barrel**

```ts
export {
	BulkActionBar,
	type BulkActionBarProps,
	type BulkActionProps,
	type BulkPopoverActionProps,
} from "./bulk-action-bar";
```

- [ ] **Step 3: Create bulk-action-bar.stories.tsx**

Title: `"Components/BulkActionBar"`, `satisfies Meta<typeof BulkActionBar>`.

All stories use `autoDismissMs` is N/A. Use `position="relative"` in stories so the bar renders inline (not fixed to viewport, which is hard to see in Storybook).

Stories:
- `Default` — `selectedCount={3}`, Delete (red) + Tag actions, `position="relative"`
- `WithPopover` — includes a PopoverAction with placeholder "Folder picker" content
- `CustomLabel` — `countLabel={(n) => \`${n} assets selected\`}`
- `Loading` — one action with `loading={true}`
- `Hidden` — `selectedCount={0}` (bar should not be visible)

- [ ] **Step 4: Create bulk-action-bar.mdx**

```mdx
import { Canvas, Meta, ArgTypes } from "@storybook/blocks";
import * as Stories from "./bulk-action-bar.stories";

<Meta of={Stories} />

# BulkActionBar

Sticky bottom bar for bulk operations on selected items. Slides in when items are selected.

## Usage

<Canvas of={Stories.Default} />

## With Popover Action

<Canvas of={Stories.WithPopover} />

## Props

<ArgTypes of={Stories} />
```

- [ ] **Step 5: Add to components/index.ts**

Read the file. Add before the `// Card` section (alphabetically):

```ts
// BulkActionBar
export type {
	BulkActionBarProps,
	BulkActionProps,
	BulkPopoverActionProps,
} from "./bulk-action-bar";
export { BulkActionBar } from "./bulk-action-bar";
```

- [ ] **Step 6: Verify and commit**

Run: `npm run typecheck && npm run lint && npm run build && npm run test`
All must pass.

```bash
git add src/components/bulk-action-bar/ src/components/index.ts
git commit -m "feat(components): add BulkActionBar for bulk operations on selected items

Compound component with slide-in animation, action buttons, popover
actions, and customizable count label. Uses Collapsible for animation.

Closes #50"
```

---

### Task 3: Push

- [ ] **Step 1: Push all commits**

```bash
git push origin main
```
