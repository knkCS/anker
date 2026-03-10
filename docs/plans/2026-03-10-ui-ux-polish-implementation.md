# UI/UX Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Elevate anker's design tokens, fix dark mode gaps, consolidate duplicate components, and apply visual polish across all layers.

**Architecture:** Token-first changes (Phase 1) propagate automatically to all components. Phase 2 consolidates duplicates and fixes API issues. Phase 3 polishes individual components. Phase 4 adds missing primitives.

**Tech Stack:** Chakra UI v3, TypeScript, Storybook

---

## Phase 1: Tokens & Dark Mode

### Task 1: Add motion/duration tokens

**Files:**
- Modify: `src/theme/tokens/semantic.ts`
- Modify: `src/theme/tokens/index.ts`

**Step 1: Add duration and easing tokens to semantic.ts**

Add after the `shadows` block in `semantic.ts`:

```typescript
	// After the closing of shadows: { ... },
};
```

Create a new file instead — cleaner separation:

**Files:**
- Create: `src/theme/tokens/animations.ts`
- Modify: `src/theme/tokens/index.ts`
- Modify: `src/theme/index.ts`

**Step 1: Create animations.ts**

Create `src/theme/tokens/animations.ts`:

```typescript
/**
 * Motion tokens for consistent animation timing across components.
 */
export const durations = {
	fast: { value: "150ms" },
	normal: { value: "200ms" },
	slow: { value: "300ms" },
};

export const easings = {
	"ease-in": { value: "cubic-bezier(0.4, 0, 1, 1)" },
	"ease-out": { value: "cubic-bezier(0, 0, 0.2, 1)" },
	"ease-in-out": { value: "cubic-bezier(0.4, 0, 0.2, 1)" },
};
```

**Step 2: Export from tokens/index.ts**

Add to `src/theme/tokens/index.ts`:

```typescript
export { durations, easings } from "./animations";
```

**Step 3: Wire into theme system**

In `src/theme/index.ts`, import `durations, easings` from `./tokens` and add under `theme.tokens`:

```typescript
tokens: {
	colors,
	fonts: { ... },
	spacing: { ... },
	radii: { ... },
	durations,
	easings,
},
```

**Step 4: Verify build**

Run: `npm run typecheck && npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add src/theme/tokens/animations.ts src/theme/tokens/index.ts src/theme/index.ts
git commit -m "feat(theme): add motion duration and easing tokens"
```

---

### Task 2: Add opacity tokens

**Files:**
- Modify: `src/theme/tokens/semantic.ts`

**Step 1: Add opacity semantic tokens**

Add a new `opacity` block in `semanticTokens` after `shadows`:

```typescript
	opacity: {
		disabled: { value: 0.4 },
		readOnly: { value: 0.8 },
	},
```

**Step 2: Verify build**

Run: `npm run typecheck && npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/theme/tokens/semantic.ts
git commit -m "feat(theme): add opacity semantic tokens for disabled and readOnly states"
```

---

### Task 3: Add z-index scale tokens

**Files:**
- Create: `src/theme/tokens/z-index.ts`
- Modify: `src/theme/tokens/index.ts`
- Modify: `src/theme/index.ts`

**Step 1: Create z-index.ts**

Create `src/theme/tokens/z-index.ts`:

```typescript
/**
 * Z-index scale for consistent stacking order.
 *
 * dropdown < sticky < overlay < modal < popover < toast
 */
const zIndex = {
	dropdown: { value: 1000 },
	sticky: { value: 1100 },
	overlay: { value: 1300 },
	modal: { value: 1400 },
	popover: { value: 1500 },
	toast: { value: 1700 },
};

export default zIndex;
```

**Step 2: Export from tokens/index.ts**

Add to `src/theme/tokens/index.ts`:

```typescript
export { default as zIndex } from "./z-index";
```

**Step 3: Wire into theme system**

In `src/theme/index.ts`, import `zIndex` from `./tokens` and add to `theme.tokens`:

```typescript
tokens: {
	colors,
	fonts: { ... },
	spacing: { ... },
	radii: { ... },
	durations,
	easings,
	zIndex,
},
```

**Step 4: Verify build**

Run: `npm run typecheck && npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add src/theme/tokens/z-index.ts src/theme/tokens/index.ts src/theme/index.ts
git commit -m "feat(theme): add z-index scale tokens"
```

---

### Task 4: Bump border-radius scale

**Files:**
- Modify: `src/theme/tokens/radii.ts`

**Step 1: Update radii values**

Replace the entire content of `src/theme/tokens/radii.ts`:

```typescript
/**
 * Border-radius tokens.
 *
 * Bumped for a more modern, rounded feel.
 * Previous: sm=0.25, md=0.375, lg=0.5, xl=0.75, 2xl=1
 */
const radii = {
	sm: "0.375rem",
	md: "0.5rem",
	lg: "0.75rem",
	xl: "1rem",
	"2xl": "1.25rem",
};

export default radii;
```

**Step 2: Verify build**

Run: `npm run typecheck && npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/theme/tokens/radii.ts
git commit -m "feat(theme): bump border-radius scale for modern feel"
```

---

### Task 5: Audit action icons — replace gray.500 with semantic token

**Files:**
- Modify: `src/atoms/actions/edit.tsx`
- Modify: `src/atoms/actions/remove.tsx`
- Modify: `src/atoms/actions/collapse.tsx`
- Modify: `src/atoms/actions/handle.tsx`

**Step 1: In each file, replace `color="gray.500"` with `color="subtle"`**

In `edit.tsx`:
```typescript
// OLD:
<Icon color="gray.500" asChild>
// NEW:
<Icon color="subtle" asChild>
```

In `remove.tsx`:
```typescript
// OLD:
<Icon color="gray.500" asChild>
// NEW:
<Icon color="subtle" asChild>
```

In `collapse.tsx`:
```typescript
// OLD:
<Icon color="gray.500">
// NEW:
<Icon color="subtle">
```

In `handle.tsx`:
```typescript
// OLD:
<Icon color="gray.500" asChild>
// NEW:
<Icon color="subtle" asChild>
```

**Step 2: Verify build**

Run: `npm run typecheck && npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/atoms/actions/edit.tsx src/atoms/actions/remove.tsx src/atoms/actions/collapse.tsx src/atoms/actions/handle.tsx
git commit -m "fix(atoms): use semantic color token for action icons (dark mode)"
```

---

### Task 6: Fix Filter badge — use semantic tokens

**Files:**
- Modify: `src/atoms/actions/filter.tsx`

**Step 1: Replace hardcoded colors**

Change:
```typescript
bg="primary.500"
color="white"
```
To:
```typescript
bg="accent"
color="on-accent"
```

**Step 2: Verify build**

Run: `npm run typecheck && npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/atoms/actions/filter.tsx
git commit -m "fix(atoms): use semantic tokens for Filter badge (dark mode)"
```

---

### Task 7: Fix Toaster — replace blue.solid with primary token

**Files:**
- Modify: `src/primitives/toaster.tsx`

**Step 1: Replace color reference**

Change:
```typescript
<Spinner size="sm" color="blue.solid" />
```
To:
```typescript
<Spinner size="sm" color="primary.solid" />
```

**Step 2: Verify build**

Run: `npm run typecheck && npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/primitives/toaster.tsx
git commit -m "fix(primitives): use primary token in Toaster spinner"
```

---

### Task 8: Fix EmptyPanel — use semantic tokens

**Files:**
- Modify: `src/atoms/empty-panel/empty-panel.tsx`

**Step 1: Replace hardcoded gray colors**

Change both `color="gray.500"` to `color="muted"`:

```typescript
<Heading fontSize="lg" color="muted" as="h3">
```
and:
```typescript
<Text color="muted" fontSize="sm">
```

**Step 2: Verify build**

Run: `npm run typecheck && npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/atoms/empty-panel/empty-panel.tsx
git commit -m "fix(atoms): use semantic color tokens in EmptyPanel (dark mode)"
```

---

### Task 9: Fix Select TableOption — use semantic tokens

**Files:**
- Modify: `src/atoms/select/table-menu-list.tsx`

**Step 1: Replace hardcoded colors in TableOption**

Change lines 154-158:
```typescript
// OLD:
_hover={{ bg: isFocused ? "gray.100" : "gray.50" }}
cursor="pointer"
_even={{
	bg: isSelected ? "blue.100" : isFocused ? "gray.100" : undefined,
}}
```
To:
```typescript
// NEW:
_hover={{ bg: isFocused ? "bg-muted" : "bg-subtle" }}
cursor="pointer"
_even={{
	bg: isSelected ? "primary.subtle" : isFocused ? "bg-muted" : undefined,
}}
```

**Step 2: Verify build**

Run: `npm run typecheck && npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/atoms/select/table-menu-list.tsx
git commit -m "fix(atoms): use semantic tokens in Select TableOption (dark mode)"
```

---

### Task 10: Fix SearchInput (atoms) — use semantic token

**Files:**
- Modify: `src/atoms/search-input/search-input.tsx`

**Step 1: Replace hardcoded bgColor**

Change:
```typescript
bgColor="gray.50"
```
To:
```typescript
bgColor="bg-subtle"
```

**Step 2: Verify build**

Run: `npm run typecheck && npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/atoms/search-input/search-input.tsx
git commit -m "fix(atoms): use semantic token for SearchInput background (dark mode)"
```

---

## Phase 2: Consolidation & Fixes

### Task 11: Fix Provider — use anker system as default

**Files:**
- Modify: `src/primitives/provider.tsx`

**Step 1: Update Provider to use anker's system**

Replace the content of `src/primitives/provider.tsx`:

```typescript
import { ChakraProvider } from "@chakra-ui/react";
import system from "../theme";
import { ColorModeProvider, type ColorModeProviderProps } from "./color-mode";

export interface ProviderProps extends ColorModeProviderProps {
	/** Override the default anker theme system. */
	system?: typeof import("../theme").default;
}

export function Provider({ system: customSystem, ...props }: ProviderProps) {
	return (
		<ChakraProvider value={customSystem ?? system}>
			<ColorModeProvider {...props} />
		</ChakraProvider>
	);
}
```

**Step 2: Verify build**

Run: `npm run typecheck && npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/primitives/provider.tsx
git commit -m "fix(primitives): Provider uses anker theme system by default"
```

---

### Task 12: Merge EmptyPanel into EmptyState

**Files:**
- Modify: `src/atoms/empty-state/empty-state.tsx`
- Modify: `src/atoms/empty-state/empty-state.stories.tsx`
- Delete: `src/atoms/empty-panel/empty-panel.tsx`
- Delete: `src/atoms/empty-panel/empty-panel.stories.tsx`
- Delete: `src/atoms/empty-panel/index.ts`
- Modify: `src/atoms/index.ts`

**Step 1: Enhance EmptyState to accept ReactNode description and optional icon**

Replace `src/atoms/empty-state/empty-state.tsx`:

```typescript
import { Heading, Stack, Text } from "@chakra-ui/react";
import type React from "react";

export interface EmptyStateProps {
	/** Main heading text. */
	header: string;
	/** Description text or rich content. */
	description?: React.ReactNode;
	/** Optional icon displayed above the heading. */
	icon?: React.ReactNode;
	/** Optional action buttons below the description. */
	actions?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = (props) => {
	const { header, description, icon, actions } = props;

	return (
		<Stack
			justifyContent="center"
			alignItems="center"
			textAlign="center"
			gap={4}
			p={16}
			borderRadius="lg"
		>
			{icon}
			<Heading size="lg">{header}</Heading>
			{description && (
				<Text color="muted" fontSize="sm">
					{description}
				</Text>
			)}
			{actions && (
				<Stack pt={4} gap={2}>
					{actions}
				</Stack>
			)}
		</Stack>
	);
};

EmptyState.displayName = "EmptyState";
```

**Step 2: Update EmptyState stories**

Replace `src/atoms/empty-state/empty-state.stories.tsx`:

```typescript
import { Button, Icon } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { InboxIcon } from "lucide-react";
import { EmptyState } from "./empty-state";

const meta = {
	title: "Atoms/EmptyState",
	component: EmptyState,
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		header: "No results found",
		description: "Try adjusting your search or filters.",
	},
};

export const WithIcon: Story = {
	args: {
		header: "No items found",
		description: "There are no items to display. Try adding some.",
		icon: <Icon asChild color="muted" boxSize={10}><InboxIcon /></Icon>,
	},
};

export const WithActions: Story = {
	args: {
		header: "No items yet",
		description: "Get started by creating your first item.",
		actions: <Button>Create item</Button>,
	},
};
```

**Step 3: Delete EmptyPanel files**

```bash
rm src/atoms/empty-panel/empty-panel.tsx
rm src/atoms/empty-panel/empty-panel.stories.tsx
rm src/atoms/empty-panel/index.ts
rmdir src/atoms/empty-panel
```

**Step 4: Remove EmptyPanel from atoms/index.ts**

Remove these lines from `src/atoms/index.ts`:
```typescript
// EmptyPanel
export { EmptyPanel, type EmptyPanelProps } from "./empty-panel";
```

**Step 5: Add deprecated re-export for backwards compatibility**

After removing the EmptyPanel export, add a temporary re-export comment noting the deprecation. Actually — per project principles, no backwards-compat hacks. Just remove it.

**Step 6: Verify build**

Run: `npm run typecheck && npm run build`
Expected: PASS

**Step 7: Commit**

```bash
git add -A src/atoms/empty-state/ src/atoms/empty-panel/ src/atoms/index.ts
git commit -m "refactor(atoms): merge EmptyPanel into EmptyState, add icon prop"
```

---

### Task 13: Consolidate SearchInput — atoms re-exports forms version

**Files:**
- Modify: `src/atoms/search-input/search-input.tsx`
- Modify: `src/atoms/search-input/index.ts` (if exists, otherwise search-input.tsx is the index)
- Modify: `src/atoms/index.ts`

**Step 1: Replace atoms SearchInput with re-export**

Replace `src/atoms/search-input/search-input.tsx` with:

```typescript
/**
 * Re-exported from forms/search-input for backwards compatibility.
 * The forms version has more configuration options (debounceMs, placeholder).
 *
 * @deprecated Import from "@knkcs/anker/forms" instead.
 */
export { SearchInput, type SearchInputProps } from "../../forms/search-input";
```

**Step 2: Verify build**

Run: `npm run typecheck && npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/atoms/search-input/search-input.tsx
git commit -m "refactor(atoms): SearchInput re-exports forms version (consolidate)"
```

---

### Task 14: Add FormField description prop

**Files:**
- Modify: `src/forms/form-field.tsx`

**Step 1: Add description prop to FormFieldProps**

Add to the interface:
```typescript
/** Persistent description that shows even when there's an error. */
description?: React.ReactNode;
```

**Step 2: Render description above helperText/errorText**

In the render, add after the children render and before the helperText section:

```typescript
{description && (
	<Text fontSize="xs" color="muted">
		{description}
	</Text>
)}
```

Import `Text` from `@chakra-ui/react` if not already imported.

The description should render *regardless* of error state, while helperText still disappears when there's an error.

**Step 3: Verify build**

Run: `npm run typecheck && npm run build`
Expected: PASS

**Step 4: Commit**

```bash
git add src/forms/form-field.tsx
git commit -m "feat(forms): add persistent description prop to FormField"
```

---

### Task 15: Fix TableItem — ring instead of outline, smaller border-radius

**Files:**
- Modify: `src/components/table-item.tsx`

**Step 1: Replace outline with ring and reduce borderRadius**

Find the outer Flex styling and change:

```typescript
// OLD:
boxShadow="base"
borderRadius="2xl"
// ...
outline="solid 3px transparent"
outlineColor={isActive ? "accent" : "transparent"}
```

To:

```typescript
// NEW:
boxShadow="sm"
borderRadius="lg"
// ...
ring={isActive ? "2px" : "0"}
ringColor="accent"
```

Note: Chakra v3 uses `ring` and `ringColor` props for box-shadow based focus/selection rings.

If `ring`/`ringColor` aren't available as Chakra v3 props, use:
```typescript
boxShadow={isActive ? "0 0 0 2px var(--chakra-colors-accent)" : "sm"}
borderRadius="lg"
```

Remove the `outline` and `outlineColor` props entirely.

**Step 2: Verify build**

Run: `npm run typecheck && npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/table-item.tsx
git commit -m "fix(components): TableItem uses ring for active state, smaller border-radius"
```

---

## Phase 3: Component Polish

### Task 16: Card — add header, footer, title slots

**Files:**
- Modify: `src/components/card.tsx`

**Step 1: Add slot props to Card**

Update the Card component to support `header`, `footer`, and `title` props:

```typescript
import { Card as ChakraCard, type CardRootProps, Heading } from "@chakra-ui/react";
import type React from "react";

export interface CardProps extends CardRootProps {
	maxW?: CardRootProps["maxW"];
	/** Card title rendered in Card.Header. */
	title?: React.ReactNode;
	/** Custom header content. Overrides title if both provided. */
	header?: React.ReactNode;
	/** Footer content rendered in Card.Footer. */
	footer?: React.ReactNode;
	children: React.ReactNode;
}

export const Card = ({
	ref,
	maxW = "full",
	title,
	header,
	footer,
	children,
	...props
}: CardProps & { ref?: React.Ref<HTMLDivElement> }) => {
	return (
		<ChakraCard.Root
			ref={ref}
			bg="bg-surface"
			w="full"
			height="full"
			maxW={maxW}
			margin="0 auto"
			overflow="hidden"
			{...props}
		>
			{(header || title) && (
				<ChakraCard.Header>
					{header ?? <Heading size="md">{title}</Heading>}
				</ChakraCard.Header>
			)}
			<ChakraCard.Body overflow="hidden">{children}</ChakraCard.Body>
			{footer && <ChakraCard.Footer>{footer}</ChakraCard.Footer>}
		</ChakraCard.Root>
	);
};
```

**Step 2: Verify build**

Run: `npm run typecheck && npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/card.tsx
git commit -m "feat(components): Card gains title, header, and footer slot props"
```

---

### Task 17: Widget — fix heading hierarchy

**Files:**
- Modify: `src/components/widget.tsx`

**Step 1: Change heading to semibold, subheading to medium + smaller**

Find the heading text and change:
```typescript
// OLD heading:
fontWeight="bold"
// NEW heading:
fontWeight="semibold"

// OLD subheading:
fontWeight="bold"
// NEW subheading:
fontWeight="medium"
```

The subheading's `fontSize="xs"` is already smaller, so just the weight change is needed.

**Step 2: Verify build**

Run: `npm run typecheck && npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/widget.tsx
git commit -m "fix(components): Widget heading hierarchy (semibold > medium)"
```

---

### Task 18: Drawer header — lighter background

**Files:**
- Modify: `src/components/drawer.tsx`

**Step 1: Change header background**

Find the Drawer.Header or the header container with `bg="bg-subtle"` and change to:

```typescript
// OLD:
bg="bg-subtle"
// NEW:
bg="bg-surface"
```

Keep the `borderBottom="1px solid"` and `borderColor="border"` as-is — the border provides enough visual separation without the heavy background.

**Step 2: Verify build**

Run: `npm run typecheck && npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/drawer.tsx
git commit -m "fix(components): Drawer header uses lighter bg-surface background"
```

---

### Task 19: Persona — add interactive prop

**Files:**
- Modify: `src/atoms/persona/persona.tsx`

**Step 1: Add interactive prop to PersonaContainer**

Add to PersonaContainer:
```typescript
export interface PersonaContainerProps extends HTMLChakraProps<"div"> {
	styles?: PersonaStyles;
	/** When true, adds hover state and pointer cursor for clickable personas. */
	interactive?: boolean;
}
```

In the PersonaContainer render, add conditional styling:
```typescript
<chakra.div
	display="flex"
	flexDirection="row"
	alignItems="center"
	cursor={interactive ? "pointer" : undefined}
	borderRadius={interactive ? "md" : undefined}
	transition={interactive ? "background-color 150ms" : undefined}
	_hover={interactive ? { bg: "bg-subtle" } : undefined}
	px={interactive ? 2 : undefined}
	py={interactive ? 1 : undefined}
	{...rest}
>
```

Also add `interactive` to the main Persona props and pass it through to PersonaContainer.

**Step 2: Verify build**

Run: `npm run typecheck && npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/atoms/persona/persona.tsx
git commit -m "feat(atoms): Persona gains interactive prop for clickable personas"
```

---

### Task 20: TypeBadge — add colorPalette prop

**Files:**
- Modify: `src/atoms/type-badge/type-badge.tsx`

**Step 1: Add colorPalette prop**

```typescript
import { Badge, type BadgeProps } from "@chakra-ui/react";
import type React from "react";

export interface TypeBadgeProps extends Omit<BadgeProps, "children"> {
	/** Display name for the badge. */
	name: string;
	/** Chakra color palette for visual differentiation. @default "gray" */
	colorPalette?: string;
}

export const TypeBadge: React.FC<TypeBadgeProps> = ({
	name,
	colorPalette = "gray",
	...rest
}) => {
	return (
		<Badge rounded="base" px={2} ml={1} colorPalette={colorPalette} {...rest}>
			{name}
		</Badge>
	);
};
```

**Step 2: Verify build**

Run: `npm run typecheck && npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/atoms/type-badge/type-badge.tsx
git commit -m "feat(atoms): TypeBadge gains colorPalette prop for differentiation"
```

---

### Task 21: Action base — target specific transition properties

**Files:**
- Modify: `src/atoms/actions/action.tsx`

**Step 1: Replace broad transition**

Change:
```typescript
transition={"all 0.2s"}
```
To:
```typescript
transition={"background-color 150ms, color 150ms, opacity 150ms"}
```

**Step 2: Verify build**

Run: `npm run typecheck && npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/atoms/actions/action.tsx
git commit -m "fix(atoms): Action uses targeted CSS transitions (performance)"
```

---

### Task 22: FactBox — rename childs to items

**Files:**
- Modify: `src/components/fact-box.tsx`

**Step 1: In the FactBoxAction interface, rename `childs` to `items`**

Find:
```typescript
childs?: FactBoxAction[];
```
Replace with:
```typescript
items?: FactBoxAction[];
```

**Step 2: Update all references to `childs` in the component**

Find all `action.childs` or similar references and replace with `action.items`.

**Step 3: Verify build**

Run: `npm run typecheck && npm run build`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/fact-box.tsx
git commit -m "refactor(components): FactBox renames childs to items (breaking)"
```

---

## Phase 4: New Additions

### Task 23: Add Skeleton primitives

**Files:**
- Create: `src/primitives/skeleton.tsx`
- Modify: `src/primitives/index.ts`

**Step 1: Create skeleton.tsx**

```typescript
import { Skeleton as ChakraSkeleton, type SkeletonProps as ChakraSkeletonProps, Circle, Stack, HStack } from "@chakra-ui/react";
import type React from "react";

export type SkeletonProps = ChakraSkeletonProps;

/** Rectangular skeleton placeholder. */
export const Skeleton: React.FC<SkeletonProps> = (props) => {
	return <ChakraSkeleton {...props} />;
};

export interface SkeletonTextProps {
	/** Number of text lines. @default 3 */
	lines?: number;
	/** Gap between lines. @default 3 */
	gap?: number | string;
}

/** Multi-line text skeleton placeholder. */
export const SkeletonText: React.FC<SkeletonTextProps> = ({
	lines = 3,
	gap = 3,
}) => {
	return (
		<Stack gap={gap}>
			{Array.from({ length: lines }).map((_, i) => (
				<ChakraSkeleton
					key={i}
					height="3"
					width={i === lines - 1 ? "80%" : "100%"}
					borderRadius="sm"
				/>
			))}
		</Stack>
	);
};

/** Circular skeleton placeholder for avatars. */
export const SkeletonCircle: React.FC<{ size?: string | number }> = ({
	size = 10,
}) => {
	return <Circle asChild size={size}><ChakraSkeleton /></Circle>;
};
```

**Step 2: Export from primitives/index.ts**

Add:
```typescript
export { Skeleton, SkeletonText, SkeletonCircle, type SkeletonProps, type SkeletonTextProps } from "./skeleton";
```

**Step 3: Verify build**

Run: `npm run typecheck && npm run build`
Expected: PASS

**Step 4: Commit**

```bash
git add src/primitives/skeleton.tsx src/primitives/index.ts
git commit -m "feat(primitives): add Skeleton, SkeletonText, and SkeletonCircle"
```

---

### Task 24: Fix FileField drop overlay opacity

**Files:**
- Modify: `src/forms/file-field.tsx`

**Step 1: Lighten drop overlay**

Find `blackAlpha.700` (or similar heavy overlay) and change to `blackAlpha.400`.

**Step 2: Verify build**

Run: `npm run typecheck && npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/forms/file-field.tsx
git commit -m "fix(forms): lighten FileField drop zone overlay"
```

---

### Task 25: Document Inter font dependency

**Files:**
- Modify: `README.md`

**Step 1: Add font setup note**

Add a section after "Brand Colors" in README.md:

```markdown
## Font

The theme uses [Inter](https://rsms.me/inter/) as its primary typeface. Install the variable font in your app:

\`\`\`bash
npm install @fontsource-variable/inter
\`\`\`

Then import it in your app entry point:

\`\`\`tsx
import "@fontsource-variable/inter";
\`\`\`

If Inter is not installed, the theme gracefully falls back to the system font stack (`-apple-system, system-ui, sans-serif`).
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: document Inter font dependency in README"
```

---

### Task 26: Apply readOnly opacity token across form fields

**Files:**
- Modify: `src/forms/input-field.tsx`
- Modify: `src/forms/number-input-field.tsx`
- Modify: `src/forms/switch-field.tsx`
- Modify: `src/forms/textarea-field.tsx`

**Step 1: In each file, replace hardcoded opacity with token**

In every file that has `opacity: 0.8` for readOnly, change to use the semantic token. Since Chakra v3 can reference tokens via the `opacity` prop:

```typescript
// OLD (in each file):
opacity={readOnly ? 0.8 : undefined}
// NEW:
opacity={readOnly ? "readOnly" : undefined}
```

Note: If Chakra v3 doesn't resolve opacity tokens via the `opacity` prop directly, use the CSS variable: `var(--chakra-opacity-read-only)`. Test during implementation.

If token referencing doesn't work for `opacity`, keep the numeric `0.8` but import it from a shared constant.

**Step 2: Verify build**

Run: `npm run typecheck && npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/forms/input-field.tsx src/forms/number-input-field.tsx src/forms/switch-field.tsx src/forms/textarea-field.tsx
git commit -m "refactor(forms): use opacity token for readOnly state consistency"
```

---

## Verification

After all tasks, run the full check:

```bash
npm run typecheck && npm run build && npm run lint
```

All should pass. Start Storybook to visually verify:

```bash
npm run dev
```

Check: updated border-radius, dark mode in action icons, EmptyState with icon, Card with title/footer, Skeleton primitives.
