# List Components — Design Spec

## Problem

Anker has no components for relationship assignment (assigning/removing tags, categories, roles) or togglable item lists with inline creation. These are common patterns in every knkcs app — mediahub (tags, collections), core CMS (categories, labels), odon (roles, permissions).

## Goal

Add two independent components:
1. **ChipPicker** (components) — assign/unassign items from a relationship via removable chips + popover
2. **InlineCreatableList** (components) — togglable items with inline creation

---

## ChipPicker (#51)

### Layer

Components — higher-level composite with popover.

### Files

| File | Action | Description |
|------|--------|-------------|
| `src/components/chip-picker/chip-picker.tsx` | Create | Generic component |
| `src/components/chip-picker/index.ts` | Create | Barrel |
| `src/components/chip-picker/chip-picker.stories.tsx` | Create | Stories |
| `src/components/chip-picker/chip-picker.mdx` | Create | MDX docs |
| `src/components/index.ts` | Modify | Add exports |

### Props

```tsx
export interface ChipPickerProps<T> {
	/** Currently assigned items. */
	assigned: T[];
	/** All available items (assigned + unassigned). */
	available: T[];
	/** Called when an item is added from the popover. */
	onAdd: (item: T) => void;
	/** Called when an item's chip is removed. */
	onRemove: (item: T) => void;
	/** Extract unique ID from an item. */
	getItemId: (item: T) => string;
	/** Extract display label from an item. */
	getItemLabel: (item: T) => string;
	/** Extract optional color from an item. */
	getItemColor?: (item: T) => string | undefined;
	/** Popover trigger label. @default "Add" */
	addLabel?: string;
	/** Text when nothing assigned. @default "None" */
	emptyLabel?: string;
	/** Show search input in popover. @default false */
	searchable?: boolean;
	/** Disable all interactions. */
	disabled?: boolean;
	/** Show loading state. */
	loading?: boolean;
}
```

### Behavior

**Assigned chips:**
- Flex-wrap layout with `gap={2}`
- Each chip: `borderRadius="full"`, `px={3}`, `py={1}`, `fontSize="sm"`
- If `getItemColor` returns a color: chip bg uses that color at 20% opacity, text uses full color
- Otherwise: `bg="bg.muted"`, `color="fg.default"`
- X button inside chip calls `onRemove(item)`

**Add button:**
- `IconButton` with `Plus` icon, `variant="ghost"`, `size="sm"`
- Hidden when all available items are already assigned
- Opens a popover listing unassigned items

**Popover:**
- Lists items from `available` where `getItemId(item)` is NOT in the assigned set
- Each item is a clickable row → calls `onAdd(item)`, closes popover
- If `searchable`: search input at top filters by label (case-insensitive)

**Empty state:**
- When no items assigned: show `emptyLabel` in muted text
- Add button still visible

### Component structure

```tsx
export function ChipPicker<T>(props: ChipPickerProps<T>) {
	const {
		assigned, available, onAdd, onRemove,
		getItemId, getItemLabel, getItemColor,
		addLabel = "Add", emptyLabel = "None",
		searchable = false, disabled, loading,
	} = props;

	const [search, setSearch] = useState("");
	const assignedIds = new Set(assigned.map(getItemId));
	const unassigned = available.filter(item => !assignedIds.has(getItemId(item)));
	const filtered = searchable && search
		? unassigned.filter(item => getItemLabel(item).toLowerCase().includes(search.toLowerCase()))
		: unassigned;

	return (
		<Flex wrap="wrap" gap={2} align="center">
			{assigned.length === 0 && (
				<Text fontSize="sm" color="fg.muted">{emptyLabel}</Text>
			)}
			{assigned.map(item => (
				<Chip key={getItemId(item)} item={item} ... />
			))}
			{unassigned.length > 0 && !disabled && (
				<Popover>
					<PopoverTrigger asChild>
						<IconButton aria-label={addLabel} size="sm" variant="ghost">
							<Plus size={14} />
						</IconButton>
					</PopoverTrigger>
					<PopoverContent>
						<PopoverBody>
							{searchable && <TextInput ... />}
							<Stack>
								{filtered.map(item => (
									<Box key={getItemId(item)} onClick={() => onAdd(item)} cursor="pointer" ...>
										{getItemLabel(item)}
									</Box>
								))}
							</Stack>
						</PopoverBody>
					</PopoverContent>
				</Popover>
			)}
		</Flex>
	);
}
```

### Dependencies

- `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverBody` from `../../primitives/popover`
- `IconButton` from `../../atoms/button`
- `TextInput` from `../../atoms/text-input` (for search)
- `Box`, `Flex`, `Stack`, `Text` from `@chakra-ui/react`
- `Plus`, `X` from `lucide-react`

### Generic export pattern

```tsx
export const ChipPicker = ChipPickerInner as <T>(
	props: ChipPickerProps<T>,
) => React.ReactElement;
(ChipPicker as { displayName?: string }).displayName = "ChipPicker";
```

### Stories

- `Default` — tags with colors, 2 assigned out of 5
- `Empty` — nothing assigned
- `Searchable` — `searchable={true}`, many available items
- `WithColors` — items with custom colors
- `Disabled` — `disabled={true}`
- `AllAssigned` — all items assigned, add button hidden

---

## InlineCreatableList (#54)

### Layer

Components — higher-level composite with internal create-mode state.

### Files

| File | Action | Description |
|------|--------|-------------|
| `src/components/inline-creatable-list/inline-creatable-list.tsx` | Create | Generic component |
| `src/components/inline-creatable-list/index.ts` | Create | Barrel |
| `src/components/inline-creatable-list/inline-creatable-list.stories.tsx` | Create | Stories |
| `src/components/inline-creatable-list/inline-creatable-list.mdx` | Create | MDX docs |
| `src/components/index.ts` | Modify | Add exports |

### Props

```tsx
export interface InlineCreatableListProps<T> {
	/** Items to display. */
	items: T[];
	/** Currently active/selected item IDs. */
	activeIds?: string[];
	/** Called when an item is clicked/toggled. */
	onToggle?: (id: string) => void;
	/** Called to create a new item (async). */
	onCreate?: (name: string) => Promise<void>;
	/** Extract unique ID. */
	getItemId: (item: T) => string;
	/** Extract display label. */
	getItemLabel: (item: T) => string;
	/** Extract optional per-item color. */
	getItemColor?: (item: T) => string | undefined;
	/** Layout variant. @default "wrap" */
	variant?: "wrap" | "list";
	/** Input placeholder in create mode. @default "New item..." */
	createPlaceholder?: string;
	/** Create link text. @default "New item" */
	createLabel?: string;
	/** Create link icon. @default Plus from lucide-react */
	createIcon?: React.ReactNode;
	/** Empty state text. @default "No items" */
	emptyText?: string;
	/** Disable all interactions. */
	disabled?: boolean;
}
```

### Behavior

**Item display — "wrap" variant:**
- Pill/button elements in flex-wrap layout
- Inactive: `bg="bg.muted"`, `color="fg.default"`
- Active (ID in `activeIds`): `bg="colorPalette.subtle"`, `color="colorPalette.fg"` (primary)
- If `getItemColor` returns a color: use it for the active state background
- Click toggles via `onToggle(id)`
- `rounded="md"`, `px={3}`, `py={1}`, `fontSize="sm"`, `cursor="pointer"`

**Item display — "list" variant:**
- Vertical list rows
- Inactive: transparent background
- Active: `bg="colorPalette.subtle"`, `color="colorPalette.fg"`
- `px={2}`, `py={1.5}`, `rounded="md"`, `cursor="pointer"`

**Create mode:**
- Below items: clickable link with Plus icon + `createLabel`
- Click → replaces link with `TextInput` (auto-focused)
- Enter/blur → trims value, calls `onCreate(name)` if non-empty
- Escape → exits create mode
- During async `onCreate`: input disabled to prevent double-submit
- After success: exits create mode
- Internal state: `isCreating` (boolean), `isSubmitting` (boolean)

**Empty state:**
- When `items` is empty: show `emptyText` in muted color
- Create link still visible below

### Component structure

```tsx
export function InlineCreatableList<T>(props: InlineCreatableListProps<T>) {
	const [isCreating, setCreating] = useState(false);
	const [isSubmitting, setSubmitting] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleCreate = async (value: string) => {
		const trimmed = value.trim();
		if (!trimmed || !onCreate) return;
		setSubmitting(true);
		try {
			await onCreate(trimmed);
			setCreating(false);
		} catch {
			// stay in create mode on error
		} finally {
			setSubmitting(false);
		}
	};

	// ... render items (wrap or list variant), empty state, create link/input
}
```

### Dependencies

- `TextInput` from `../../atoms/text-input`
- `Box`, `Flex`, `Stack`, `Text` from `@chakra-ui/react`
- `Plus` from `lucide-react`
- `useState`, `useRef` from React

### Generic export pattern

Same as ChipPicker — cast pattern for generic function components.

### Stories

- `WrapVariant` — tags with multi-select, some active
- `ListVariant` — collections with single-select
- `WithColors` — per-item colors
- `Empty` — no items, create link visible
- `CreateMode` — interactive demo showing create flow
- `Disabled` — `disabled={true}`

---

## Public API

New exports from `@knkcs/anker/components`:
- `ChipPicker`, `ChipPickerProps`
- `InlineCreatableList`, `InlineCreatableListProps`

## Verification

- `npm run typecheck` passes
- `npm run lint` passes
- `npm run build` passes
- `npm run test` passes
- Storybook: all stories render correctly for both components
