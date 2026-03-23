# NativeSelect Primitive Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a standalone `NativeSelect` primitive that flattens Chakra's compound `NativeSelect.Root/.Field/.Indicator` into a single component, plus stories, barrel export, and internal `SelectField` refactor.

**Architecture:** Flat wrapper in `src/primitives/native-select.tsx` following the Switch pattern (named function expression, `displayName`, ref forwarding to `<select>`). Root-level props (`size`, `variant`, `disabled`, `invalid`, `unstyled`) are separated from Field-level props and forwarded to their respective compound parts. `SelectField` is then refactored to use the new primitive.

**Tech Stack:** React, Chakra UI v3, Storybook 8, Biome (tabs, double quotes, semicolons), tsup (build)

---

## Chunk 1: NativeSelect Primitive

### Task 1: Create NativeSelect component

**Files:**
- Create: `src/primitives/native-select.tsx`

- [ ] **Step 1: Create the NativeSelect component**

Create `src/primitives/native-select.tsx`:

```tsx
import {
	type NativeSelectFieldProps,
	NativeSelect as ChakraNativeSelect,
	type NativeSelectRootProps,
} from "@chakra-ui/react";
import type * as React from "react";

export interface NativeSelectProps
	extends NativeSelectRootProps,
		Omit<NativeSelectFieldProps, "placeholder"> {
	/** Rendered as a disabled first <option> */
	placeholder?: string;
}

export const NativeSelect = function NativeSelect({
	ref,
	...props
}: NativeSelectProps & { ref?: React.Ref<HTMLSelectElement> }) {
	const {
		size,
		variant,
		disabled,
		invalid,
		unstyled,
		placeholder,
		children,
		...fieldProps
	} = props;

	return (
		<ChakraNativeSelect.Root
			size={size}
			variant={variant}
			disabled={disabled}
			invalid={invalid}
			unstyled={unstyled}
		>
			<ChakraNativeSelect.Field ref={ref} {...fieldProps}>
				{placeholder && (
					<option value="" disabled>
						{placeholder}
					</option>
				)}
				{children}
			</ChakraNativeSelect.Field>
			<ChakraNativeSelect.Indicator />
		</ChakraNativeSelect.Root>
	);
};
NativeSelect.displayName = "NativeSelect";
```

Note: The import ordering puts `type` imports first (Biome's `organizeImports` rule). The named function expression pattern (`export const NativeSelect = function NativeSelect(...)`) matches `src/primitives/switch.tsx`.

- [ ] **Step 2: Verify it builds**

Run: `cd /Users/jeskoiwanovski/repo/anker && npx tsup src/primitives/index.ts --format esm --dts --no-clean 2>&1 | tail -5`

Expected: Build succeeds (no type errors). Note: the barrel hasn't been updated yet, so this just validates the file compiles in isolation.

- [ ] **Step 3: Commit**

```bash
git add src/primitives/native-select.tsx
git commit -m "feat(primitives): add NativeSelect component"
```

---

### Task 2: Add to primitives barrel export

**Files:**
- Modify: `src/primitives/index.ts`

- [ ] **Step 1: Add NativeSelect to barrel**

Insert after the Menu exports block (after line 61 `} from "./menu";`) and before the NumberInput section (line 62 `export type { NumberInputProps } from "./number-input";`):

```ts

export type { NativeSelectProps } from "./native-select";
// NativeSelect
export { NativeSelect } from "./native-select";

```

This maintains alphabetical ordering (Menu → NativeSelect → NumberInput).

- [ ] **Step 2: Verify build**

Run: `cd /Users/jeskoiwanovski/repo/anker && npm run build 2>&1 | tail -5`

Expected: Build succeeds. `dist/primitives/index.js` and `dist/primitives/index.d.ts` include NativeSelect exports.

- [ ] **Step 3: Verify lint**

Run: `cd /Users/jeskoiwanovski/repo/anker && npm run lint 2>&1 | tail -5`

Expected: No new errors (only pre-existing warnings).

- [ ] **Step 4: Commit**

```bash
git add src/primitives/index.ts
git commit -m "feat(primitives): export NativeSelect from barrel"
```

---

### Task 3: Add NativeSelect stories

**Files:**
- Create: `src/primitives/native-select.stories.tsx`

**Reference pattern:** `src/primitives/switch.stories.tsx` — uses `satisfies Meta<typeof Component>`, `StoryObj`, `render()` functions for galleries.

- [ ] **Step 1: Create stories**

Create `src/primitives/native-select.stories.tsx`:

```tsx
import { Stack } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { NativeSelect } from "./native-select";

const meta = {
	title: "Primitives/NativeSelect",
	component: NativeSelect,
} satisfies Meta<typeof NativeSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleOptions = (
	<>
		<option value="draft">Draft</option>
		<option value="review">In Review</option>
		<option value="published">Published</option>
		<option value="archived">Archived</option>
	</>
);

export const Default: Story = {
	args: {
		children: sampleOptions,
	},
};

export const WithPlaceholder: Story = {
	args: {
		placeholder: "Select a status",
		children: sampleOptions,
	},
};

export const Sizes: Story = {
	render() {
		return (
			<Stack gap={3} maxW="300px">
				<NativeSelect size="xs" placeholder="Extra Small">
					{sampleOptions}
				</NativeSelect>
				<NativeSelect size="sm" placeholder="Small">
					{sampleOptions}
				</NativeSelect>
				<NativeSelect size="md" placeholder="Medium (default)">
					{sampleOptions}
				</NativeSelect>
				<NativeSelect size="lg" placeholder="Large">
					{sampleOptions}
				</NativeSelect>
				<NativeSelect size="xl" placeholder="Extra Large">
					{sampleOptions}
				</NativeSelect>
			</Stack>
		);
	},
};

export const Disabled: Story = {
	args: {
		disabled: true,
		placeholder: "Disabled",
		children: sampleOptions,
	},
};
```

- [ ] **Step 2: Verify stories build**

Run: `cd /Users/jeskoiwanovski/repo/anker && npm run build:storybook 2>&1 | tail -3`

Expected: Storybook build succeeds with new `Primitives/NativeSelect` stories.

- [ ] **Step 3: Commit**

```bash
git add src/primitives/native-select.stories.tsx
git commit -m "docs(primitives): add NativeSelect stories — sizes, placeholder, disabled"
```

---

## Chunk 2: SelectField Internal Refactor

### Task 4: Refactor SelectField to use NativeSelect primitive

**Files:**
- Modify: `src/forms/select-field.tsx`

The current SelectField manually assembles `NativeSelect.Root/.Field/.Indicator`. After this refactor, it delegates to the new `NativeSelect` primitive while preserving its `readOnly → disabled` mapping.

Current import:
```ts
import { NativeSelect, type NativeSelectFieldProps } from "@chakra-ui/react";
```

- [ ] **Step 1: Update imports**

Change `src/forms/select-field.tsx` imports to:

```ts
import type { NativeSelectFieldProps } from "@chakra-ui/react";
import type React from "react";
import type { FieldValues } from "react-hook-form";
import { NativeSelect } from "../primitives/native-select";
import { FormField, type FormFieldProps } from "./form-field";
```

Note: `NativeSelectFieldProps` is still imported from Chakra because it's used in the `SelectFieldProps` interface for the `selectProps` prop. Only the component import changes.

- [ ] **Step 2: Replace compound pattern with NativeSelect primitive**

Replace the render body (the `{(field) => (...)}` block inside `<FormField>`) with:

```tsx
{(field) => (
	<NativeSelect
		disabled={readOnly || disabled}
		placeholder={placeholder}
		{...field}
		value={String(field.value ?? "")}
		id={name}
		ref={ref}
		{...selectProps}
	>
		{children}
	</NativeSelect>
)}
```

The complete file after changes:

```tsx
import type { NativeSelectFieldProps } from "@chakra-ui/react";
import type React from "react";
import type { FieldValues } from "react-hook-form";
import { NativeSelect } from "../primitives/native-select";
import { FormField, type FormFieldProps } from "./form-field";

export interface SelectFieldProps<T extends FieldValues>
	extends Omit<FormFieldProps<T>, "children"> {
	placeholder?: string;
	selectProps?: NativeSelectFieldProps;
	children: React.ReactNode;
}

export function SelectField<T extends FieldValues>({
	ref,
	...props
}: SelectFieldProps<T> & { ref?: React.Ref<HTMLSelectElement> }) {
	const {
		name,
		label,
		placeholder,
		selectProps,
		children,
		readOnly,
		disabled,
		...rest
	} = props;

	return (
		<FormField<T>
			name={name}
			label={label}
			readOnly={readOnly}
			disabled={disabled}
			{...rest}
		>
			{(field) => (
				<NativeSelect
					disabled={readOnly || disabled}
					placeholder={placeholder}
					{...field}
					value={String(field.value ?? "")}
					id={name}
					ref={ref}
					{...selectProps}
				>
					{children}
				</NativeSelect>
			)}
		</FormField>
	);
}
(SelectField as { displayName?: string }).displayName = "SelectField";
```

Key: `disabled={readOnly || disabled}` preserves the existing behavior where `readOnly` maps to `disabled` on the native select. The `placeholder` prop is passed to `NativeSelect` which renders it as a disabled first `<option>` — identical to the previous inline rendering.

- [ ] **Step 3: Verify build**

Run: `cd /Users/jeskoiwanovski/repo/anker && npm run build 2>&1 | tail -5`

Expected: Build succeeds. No behavioral change.

- [ ] **Step 4: Verify lint**

Run: `cd /Users/jeskoiwanovski/repo/anker && npm run lint 2>&1 | tail -5`

Expected: No new errors.

- [ ] **Step 5: Commit**

```bash
git add src/forms/select-field.tsx
git commit -m "refactor(forms): use NativeSelect primitive in SelectField"
```

---

### Task 5: Final verification

- [ ] **Step 1: Run full build**

Run: `cd /Users/jeskoiwanovski/repo/anker && npm run build 2>&1`

Expected: Clean build, no errors.

- [ ] **Step 2: Run lint**

Run: `cd /Users/jeskoiwanovski/repo/anker && npm run lint 2>&1`

Expected: No new lint errors.

- [ ] **Step 3: Run tests**

Run: `cd /Users/jeskoiwanovski/repo/anker && npm test 2>&1`

Expected: All tests pass.

- [ ] **Step 4: Run Storybook build**

Run: `cd /Users/jeskoiwanovski/repo/anker && npm run build:storybook 2>&1 | tail -5`

Expected: Storybook builds successfully with new `Primitives/NativeSelect` stories.
