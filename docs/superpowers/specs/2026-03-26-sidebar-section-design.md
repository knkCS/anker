# SidebarSection — Design Spec

## Problem

Anker has no lightweight sidebar metadata slot component. `FactBox` is a collapsible card with borders and shadows — wrong for flush sidebar layouts. Every knkcs app (mediahub, core CMS, odon) needs a simple sidebar section pattern: uppercase label, optional action button, content area with optional edit mode toggle.

## Goal

Add `SidebarSection` to the components layer — a flush sidebar slot with three interaction modes: read-only, action callback, and two-slot edit mode (with render-prop escape hatch).

## Design

### Layer

Components — higher-level composite with internal state (edit mode toggle).

### Files

| File | Action | Description |
|------|--------|-------------|
| `src/components/sidebar-section.tsx` | Create | Component |
| `src/components/sidebar-section.stories.tsx` | Create | Stories |
| `src/components/sidebar-section.mdx` | Create | MDX documentation |
| `src/components/index.ts` | Modify | Add SidebarSection exports |

### Props

```tsx
export interface SidebarSectionProps {
	/** Uppercase label for the section header. */
	label: string;
	/** Section content — ReactNode or render-prop for full control. */
	children:
		| React.ReactNode
		| ((state: { isEditing: boolean; setEditing: (v: boolean) => void }) => React.ReactNode);
	/** Icon for the action button (e.g., Settings, Pencil, Plus from lucide-react). */
	actionIcon?: React.ReactNode;
	/** If provided, action button fires this instead of toggling edit mode. */
	onAction?: () => void;
	/** Content shown in place of children when editing (two-slot mode). */
	editContent?: React.ReactNode;
	/** Muted text shown when children is empty/null. */
	emptyText?: string;
	/** Start in edit mode. @default false */
	defaultEditing?: boolean;
}
```

### Three interaction modes

**1. Read-only (no actionIcon):**
```tsx
<SidebarSection label="Type">
	<StatusBadge status="Product Image" />
</SidebarSection>
```
Just label + content. No action button.

**2. Action callback (actionIcon + onAction):**
```tsx
<SidebarSection label="Tags" actionIcon={<Plus />} onAction={openTagModal}>
	<Flex wrap="wrap" gap={1}>
		{tags.map(t => <Badge key={t.id}>{t.name}</Badge>)}
	</Flex>
</SidebarSection>
```
Action button calls `onAction`. No internal edit state.

**3. Two-slot edit mode (actionIcon + editContent, no onAction):**
```tsx
<SidebarSection
	label="Labels"
	actionIcon={<Settings />}
	editContent={<LabelCheckboxList onDone={close} />}
>
	<Flex wrap="wrap" gap={1}>
		{labels.map(l => <Badge key={l.id}>{l.name}</Badge>)}
	</Flex>
</SidebarSection>
```
Action button toggles internal `isEditing` state. Shows `children` when not editing, `editContent` when editing. Icon swaps to `X` when editing.

**Escape hatch — render-prop:**
```tsx
<SidebarSection label="Status">
	{({ isEditing, setEditing }) => (
		isEditing
			? <StatusPicker onDone={() => setEditing(false)} />
			: <StatusDisplay onClick={() => setEditing(true)} />
	)}
</SidebarSection>
```
Consumer controls everything. `editContent` is ignored in this mode.

### Action button click logic

1. If `onAction` is provided → call it (external handling, no internal toggle)
2. If `editContent` is provided but no `onAction` → toggle internal `isEditing`
3. If neither `onAction` nor `editContent` → action button not rendered (even if `actionIcon` is set)

### Component structure

```tsx
export const SidebarSection: React.FC<SidebarSectionProps> = (props) => {
	const {
		label,
		children,
		actionIcon,
		onAction,
		editContent,
		emptyText,
		defaultEditing = false,
	} = props;

	const [isEditing, setEditing] = useState(defaultEditing);

	const showActionButton = actionIcon && (onAction || editContent);

	const handleAction = () => {
		if (onAction) {
			onAction();
		} else if (editContent) {
			setEditing((prev) => !prev);
		}
	};

	// Determine content to render
	let content: React.ReactNode;
	if (typeof children === "function") {
		content = children({ isEditing, setEditing });
	} else if (isEditing && editContent) {
		content = editContent;
	} else {
		content = children;
	}

	const isEmpty = content == null || content === "" || content === false;

	return (
		<Box py={3}>
			<Flex justify="space-between" align="center">
				<Text
					fontSize="xs"
					fontWeight="semibold"
					color="fg.muted"
					textTransform="uppercase"
					letterSpacing="wide"
				>
					{label}
				</Text>
				{showActionButton && (
					<IconButton
						variant="ghost"
						size="sm"
						aria-label={isEditing ? "Close" : label}
						onClick={handleAction}
					>
						{isEditing && !onAction ? <X size={14} /> : actionIcon}
					</IconButton>
				)}
			</Flex>
			<Box py={2}>
				{isEmpty && emptyText ? (
					<Text fontSize="sm" color="fg.subtle">
						{emptyText}
					</Text>
				) : (
					content
				)}
			</Box>
		</Box>
	);
};
SidebarSection.displayName = "SidebarSection";
```

### Visual spec

```
┌─────────────────────────────────┐
│ LABEL                      [⚙] │  header: Flex, justify="space-between"
│                                 │
│ Content or edit content         │  content: py={2}
│                                 │
└─────────────────────────────────┘
```

- No card border, no background, no shadow — flush sidebar layout
- `py={3}` per section
- Sections separated by consumer-applied border or stacking

### Dependencies

- `Box`, `Flex`, `Text` from `@chakra-ui/react` (layout primitives — acceptable for internal component use)
- `IconButton` from `../../atoms/button`
- `X` from `lucide-react` (close icon when editing)
- `useState` from React

### Stories

- `ReadOnly` — simple text content
- `WithAction` — Plus icon, `onAction` callback
- `TwoSlotEdit` — Settings icon, toggleable edit content
- `RenderProp` — full control via render-prop
- `EmptyState` — with `emptyText`
- `StackedSections` — multiple sections with dividers

### Exports

Add to `src/components/index.ts`:
```ts
// SidebarSection
export type { SidebarSectionProps } from "./sidebar-section";
export { SidebarSection } from "./sidebar-section";
```

## Public API

New export from `@knkcs/anker/components`: `SidebarSection` and `SidebarSectionProps`.

## Verification

- `npm run typecheck` passes
- `npm run lint` passes
- `npm run build` passes
- `npm run test` passes
- Storybook: all 6 stories render correctly
