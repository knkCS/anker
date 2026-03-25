# SplitButton Relocation — Design Spec

## Problem

`SelectActionField` in `src/forms/select-action-field.tsx` is not a form field — it has no `name`, no `FormField`, no RHF integration. It's a split button (primary action + dropdown menu) that extends `ButtonProps`. It belongs in `atoms/`, not `forms/`. It also uses raw Chakra `Menu.*` imports instead of primitives wrappers, and has physical CSS properties (`roundedLeft`/`roundedRight`).

## Goal

Move the component from `forms/` to `atoms/`, rename to `SplitButton` (industry-standard term), and fix internal issues. Hard move with no backwards compatibility shim — anker is WIP and has no consumers yet.

## Design

### Approach

Hard move + rename. Delete the old files, create new ones in `atoms/split-button/`. Fix internal issues during the move.

### Files

| File | Action | Description |
|------|--------|-------------|
| `src/atoms/split-button/split-button.tsx` | Create | Renamed component using primitives Menu + atoms Button |
| `src/atoms/split-button/index.ts` | Create | Barrel re-export |
| `src/atoms/split-button/split-button.stories.tsx` | Create | Story with title `Atoms/SplitButton` |
| `src/atoms/index.ts` | Modify | Add SplitButton exports |
| `src/forms/select-action-field.tsx` | Delete | Old component |
| `src/forms/select-action-field.stories.tsx` | Delete | Old story |
| `src/forms/index.ts` | Modify | Remove SelectActionField/SelectActionMenuItem exports |

### Renames

| Old name | New name |
|----------|----------|
| `SelectActionField` | `SplitButton` |
| `SelectActionFieldProps` | `SplitButtonProps` |
| `SelectActionMenuItem` | `SplitButtonMenuItem` |

### Fixes applied during the move

1. **Use primitives Menu** — replace `Menu.*` from `@chakra-ui/react` with `MenuRoot`, `MenuContent`, `MenuItem`, `MenuTrigger` from `../../primitives/menu`
2. **Fix physical CSS** — `roundedRight` → `borderEndRadius`, `roundedLeft` → `borderStartRadius`
3. **Use atoms Button** — import `Button` from `../button` instead of `@chakra-ui/react`
4. **Remove unused Portal import** — `MenuContent` handles its own portal
5. **Set `displayName`** — `SplitButton.displayName = "SplitButton"`

### Component: `src/atoms/split-button/split-button.tsx`

```tsx
import { HStack } from "@chakra-ui/react";
import { ChevronDown, Plus } from "lucide-react";
import type React from "react";
import {
	MenuContent,
	MenuItem,
	MenuRoot,
	MenuTrigger,
} from "../../primitives/menu";
import { Button, type ButtonProps } from "../button";

export interface SplitButtonMenuItem {
	label: string;
	onClick: () => void;
	icon?: React.ReactNode;
	color?: string;
}

export interface SplitButtonProps extends ButtonProps {
	label: string;
	menuItems?: SplitButtonMenuItem[];
}

export const SplitButton: React.FC<SplitButtonProps> = (props) => {
	const { label, menuItems, onClick, ...rest } = props;
	const hasMenuItems = menuItems && menuItems.length > 0;

	return (
		<HStack gap={0.5}>
			{onClick && (
				<Button
					{...rest}
					colorPalette="blue"
					onClick={onClick}
					size="lg"
					borderEndRadius={hasMenuItems ? "none" : undefined}
				>
					<Plus size={16} />
					{label}
				</Button>
			)}
			{hasMenuItems && (
				<MenuRoot>
					<MenuTrigger asChild>
						<Button
							{...rest}
							size="lg"
							colorPalette="blue"
							borderStartRadius={onClick ? "none" : undefined}
						>
							<ChevronDown size={16} />
							{onClick ? null : label}
						</Button>
					</MenuTrigger>
					<MenuContent>
						{menuItems.map((menuItem) => (
							<MenuItem
								key={menuItem.label}
								value={menuItem.label}
								onClick={menuItem.onClick}
								color={menuItem.color}
							>
								{menuItem.icon}
								{menuItem.label}
							</MenuItem>
						))}
					</MenuContent>
				</MenuRoot>
			)}
		</HStack>
	);
};
SplitButton.displayName = "SplitButton";
```

### Barrel: `src/atoms/split-button/index.ts`

```ts
export { SplitButton, type SplitButtonProps, type SplitButtonMenuItem } from "./split-button";
```

### Story: `src/atoms/split-button/split-button.stories.tsx`

Same stories as current (Default, MenuOnly, ButtonOnly), updated to use new names and title `Atoms/SplitButton`.

### atoms/index.ts addition

Insert after the `// Select` section and before `// Stat` (maintaining alphabetical order):

```ts
// SplitButton
export {
	SplitButton,
	type SplitButtonProps,
	type SplitButtonMenuItem,
} from "./split-button";
```

### forms/index.ts removal

Remove lines 54-59 (the SelectActionField/SelectActionMenuItem exports).

## Public API

**Breaking change:** `SelectActionField`, `SelectActionFieldProps`, and `SelectActionMenuItem` are removed from `@knkcs/anker/forms`. Consumers must import `SplitButton`, `SplitButtonProps`, `SplitButtonMenuItem` from `@knkcs/anker/atoms` instead. This is acceptable because anker is WIP with no consumers.

## Verification

- `npm run typecheck` passes
- `npm run lint` passes
- `npm run build` passes
- `npm run test` passes
- Storybook: `Atoms/SplitButton` stories render correctly (Default, MenuOnly, ButtonOnly)
- Storybook: `Forms/SelectActionField` is gone
