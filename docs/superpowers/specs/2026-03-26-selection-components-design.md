# Selection Components — Design Spec

## Problem

Anker has DataTable with row selection but no components for grid-based multi-select workflows. Every content-heavy knkcs app needs: (1) selectable cards in a grid with hover-visible checkboxes, and (2) a sticky bottom bar for bulk operations on selected items.

## Goal

Add two independent components:
1. **SelectableCard** (components) — card with hover-visible checkbox for multi-select grid views
2. **BulkActionBar** (components) — sticky bottom bar for bulk operations on selected items

---

## SelectableCard (#55)

### Layer

Components — compound component with sub-components.

### Files

| File | Action | Description |
|------|--------|-------------|
| `src/components/selectable-card/selectable-card.tsx` | Create | Compound component |
| `src/components/selectable-card/index.ts` | Create | Barrel |
| `src/components/selectable-card/selectable-card.stories.tsx` | Create | Stories |
| `src/components/selectable-card/selectable-card.mdx` | Create | MDX docs |
| `src/components/index.ts` | Modify | Add exports |

### Props

```tsx
export interface SelectableCardProps {
	/** Whether this card is selected. */
	selected?: boolean;
	/** Whether checkboxes should be visible (any item in grid selected). */
	selectionVisible?: boolean;
	/** Checkbox toggle handler. */
	onSelect?: () => void;
	/** Card body click handler (e.g., navigation). */
	onClick?: () => void;
	/** Disable all interactions. */
	disabled?: boolean;
	children: React.ReactNode;
}

export interface SelectableCardThumbnailProps {
	/** Thumbnail area height. @default "160px" */
	height?: string;
	children: React.ReactNode;
}

export interface SelectableCardBodyProps {
	children: React.ReactNode;
}

export interface SelectableCardFooterProps {
	children: React.ReactNode;
}
```

### Compound components

- **`SelectableCard`** — root card with `role="group"` for hover state propagation
- **`SelectableCard.Thumbnail`** — fixed-height area for image/icon, `overflow="hidden"`, `bg="bg.subtle"`, centered content
- **`SelectableCard.Body`** — main content area with padding
- **`SelectableCard.Footer`** — bottom metadata row with top border

### Checkbox behavior

- Positioned absolute: `top={2}`, `insetInlineStart={2}` over the thumbnail
- Default (nothing selected): `opacity={0}`
- Hover (via `_groupHover`): `opacity={1}`
- `selectionVisible={true}`: always `opacity={1}`
- Selected: always visible with checked state
- Click: calls `onSelect`, `stopPropagation` to prevent `onClick`
- Uses anker `Checkbox` primitive

### Visual states

- **Default:** `borderWidth="1px"`, `borderColor="border"`, `bg="bg.surface"`
- **Hover:** subtle shadow increase
- **Selected:** `outline="2px solid"`, `outlineColor="accent"`, `outlineOffset="-2px"`

### Component structure

```tsx
// Root — provides context for sub-components
export const SelectableCard = ({ selected, selectionVisible, onSelect, onClick, disabled, children }) => {
	const showCheckbox = selected || selectionVisible;

	return (
		<Box
			role="group"
			position="relative"
			rounded="lg"
			overflow="hidden"
			borderWidth="1px"
			borderColor="border"
			bg="bg.surface"
			cursor={onClick ? "pointer" : undefined}
			onClick={disabled ? undefined : onClick}
			outline={selected ? "2px solid" : undefined}
			outlineColor={selected ? "accent" : undefined}
			outlineOffset={selected ? "-2px" : undefined}
			transition="all 0.2s"
			opacity={disabled ? 0.5 : 1}
			_hover={{ shadow: "md" }}
		>
			{onSelect && (
				<Box
					position="absolute"
					top={2}
					insetInlineStart={2}
					zIndex={1}
					opacity={showCheckbox ? 1 : 0}
					_groupHover={{ opacity: 1 }}
					transition="opacity 0.15s"
				>
					<Checkbox
						checked={selected}
						onCheckedChange={() => onSelect()}
						onClick={(e) => e.stopPropagation()}
						size="sm"
					/>
				</Box>
			)}
			{children}
		</Box>
	);
};

// Sub-components
SelectableCard.Thumbnail = ({ height = "160px", children }) => (
	<Box h={height} overflow="hidden" bg="bg.subtle" display="flex" alignItems="center" justifyContent="center">
		{children}
	</Box>
);

SelectableCard.Body = ({ children }) => (
	<Box p={3}>{children}</Box>
);

SelectableCard.Footer = ({ children }) => (
	<Flex p={3} borderTopWidth="1px" borderColor="border" justify="space-between" align="center">
		{children}
	</Flex>
);
```

### Stories

- `Default` — with image thumbnail, body text, footer badges
- `Selected` — `selected={true}`
- `SelectionVisible` — `selectionVisible={true}` (checkbox always shown)
- `WithIconFallback` — icon instead of image in thumbnail
- `Grid` — 4 cards in a CSS grid demonstrating multi-select with shared `selectionVisible` state
- `Disabled` — `disabled={true}`

---

## BulkActionBar (#50)

### Layer

Components — compound component with sub-components.

### Files

| File | Action | Description |
|------|--------|-------------|
| `src/components/bulk-action-bar/bulk-action-bar.tsx` | Create | Compound component |
| `src/components/bulk-action-bar/index.ts` | Create | Barrel |
| `src/components/bulk-action-bar/bulk-action-bar.stories.tsx` | Create | Stories |
| `src/components/bulk-action-bar/bulk-action-bar.mdx` | Create | MDX docs |
| `src/components/index.ts` | Modify | Add exports |

### Props

```tsx
export interface BulkActionBarProps {
	/** Number of selected items. */
	selectedCount: number;
	/** Called when clear selection is clicked. */
	onClear: () => void;
	/** Whether the bar is visible. @default selectedCount > 0 */
	visible?: boolean;
	/** Position mode. @default "fixed" */
	position?: "fixed" | "sticky";
	/** Action children (BulkActionBar.Action or BulkActionBar.PopoverAction). */
	children: React.ReactNode;
	/** Custom count label. @default (count) => `${count} items selected` */
	countLabel?: (count: number) => string;
}

export interface BulkActionProps {
	label: string;
	icon?: React.ReactNode;
	onClick: () => void;
	colorPalette?: string;
	disabled?: boolean;
	loading?: boolean;
}

export interface BulkPopoverActionProps {
	label: string;
	icon?: React.ReactNode;
	children: React.ReactNode;
	disabled?: boolean;
}
```

### Compound components

- **`BulkActionBar`** — root bar with slide-in animation
- **`BulkActionBar.Action`** — simple action button
- **`BulkActionBar.PopoverAction`** — button that opens a popover

### Behavior

- Hidden when `visible` is false (defaults to `selectedCount > 0`)
- Slides in from bottom using Chakra `Collapsible` (already a primitive)
- Left side: count text + clear button (X icon)
- Right side: action children

### Visual

- `position` defaults to `"fixed"`: `bottom={0}`, `insetInline={0}`, `zIndex="sticky"`
- Background: `bg="bg.surface"`, `borderTopWidth="1px"`, `borderColor="border"`, `shadow="lg"`
- Padding: `px={4}`, `py={3}`
- Count text: `fontWeight="medium"`, `fontSize="sm"`
- Clear button: `IconButton` with `X`, variant="ghost", size="sm"

### Component structure

```tsx
export const BulkActionBar = ({ selectedCount, onClear, visible, position = "fixed", children, countLabel }) => {
	const isVisible = visible ?? selectedCount > 0;
	const label = countLabel ? countLabel(selectedCount) : `${selectedCount} items selected`;

	return (
		<Collapsible open={isVisible}>
			<Collapsible.Content>
				<Flex
					position={position}
					bottom={0}
					insetInline={0}
					zIndex="sticky"
					bg="bg.surface"
					borderTopWidth="1px"
					borderColor="border"
					shadow="lg"
					px={4}
					py={3}
					align="center"
					justify="space-between"
				>
					<HStack gap={2}>
						<Text fontWeight="medium" fontSize="sm">{label}</Text>
						<IconButton aria-label="Clear selection" size="sm" variant="ghost" onClick={onClear}>
							<X size={14} />
						</IconButton>
					</HStack>
					<HStack gap={2}>{children}</HStack>
				</Flex>
			</Collapsible.Content>
		</Collapsible>
	);
};

BulkActionBar.Action = ({ label, icon, onClick, colorPalette, disabled, loading }) => (
	<Button size="sm" onClick={onClick} colorPalette={colorPalette} disabled={disabled} loading={loading}>
		{icon}
		{label}
	</Button>
);

BulkActionBar.PopoverAction = ({ label, icon, children, disabled }) => (
	<Popover>
		<PopoverTrigger asChild>
			<Button size="sm" disabled={disabled}>
				{icon}
				{label}
			</Button>
		</PopoverTrigger>
		<PopoverContent>{children}</PopoverContent>
	</Popover>
);
```

### Dependencies

- `Collapsible` from `../../primitives/collapsible`
- `Popover`, `PopoverTrigger`, `PopoverContent` from `../../primitives/popover`
- `Button`, `IconButton` from `../../atoms/button`
- `X` from `lucide-react`

### Stories

- `Default` — 3 items selected, Delete + Tag actions
- `WithPopover` — includes a PopoverAction with placeholder content
- `Sticky` — `position="sticky"` inside a scrollable container
- `CustomLabel` — `countLabel={(n) => \`${n} assets selected\`}`
- `Loading` — one action in loading state

---

## Public API

New exports from `@knkcs/anker/components`:
- `SelectableCard`, `SelectableCardProps`, `SelectableCardThumbnailProps`, `SelectableCardBodyProps`, `SelectableCardFooterProps`
- `BulkActionBar`, `BulkActionBarProps`, `BulkActionProps`, `BulkPopoverActionProps`

## Verification

- `npm run typecheck` passes
- `npm run lint` passes
- `npm run build` passes
- `npm run test` passes
- Storybook: all stories render correctly for both components
