# Button & IconButton Atoms Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Button and IconButton atoms to anker with sensible default overrides, stories, barrel export, and internal migration.

**Architecture:** Thin re-exports of Chakra's Button/IconButton with anker-specific defaults (`size="md" variant="secondary"` for Button, `size="md" variant="ghost"` for IconButton). No theme changes needed — IconButton inherits anker's button recipe. Internal components migrate to use the new atoms.

**Tech Stack:** React, Chakra UI v3, Storybook 8, Vitest + Testing Library, Biome (tabs, double quotes, semicolons), tsup (build)

---

## Chunk 1: Button and IconButton Atoms

### Task 1: Create Button atom

**Files:**
- Create: `src/atoms/button/button.tsx`
- Create: `src/atoms/button/index.ts`

- [ ] **Step 1: Create the Button component**

Create `src/atoms/button/button.tsx`.

Note: The inline `ref` pattern (not `React.FC`) is intentional — React 19 supports ref as a prop natively, enabling ref forwarding without `forwardRef`. This differs from older atoms like `status-badge.tsx` which use `React.FC`. Do not "normalize" to `React.FC` — it would break ref forwarding needed for compound components like `Dialog.CloseTrigger asChild`.

```tsx
import {
	Button as ChakraButton,
	type ButtonProps,
} from "@chakra-ui/react";

export type { ButtonProps };

export const Button = ({
	ref,
	...props
}: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) => {
	return <ChakraButton size="md" variant="secondary" ref={ref} {...props} />;
};
Button.displayName = "Button";
```

- [ ] **Step 2: Create the barrel export**

Create `src/atoms/button/index.ts`:

```ts
export { Button, type ButtonProps } from "./button";
```

- [ ] **Step 3: Verify it builds**

Run: `cd /Users/jeskoiwanovski/repo/anker && npx tsup src/atoms/index.ts --format esm --dts --no-clean 2>&1 | tail -5`

Expected: Build succeeds (no type errors). Note: the barrel hasn't been updated yet, so this just validates the file compiles.

- [ ] **Step 4: Commit**

```bash
git add src/atoms/button/button.tsx src/atoms/button/index.ts
git commit -m "feat(atoms): add Button atom with default size=md variant=secondary"
```

---

### Task 2: Create IconButton atom

**Files:**
- Modify: `src/atoms/button/icon-button.tsx` (create)
- Modify: `src/atoms/button/index.ts`

- [ ] **Step 1: Create the IconButton component**

Create `src/atoms/button/icon-button.tsx`:

```tsx
import {
	IconButton as ChakraIconButton,
	type IconButtonProps,
} from "@chakra-ui/react";

export type { IconButtonProps };

export const IconButton = ({
	ref,
	...props
}: IconButtonProps & { ref?: React.Ref<HTMLButtonElement> }) => {
	return <ChakraIconButton size="md" variant="ghost" ref={ref} {...props} />;
};
IconButton.displayName = "IconButton";
```

- [ ] **Step 2: Update the barrel export**

Update `src/atoms/button/index.ts` to:

```ts
export { Button, type ButtonProps } from "./button";
export { IconButton, type IconButtonProps } from "./icon-button";
```

- [ ] **Step 3: Commit**

```bash
git add src/atoms/button/icon-button.tsx src/atoms/button/index.ts
git commit -m "feat(atoms): add IconButton atom with default size=md variant=ghost"
```

---

### Task 3: Add Button stories

**Files:**
- Create: `src/atoms/button/button.stories.tsx`

**Reference pattern:** `src/atoms/status-badge/status-badge.stories.tsx` — uses `satisfies Meta<typeof Component>`, `StoryObj`, render functions for variant galleries.

- [ ] **Step 1: Create Button stories**

Create `src/atoms/button/button.stories.tsx`:

```tsx
import { HStack, Stack } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { Mail, Plus } from "lucide-react";
import { Button } from "./button";

const meta = {
	title: "Atoms/Button",
	component: Button,
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: "Button",
	},
};

export const Variants: Story = {
	render() {
		return (
			<HStack gap={3}>
				<Button variant="primary">Primary</Button>
				<Button variant="secondary">Secondary</Button>
				<Button variant="outline">Outline</Button>
				<Button variant="ghost">Ghost</Button>
				<Button variant="link">Link</Button>
				<Button variant="link-gray">Link Gray</Button>
			</HStack>
		);
	},
};

export const Sizes: Story = {
	render() {
		return (
			<HStack gap={3} align="center">
				<Button size="xs">Extra Small</Button>
				<Button size="sm">Small</Button>
				<Button size="md">Medium</Button>
				<Button size="lg">Large</Button>
				<Button size="xl">Extra Large</Button>
			</HStack>
		);
	},
};

export const WithIcons: Story = {
	render() {
		return (
			<Stack gap={3}>
				<HStack gap={3}>
					<Button variant="primary">
						<Plus size={16} /> Create
					</Button>
					<Button variant="outline">
						<Mail size={16} /> Send
					</Button>
				</HStack>
				<HStack gap={3}>
					<Button variant="primary">
						Next <Plus size={16} />
					</Button>
				</HStack>
			</Stack>
		);
	},
};

export const Loading: Story = {
	render() {
		return (
			<HStack gap={3}>
				<Button variant="primary" loading>
					Saving
				</Button>
				<Button variant="secondary" loading>
					Loading
				</Button>
			</HStack>
		);
	},
};
```

- [ ] **Step 2: Verify stories render**

Run: `cd /Users/jeskoiwanovski/repo/anker && npx storybook build 2>&1 | tail -3`

Expected: Build succeeds. (Or run `npm run dev` and visually check `Atoms/Button` in browser.)

- [ ] **Step 3: Commit**

```bash
git add src/atoms/button/button.stories.tsx
git commit -m "docs(atoms): add Button stories — variants, sizes, icons, loading"
```

---

### Task 4: Add IconButton stories

**Files:**
- Create: `src/atoms/button/icon-button.stories.tsx`

- [ ] **Step 1: Create IconButton stories**

Create `src/atoms/button/icon-button.stories.tsx`:

```tsx
import { HStack } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { Plus, Settings, Trash, X } from "lucide-react";
import { IconButton } from "./icon-button";

const meta = {
	title: "Atoms/IconButton",
	component: IconButton,
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		"aria-label": "Settings",
		children: <Settings size={16} />,
	},
};

export const Variants: Story = {
	render() {
		return (
			<HStack gap={3}>
				<IconButton variant="primary" aria-label="Add">
					<Plus size={16} />
				</IconButton>
				<IconButton variant="secondary" aria-label="Settings">
					<Settings size={16} />
				</IconButton>
				<IconButton variant="outline" aria-label="Settings">
					<Settings size={16} />
				</IconButton>
				<IconButton variant="ghost" aria-label="Close">
					<X size={16} />
				</IconButton>
				<IconButton variant="link" aria-label="Delete" colorPalette="red">
					<Trash size={16} />
				</IconButton>
			</HStack>
		);
	},
};

export const Sizes: Story = {
	render() {
		return (
			<HStack gap={3} align="center">
				<IconButton size="xs" aria-label="Close">
					<X size={12} />
				</IconButton>
				<IconButton size="sm" aria-label="Close">
					<X size={14} />
				</IconButton>
				<IconButton size="md" aria-label="Close">
					<X size={16} />
				</IconButton>
				<IconButton size="lg" aria-label="Close">
					<X size={18} />
				</IconButton>
				<IconButton size="xl" aria-label="Close">
					<X size={20} />
				</IconButton>
			</HStack>
		);
	},
};
```

- [ ] **Step 2: Commit**

```bash
git add src/atoms/button/icon-button.stories.tsx
git commit -m "docs(atoms): add IconButton stories — variants and sizes"
```

---

### Task 5: Add to atoms barrel export

**Files:**
- Modify: `src/atoms/index.ts` (add Button/IconButton export at top, before Actions)

- [ ] **Step 1: Add Button/IconButton to atoms barrel**

Insert at line 1 of `src/atoms/index.ts` (before the existing `// Actions` block, which is currently the first line of the file):

```ts
// Button
export {
	Button,
	type ButtonProps,
	IconButton,
	type IconButtonProps,
} from "./button";

```

- [ ] **Step 2: Verify the build**

Run: `cd /Users/jeskoiwanovski/repo/anker && npm run build 2>&1 | tail -5`

Expected: Build succeeds. `dist/atoms/index.js` and `dist/atoms/index.d.ts` include Button and IconButton exports.

- [ ] **Step 3: Verify lint**

Run: `cd /Users/jeskoiwanovski/repo/anker && npm run lint 2>&1 | tail -5`

Expected: No errors (Biome).

- [ ] **Step 4: Commit**

```bash
git add src/atoms/index.ts
git commit -m "feat(atoms): export Button and IconButton from atoms barrel"
```

---

## Chunk 2: Internal Migration

### Task 6: Migrate modal.tsx

**Files:**
- Modify: `src/components/modal.tsx`

The import line currently reads:
```ts
import {
	Button,
	Dialog,
	type DialogRootProps,
	Flex,
	IconButton,
	Portal,
	Separator,
	Spacer,
} from "@chakra-ui/react";
```

- [ ] **Step 1: Update imports**

Change the import to split Button/IconButton to the new atom:

```ts
import {
	Dialog,
	type DialogRootProps,
	Flex,
	Portal,
	Separator,
	Spacer,
} from "@chakra-ui/react";
import { Button, IconButton } from "../atoms/button";
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/jeskoiwanovski/repo/anker && npm run build 2>&1 | tail -5`

Expected: Build succeeds. No behavior change — all Button/IconButton usages in modal.tsx already pass explicit variant/size props.

- [ ] **Step 3: Commit**

```bash
git add src/components/modal.tsx
git commit -m "refactor(modal): import Button/IconButton from atoms"
```

---

### Task 7: Migrate drawer.tsx

**Files:**
- Modify: `src/components/drawer.tsx`

Current import:
```ts
import {
	Button,
	Drawer,
	type DrawerRootProps,
	Flex,
	Portal,
	Spacer,
} from "@chakra-ui/react";
```

- [ ] **Step 1: Update imports**

Change to:

```ts
import {
	Drawer,
	type DrawerRootProps,
	Flex,
	Portal,
	Spacer,
} from "@chakra-ui/react";
import { Button } from "../atoms/button";
```

Note: drawer.tsx only uses `Button`, not `IconButton` (the close button is a `Button` with a ghost variant and icon child).

- [ ] **Step 2: Verify build**

Run: `cd /Users/jeskoiwanovski/repo/anker && npm run build 2>&1 | tail -5`

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/drawer.tsx
git commit -m "refactor(drawer): import Button from atoms"
```

---

### Task 8: Migrate pagination.tsx

**Files:**
- Modify: `src/components/pagination.tsx`

Current import:
```ts
import { Button, HStack, IconButton, Text } from "@chakra-ui/react";
```

- [ ] **Step 1: Update imports**

Change to:

```ts
import { HStack, Text } from "@chakra-ui/react";
import { Button, IconButton } from "../atoms/button";
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/jeskoiwanovski/repo/anker && npm run build 2>&1 | tail -5`

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/pagination.tsx
git commit -m "refactor(pagination): import Button/IconButton from atoms"
```

---

### Task 9: Migrate comment.tsx

**Files:**
- Modify: `src/atoms/comment/comment.tsx`

Current import:
```ts
import {
	Button,
	type ButtonProps,
	chakra,
	HStack,
	Stack,
} from "@chakra-ui/react";
```

`ButtonProps` is used by `CommentActionProps`. Import it from the atom too.

- [ ] **Step 1: Update imports**

Change to:

```ts
import {
	chakra,
	HStack,
	Stack,
} from "@chakra-ui/react";
import { Button, type ButtonProps } from "../button";
```

Note: The relative path is `../button` because `comment.tsx` is in `src/atoms/comment/` and the button atom is in `src/atoms/button/`.

- [ ] **Step 2: Verify build**

Run: `cd /Users/jeskoiwanovski/repo/anker && npm run build 2>&1 | tail -5`

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/atoms/comment/comment.tsx
git commit -m "refactor(comment): import Button/ButtonProps from atoms"
```

---

### Task 10: Migrate empty-state.stories.tsx

**Files:**
- Modify: `src/atoms/empty-state/empty-state.stories.tsx`

Current import:
```ts
import { Button, Icon } from "@chakra-ui/react";
```

- [ ] **Step 1: Update imports**

Change to:

```ts
import { Icon } from "@chakra-ui/react";
import { Button } from "../button";
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/jeskoiwanovski/repo/anker && npm run build 2>&1 | tail -5`

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/atoms/empty-state/empty-state.stories.tsx
git commit -m "refactor(empty-state): import Button from atoms in stories"
```

---

### Task 11: Migrate actions/filter.tsx

**Files:**
- Modify: `src/atoms/actions/filter.tsx`

Current imports:
```ts
import type { IconButtonProps } from "@chakra-ui/react";
import { Box, Circle, IconButton, Text } from "@chakra-ui/react";
```

- [ ] **Step 1: Update imports**

Change to:

```ts
import { Box, Circle, Text } from "@chakra-ui/react";
import { IconButton, type IconButtonProps } from "../button";
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/jeskoiwanovski/repo/anker && npm run build 2>&1 | tail -5`

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/atoms/actions/filter.tsx
git commit -m "refactor(actions): import IconButton from atoms in filter"
```

---

### Task 12: Final verification

- [ ] **Step 1: Run full build**

Run: `cd /Users/jeskoiwanovski/repo/anker && npm run build 2>&1`

Expected: Clean build, no errors.

- [ ] **Step 2: Run lint**

Run: `cd /Users/jeskoiwanovski/repo/anker && npm run lint 2>&1`

Expected: No lint errors.

- [ ] **Step 3: Run tests**

Run: `cd /Users/jeskoiwanovski/repo/anker && npm test 2>&1`

Expected: All tests pass.

- [ ] **Step 4: Run Storybook build**

Run: `cd /Users/jeskoiwanovski/repo/anker && npm run build:storybook 2>&1 | tail -5`

Expected: Storybook builds successfully with new `Atoms/Button` and `Atoms/IconButton` stories.
