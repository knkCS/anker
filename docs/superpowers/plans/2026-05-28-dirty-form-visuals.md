# Anker Dirty-Form Visuals + DirtyCounter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dirty visual treatment (yellow border + bg on inputs, dot on label) automatically applied by anker's react-hook-form field wrappers when `formState.dirtyFields[name]` is true, opt-out via `showDirtyState={false}`. Plus a `DirtyCounter` atom that reads the dirty count from form context.

**Architecture:** Single FormField change exposes `fieldState.isDirty` to children via the existing render callback's signature (backward-compatible additive argument). Each field type — InputField, SelectField, SwitchField, ArrayField, RadioGroupField, CheckboxField, TextareaField — gains a `showDirtyState?: boolean` prop (defaulting true) and a tiny render-time conditional that applies the appropriate visual treatment to its underlying input. DirtyCounter is a new atom in `anker/src/forms/` reading `useFormContext().formState.dirtyFields`.

**Tech Stack:** React 19, react-hook-form, Chakra UI 3, vitest, Storybook.

**Spec:** `/Users/jeskoiwanovski/repo/template/docs/superpowers/specs/2026-05-28-template-detail-tabs-design.md` (§4).

**Branch:** `feat/dirty-form-visuals` (off `main` in `/Users/jeskoiwanovski/repo/anker`).

**Conventions:** Conventional commits with scope `forms`. Biome formatter (tabs). TDD throughout; existing tests use vitest. Verify with `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test`.

---

## File Structure

**Create:**
- `src/forms/use-field-dirty.ts` — shared hook returning `{ isDirty: boolean }` given a field name and an opt-out flag. Used by every field type.
- `src/forms/dirty-counter.tsx` — atom reading dirty count from form context.
- `src/forms/dirty-counter.stories.tsx`
- `src/forms/dirty-counter.test.tsx`

**Modify:**
- `src/forms/form-field.tsx` — extend the `children` render-prop signature to forward `fieldState`. Render a dirty-marker dot on the label when dirty and label is a string.
- `src/forms/input-field.tsx` — apply dirty visual to the input via `inputProps`.
- `src/forms/select-field.tsx` — apply dirty visual.
- `src/forms/switch-field.tsx` — apply dirty visual (subtle, a colored dot beside the switch).
- `src/forms/textarea-field.tsx` — apply dirty visual.
- `src/forms/checkbox-field.tsx` — apply dirty visual (colored dot).
- `src/forms/radio-group-field.tsx` — apply dirty visual (colored dot).
- `src/forms/array-field.tsx` — apply dirty visual on its outer Box.
- `src/forms/index.ts` — export `DirtyCounter`, `useFieldDirty`.
- `package.json` — bump version `2.4.0 → 2.5.0`.

**Test infrastructure:** existing vitest setup; component tests use `@testing-library/react`. Storybook for visual sign-off — each new feature gets a story.

---

## Task 1: `useFieldDirty` hook

**Files:**
- Create: `/Users/jeskoiwanovski/repo/anker/src/forms/use-field-dirty.ts`
- Create: `/Users/jeskoiwanovski/repo/anker/src/forms/use-field-dirty.test.tsx`

Single source of truth for "is this field dirty AND should we visually mark it?". Each field type calls it once. Pure hook — no DOM.

- [ ] **Step 1: Write the failing test**

Create `/Users/jeskoiwanovski/repo/anker/src/forms/use-field-dirty.test.tsx`:

```tsx
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { useFieldDirty } from "./use-field-dirty";

function wrapper(defaults: Record<string, string>) {
	return ({ children }: { children: ReactNode }) => {
		const form = useForm({ defaultValues: defaults });
		return <FormProvider {...form}>{children}</FormProvider>;
	};
}

describe("useFieldDirty", () => {
	it("returns false when field value equals its default", () => {
		const { result } = renderHook(() => useFieldDirty("name"), {
			wrapper: wrapper({ name: "alpha" }),
		});
		expect(result.current).toBe(false);
	});

	it("returns false when showDirtyState is false", () => {
		const { result } = renderHook(
			() => useFieldDirty("name", { showDirtyState: false }),
			{ wrapper: wrapper({ name: "alpha" }) },
		);
		expect(result.current).toBe(false);
	});

	it("returns false when called outside a FormProvider", () => {
		// useFormContext returns null outside provider; hook must tolerate it.
		const { result } = renderHook(() => useFieldDirty("name"));
		expect(result.current).toBe(false);
	});
});
```

- [ ] **Step 2: Verify FAIL**

```bash
cd /Users/jeskoiwanovski/repo/anker && npm run test -- src/forms/use-field-dirty.test.tsx 2>&1 | tail -10
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `/Users/jeskoiwanovski/repo/anker/src/forms/use-field-dirty.ts`:

```ts
import { useFormContext } from "react-hook-form";

export interface UseFieldDirtyOptions {
	/** Set to false to never report dirty (opt-out per field). */
	showDirtyState?: boolean;
}

/**
 * useFieldDirty returns true when the field at `name` is dirty (changed
 * from its react-hook-form default) AND visual marking isn't suppressed.
 * Safe to call outside a FormProvider — returns false in that case.
 */
export function useFieldDirty(
	name: string,
	opts: UseFieldDirtyOptions = {},
): boolean {
	const { showDirtyState = true } = opts;
	if (!showDirtyState) return false;
	const ctx = useFormContext();
	if (!ctx) return false;
	const dirty = ctx.formState.dirtyFields as Record<string, unknown>;
	return Boolean(dirty[name]);
}
```

- [ ] **Step 4: Verify PASS**

```bash
cd /Users/jeskoiwanovski/repo/anker && npm run test -- src/forms/use-field-dirty.test.tsx 2>&1 | tail -10
```
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/jeskoiwanovski/repo/anker
git checkout -b feat/dirty-form-visuals
git add src/forms/use-field-dirty.ts src/forms/use-field-dirty.test.tsx
git commit -m "feat(forms): useFieldDirty hook"
```

---

## Task 2: FormField — label dirty marker + expose fieldState to children

**Files:**
- Modify: `/Users/jeskoiwanovski/repo/anker/src/forms/form-field.tsx`

Add a label-side visual indicator (small colored dot) when the field is dirty AND showDirtyState is true. Existing `children` callback signature gains an optional second argument carrying `{ isDirty }` so specialized field components can react to it without re-reading form context.

- [ ] **Step 1: Read current FormField** to anchor the edit

```bash
cd /Users/jeskoiwanovski/repo/anker && cat src/forms/form-field.tsx
```

Confirm the file uses `Controller` from react-hook-form and the `render` callback already destructures `fieldState`.

- [ ] **Step 2: Extend the children type**

In `/Users/jeskoiwanovski/repo/anker/src/forms/form-field.tsx`, replace the `children` field of `FormFieldProps<T>`:

```ts
	children: (
		field: ControllerRenderProps<T, Path<T>> & {
			"aria-describedby"?: string;
		},
	) => React.ReactNode;
```

with:

```ts
	/** When false, the dirty-marker on the label is suppressed and the
	 * children-callback's `meta.isDirty` is forced to false. */
	showDirtyState?: boolean;
	children: (
		field: ControllerRenderProps<T, Path<T>> & {
			"aria-describedby"?: string;
		},
		meta: { isDirty: boolean },
	) => React.ReactNode;
```

- [ ] **Step 3: Add the prop + label dot**

Find the destructuring of `props` (after `useFormContext`) and add `showDirtyState = true`:

```ts
	const {
		name,
		label,
		helperText,
		description,
		required,
		disabled,
		readOnly,
		actions,
		showDirtyState = true,
		children,
	} = props;
```

Inside the `Controller`'s `render` callback, compute the effective dirty state and pass it to children:

```tsx
render={({ field, fieldState }) => {
	const isDirty = Boolean(showDirtyState && fieldState.isDirty);
	const describedBy = …;  // existing
	return (
		<Field.Root … data-dirty={isDirty ? "true" : undefined}>
			{label &&
				(typeof label === "string" ? (
					<HStack>
						<Field.Label flex="1" htmlFor={name}>
							{label}
							{isDirty && (
								<Box
									as="span"
									display="inline-block"
									width="6px"
									height="6px"
									borderRadius="full"
									bg="yellow.500"
									ml="2"
									aria-label="ungespeicherte Änderung"
								/>
							)}
						</Field.Label>
						{actions}
					</HStack>
				) : (
					label
				))}
			{children({ ...field, "aria-describedby": describedBy }, { isDirty })}
			…  /* description / helperText / error text unchanged */
		</Field.Root>
	);
}}
```

Add `Box` to the existing `../primitives/layout` import:

```ts
import { Box, HStack } from "../primitives/layout";
```

- [ ] **Step 4: Verify build + existing tests pass**

```bash
cd /Users/jeskoiwanovski/repo/anker && npm run typecheck 2>&1 | tail -5
cd /Users/jeskoiwanovski/repo/anker && npm run test 2>&1 | tail -5
```
Expected: both clean. Existing consumers of `FormField` that use the single-arg children form still compile because the second arg is optional at call time (TypeScript allows under-arity callbacks).

- [ ] **Step 5: Commit**

```bash
cd /Users/jeskoiwanovski/repo/anker
git add src/forms/form-field.tsx
git commit -m "feat(forms): FormField forwards isDirty + label marker"
```

---

## Task 3: InputField + TextareaField — input visual treatment

**Files:**
- Modify: `/Users/jeskoiwanovski/repo/anker/src/forms/input-field.tsx`
- Modify: `/Users/jeskoiwanovski/repo/anker/src/forms/textarea-field.tsx`

Both render a text-input-shaped control. The dirty visual is `borderColor="yellow.400"` + `bg="yellow.50"` applied to the input.

- [ ] **Step 1: Update InputField**

In `/Users/jeskoiwanovski/repo/anker/src/forms/input-field.tsx`:

(a) Add `showDirtyState?: boolean` to `InputFieldProps<T>` (it's already in `FormFieldProps<T>` via the `Omit`+spread, so this is a no-op type-wise — keep the prop name passing through cleanly).

(b) Change the destructuring to pull `showDirtyState`:

```ts
	const {
		name,
		label,
		placeholder,
		type,
		append,
		prepend,
		inputProps,
		readOnly,
		disabled,
		showDirtyState,
		...rest
	} = props;
```

(c) Use the second arg of the children callback to wire the visual:

```tsx
		<FormField<T>
			name={name}
			label={label}
			readOnly={readOnly}
			disabled={disabled}
			showDirtyState={showDirtyState}
			{...rest}
		>
			{(field, { isDirty }) => (
				<TextInput
					{...field}
					value={field.value ?? ""}
					id={name}
					placeholder={placeholder}
					type={type}
					append={append}
					prepend={prepend}
					readOnly={readOnly}
					disabled={disabled}
					opacity={readOnly ? 0.8 : 1}
					borderColor={isDirty ? "yellow.400" : undefined}
					bg={isDirty ? "yellow.50" : undefined}
					ref={ref}
					{...inputProps}
				/>
			)}
		</FormField>
```

- [ ] **Step 2: Update TextareaField the same way**

Open `/Users/jeskoiwanovski/repo/anker/src/forms/textarea-field.tsx`. Mirror the destructuring (pull `showDirtyState`) and pass `borderColor` + `bg` conditionally on the underlying Textarea. The exact prop wiring may differ — read the file and apply the same pattern.

- [ ] **Step 3: Add a story to demonstrate**

Append a new story to `/Users/jeskoiwanovski/repo/anker/src/forms/input-field.stories.tsx` (or create one if absent). Example:

```tsx
export const DirtyState: Story = {
	render: () => {
		const form = useForm({ defaultValues: { name: "alpha" } });
		// dirty the field via setValue with shouldDirty=true so the visual shows
		React.useEffect(() => {
			form.setValue("name", "alpha changed", { shouldDirty: true });
		}, []);
		return (
			<FormProvider {...form}>
				<Box maxW="400px">
					<InputField name="name" label="Name" />
				</Box>
			</FormProvider>
		);
	},
};
```

Adjust imports to match existing pattern in the story file.

- [ ] **Step 4: Write the test**

Create `/Users/jeskoiwanovski/repo/anker/src/forms/input-field.dirty.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { InputField } from "./input-field";

function Harness({
	showDirtyState,
}: {
	showDirtyState?: boolean;
}) {
	const form = useForm({ defaultValues: { name: "alpha" } });
	useEffect(() => {
		form.setValue("name", "beta", { shouldDirty: true });
	}, [form]);
	return (
		<FormProvider {...form}>
			<InputField name="name" label="Name" showDirtyState={showDirtyState} />
		</FormProvider>
	);
}

describe("InputField — dirty visual", () => {
	it("renders the dirty marker dot when dirty (label is a string)", () => {
		const { getByLabelText } = render(<Harness />);
		expect(getByLabelText("ungespeicherte Änderung")).toBeInTheDocument();
	});

	it("suppresses the marker when showDirtyState is false", () => {
		const { queryByLabelText } = render(<Harness showDirtyState={false} />);
		expect(queryByLabelText("ungespeicherte Änderung")).toBeNull();
	});
});
```

- [ ] **Step 5: Verify + commit**

```bash
cd /Users/jeskoiwanovski/repo/anker && npm run test -- src/forms/input-field.dirty.test.tsx 2>&1 | tail -8
cd /Users/jeskoiwanovski/repo/anker && npm run typecheck 2>&1 | tail -3
cd /Users/jeskoiwanovski/repo/anker
git add src/forms/input-field.tsx src/forms/input-field.dirty.test.tsx src/forms/textarea-field.tsx
# include the stories file if you modified it:
git add src/forms/input-field.stories.tsx 2>/dev/null || true
git commit -m "feat(forms): dirty visual on InputField + TextareaField"
```

---

## Task 4: SelectField — input visual treatment

**Files:**
- Modify: `/Users/jeskoiwanovski/repo/anker/src/forms/select-field.tsx`

Same pattern as InputField — apply `borderColor` + `bg` to the underlying select trigger when dirty. Pull `showDirtyState` from props; use the second children-callback arg.

- [ ] **Step 1: Read the current SelectField** to find the right insertion point for the visual styling

```bash
cd /Users/jeskoiwanovski/repo/anker && sed -n '1,80p' src/forms/select-field.tsx
```

- [ ] **Step 2: Apply the dirty visual**

Use the same destructuring pattern as Task 3 Step 1 (pull `showDirtyState`, pass through). In the children callback, when `isDirty` is true, apply `borderColor="yellow.400"` and `bg="yellow.50"` to the select trigger element. The exact JSX hook point depends on whether SelectField uses anker's `BaseSelect`, Chakra's `Select.Trigger`, or another primitive — match the existing style.

- [ ] **Step 3: Test**

Mirror Task 3 Step 4: create `/Users/jeskoiwanovski/repo/anker/src/forms/select-field.dirty.test.tsx` with the same Harness shape, asserting the marker on the label appears (the underlying select visual is hard to assert without screenshot tests; the label marker is the testable contract).

- [ ] **Step 4: Verify + commit**

```bash
cd /Users/jeskoiwanovski/repo/anker && npm run test 2>&1 | tail -5
cd /Users/jeskoiwanovski/repo/anker
git add src/forms/select-field.tsx src/forms/select-field.dirty.test.tsx
git commit -m "feat(forms): dirty visual on SelectField"
```

---

## Task 5: SwitchField + CheckboxField — dot-style dirty marker

**Files:**
- Modify: `/Users/jeskoiwanovski/repo/anker/src/forms/switch-field.tsx`
- Modify: `/Users/jeskoiwanovski/repo/anker/src/forms/checkbox-field.tsx`

Switches and checkboxes don't have a border to tint — the dirty visual lives solely on the label dot (which FormField renders centrally in Task 2). No additional change is needed beyond passing `showDirtyState` through. Verify the existing pattern works.

- [ ] **Step 1: Update both files** — pull `showDirtyState` from props and pass to FormField

For each file (`switch-field.tsx`, `checkbox-field.tsx`), find the destructuring of `props` and add `showDirtyState`. Pass it through to `<FormField showDirtyState={showDirtyState} … >`.

The children render callback's `meta.isDirty` is unused (switch/checkbox have no border to style) — but the second arg can be silently ignored.

- [ ] **Step 2: Test**

Create `/Users/jeskoiwanovski/repo/anker/src/forms/switch-field.dirty.test.tsx` mirroring Task 3 Step 4 but with a boolean default (`{ enabled: false }`) and a `setValue("enabled", true, { shouldDirty: true })`. Assert the marker appears on the label.

Same for `checkbox-field.dirty.test.tsx`.

- [ ] **Step 3: Verify + commit**

```bash
cd /Users/jeskoiwanovski/repo/anker && npm run test 2>&1 | tail -5
cd /Users/jeskoiwanovski/repo/anker
git add src/forms/switch-field.tsx src/forms/checkbox-field.tsx \
  src/forms/switch-field.dirty.test.tsx src/forms/checkbox-field.dirty.test.tsx
git commit -m "feat(forms): dirty marker propagation on SwitchField + CheckboxField"
```

---

## Task 6: ArrayField + RadioGroupField — label marker propagation

**Files:**
- Modify: `/Users/jeskoiwanovski/repo/anker/src/forms/array-field.tsx`
- Modify: `/Users/jeskoiwanovski/repo/anker/src/forms/radio-group-field.tsx`

ArrayField's dirty state is true when any nested entry differs from default; RadioGroupField when the selection changes. Both rely on the FormField label marker (no input-border to tint). Just pass `showDirtyState` through.

- [ ] **Step 1: Update both files**

Mirror Task 5 Step 1 for each file: pull `showDirtyState` from destructured props, pass to FormField.

- [ ] **Step 2: Test**

Create `/Users/jeskoiwanovski/repo/anker/src/forms/array-field.dirty.test.tsx`. Setup a form with `{ tags: ["a"] }` and use `form.setValue("tags", ["a", "b"], { shouldDirty: true })`. Assert the marker shows on the label.

For radio: `/Users/jeskoiwanovski/repo/anker/src/forms/radio-group-field.dirty.test.tsx`, setup `{ pick: "x" }`, set to `"y"`, assert marker.

- [ ] **Step 3: Verify + commit**

```bash
cd /Users/jeskoiwanovski/repo/anker && npm run test 2>&1 | tail -5
cd /Users/jeskoiwanovski/repo/anker
git add src/forms/array-field.tsx src/forms/radio-group-field.tsx \
  src/forms/array-field.dirty.test.tsx src/forms/radio-group-field.dirty.test.tsx
git commit -m "feat(forms): dirty marker on ArrayField + RadioGroupField"
```

---

## Task 7: DirtyCounter atom

**Files:**
- Create: `/Users/jeskoiwanovski/repo/anker/src/forms/dirty-counter.tsx`
- Create: `/Users/jeskoiwanovski/repo/anker/src/forms/dirty-counter.test.tsx`
- Create: `/Users/jeskoiwanovski/repo/anker/src/forms/dirty-counter.stories.tsx`

Reads dirty count from `useFormContext()`; renders a chip with a colored dot and a German default label.

- [ ] **Step 1: Write the failing test**

Create `/Users/jeskoiwanovski/repo/anker/src/forms/dirty-counter.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { DirtyCounter } from "./dirty-counter";

function Harness({
	dirtyCount,
	label,
	hideWhenClean,
}: {
	dirtyCount: number;
	label?: string;
	hideWhenClean?: boolean;
}) {
	const form = useForm({
		defaultValues: Object.fromEntries(
			Array.from({ length: 3 }, (_, i) => [`f${i}`, "x"]),
		),
	});
	useEffect(() => {
		for (let i = 0; i < dirtyCount; i++) {
			form.setValue(`f${i}`, "y", { shouldDirty: true });
		}
	}, [form, dirtyCount]);
	return (
		<FormProvider {...form}>
			<DirtyCounter label={label} hideWhenClean={hideWhenClean} />
		</FormProvider>
	);
}

describe("DirtyCounter", () => {
	it("renders nothing when no fields are dirty (default)", () => {
		const { container } = render(<Harness dirtyCount={0} />);
		expect(container.textContent).toBe("");
	});

	it("renders the count with the default German label when dirty", () => {
		const { container } = render(<Harness dirtyCount={2} />);
		expect(container.textContent).toContain("2 ungespeicherte Änderungen");
	});

	it("respects a custom label template with {count}", () => {
		const { container } = render(
			<Harness dirtyCount={1} label="{count} unsaved" />,
		);
		expect(container.textContent).toContain("1 unsaved");
	});

	it("renders the chip with count=0 when hideWhenClean is false", () => {
		const { container } = render(
			<Harness dirtyCount={0} hideWhenClean={false} />,
		);
		expect(container.textContent).toContain("0 ungespeicherte Änderungen");
	});
});
```

- [ ] **Step 2: Verify FAIL**

```bash
cd /Users/jeskoiwanovski/repo/anker && npm run test -- src/forms/dirty-counter.test.tsx 2>&1 | tail -10
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `/Users/jeskoiwanovski/repo/anker/src/forms/dirty-counter.tsx`:

```tsx
import { useFormContext } from "react-hook-form";
import { Box, HStack } from "../primitives/layout";
import { Text } from "../primitives/typography";

export interface DirtyCounterProps {
	/**
	 * Label template. The literal `{count}` is replaced with the dirty
	 * field count. @default "{count} ungespeicherte Änderungen"
	 */
	label?: string;
	/** Render nothing when no fields are dirty. @default true */
	hideWhenClean?: boolean;
}

export function DirtyCounter({
	label = "{count} ungespeicherte Änderungen",
	hideWhenClean = true,
}: DirtyCounterProps) {
	const ctx = useFormContext();
	const dirty = ctx
		? (ctx.formState.dirtyFields as Record<string, unknown>)
		: {};
	const count = Object.keys(dirty).length;
	if (count === 0 && hideWhenClean) return null;
	return (
		<HStack gap="2" fontSize="sm" color="yellow.700">
			<Box
				width="6px"
				height="6px"
				borderRadius="full"
				bg="yellow.500"
				aria-hidden
			/>
			<Text>{label.replace("{count}", String(count))}</Text>
		</HStack>
	);
}
DirtyCounter.displayName = "DirtyCounter";
```

- [ ] **Step 4: Verify PASS**

```bash
cd /Users/jeskoiwanovski/repo/anker && npm run test -- src/forms/dirty-counter.test.tsx 2>&1 | tail -10
```
Expected: PASS (4 tests).

- [ ] **Step 5: Add Storybook story**

Create `/Users/jeskoiwanovski/repo/anker/src/forms/dirty-counter.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Box } from "../primitives/layout";
import { DirtyCounter } from "./dirty-counter";

const meta: Meta<typeof DirtyCounter> = {
	title: "Forms/DirtyCounter",
	component: DirtyCounter,
};
export default meta;

type Story = StoryObj<typeof DirtyCounter>;

function StoryShell({
	dirtyCount,
	label,
	hideWhenClean,
}: {
	dirtyCount: number;
	label?: string;
	hideWhenClean?: boolean;
}) {
	const form = useForm({
		defaultValues: { a: "1", b: "2", c: "3" },
	});
	useEffect(() => {
		const keys: Array<"a" | "b" | "c"> = ["a", "b", "c"];
		for (let i = 0; i < dirtyCount; i++) {
			form.setValue(keys[i], "changed", { shouldDirty: true });
		}
	}, [form, dirtyCount]);
	return (
		<FormProvider {...form}>
			<Box p="4">
				<DirtyCounter label={label} hideWhenClean={hideWhenClean} />
			</Box>
		</FormProvider>
	);
}

export const Clean: Story = { render: () => <StoryShell dirtyCount={0} /> };
export const OneDirty: Story = {
	render: () => <StoryShell dirtyCount={1} />,
};
export const ThreeDirty: Story = {
	render: () => <StoryShell dirtyCount={3} />,
};
```

- [ ] **Step 6: Commit**

```bash
cd /Users/jeskoiwanovski/repo/anker
git add src/forms/dirty-counter.tsx src/forms/dirty-counter.test.tsx src/forms/dirty-counter.stories.tsx
git commit -m "feat(forms): DirtyCounter atom"
```

---

## Task 8: Export + bump version

**Files:**
- Modify: `/Users/jeskoiwanovski/repo/anker/src/forms/index.ts`
- Modify: `/Users/jeskoiwanovski/repo/anker/package.json`

- [ ] **Step 1: Add exports**

In `/Users/jeskoiwanovski/repo/anker/src/forms/index.ts`, add (alphabetical position):

```ts
// DirtyCounter
export { DirtyCounter, type DirtyCounterProps } from "./dirty-counter";
// useFieldDirty
export { useFieldDirty, type UseFieldDirtyOptions } from "./use-field-dirty";
```

- [ ] **Step 2: Bump version**

In `/Users/jeskoiwanovski/repo/anker/package.json`, change:

```json
  "version": "2.4.0",
```

to:

```json
  "version": "2.5.0",
```

- [ ] **Step 3: Full pipeline green**

```bash
cd /Users/jeskoiwanovski/repo/anker
npm run lint 2>&1 | tail -5
npm run typecheck 2>&1 | tail -5
npm run build 2>&1 | tail -5
npm run verify-exports 2>&1 | tail -5
npm run test 2>&1 | tail -5
```
Expected: all clean. Fix any biome lint complaints (formatting) before committing.

- [ ] **Step 4: Commit**

```bash
cd /Users/jeskoiwanovski/repo/anker
git add src/forms/index.ts package.json
git commit -m "chore(forms): export DirtyCounter + useFieldDirty, bump to 2.5.0"
```

---

## Task 9: Local tarball for template/web pre-validation

**Files:** none modified.

Build a local tarball so the template plan can install pre-release. Same pattern used for odon-ui 0.5.0 earlier in the session.

- [ ] **Step 1: Build + pack**

```bash
cd /Users/jeskoiwanovski/repo/anker && npm run build 2>&1 | tail -3
cd /Users/jeskoiwanovski/repo/anker && npm pack 2>&1 | tail -3
mv /Users/jeskoiwanovski/repo/anker/knkcs-anker-2.5.0.tgz /tmp/knkcs-anker-2.5.0.tgz
ls -la /tmp/knkcs-anker-2.5.0.tgz
```

- [ ] **Step 2: No commit** — tarball is operational artefact only.

---

## Task 10: Push + PR + merge + tag + publish

**Files:** none modified.

- [ ] **Step 1: Push branch**

```bash
cd /Users/jeskoiwanovski/repo/anker
git push -u origin feat/dirty-form-visuals
```

- [ ] **Step 2: Open PR**

```bash
cd /Users/jeskoiwanovski/repo/anker
gh pr create --base main --title "feat(forms): dirty-form visuals + DirtyCounter (2.5.0)" --body "$(cat <<'EOF'
## Summary
- All `forms/` field wrappers (InputField, SelectField, SwitchField, ArrayField, RadioGroupField, CheckboxField, TextareaField) auto-render a dirty visual treatment when `formState.dirtyFields[name]` is true.
- New `DirtyCounter` atom reads from `useFormContext` and renders an N-fields-dirty chip.
- Centralised in `FormField` (label marker) + a shared `useFieldDirty` hook.
- Opt-out per field via `showDirtyState={false}`. Non-breaking — existing single-arg `children` callbacks still compile.

Spec: `template/docs/superpowers/specs/2026-05-28-template-detail-tabs-design.md` §4.

## Test Plan
- vitest suite: 50+ tests across the new + modified files.
- Storybook: new DirtyState stories for each updated field type + DirtyCounter Clean/OneDirty/ThreeDirty.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Merge after review**

(Manual gate — wait for human approval.) Then:

```bash
cd /Users/jeskoiwanovski/repo/anker
gh pr merge <PR#> --merge --admin
```

- [ ] **Step 4: Tag + push**

```bash
cd /Users/jeskoiwanovski/repo/anker
git checkout main && git pull
git tag v2.5.0
git push origin v2.5.0
```
Expected: `publish.yml` workflow runs on the tag.

- [ ] **Step 5: Verify publish**

```bash
npm view @knkcs/anker versions --json | tail -10
```
Expected: `"2.5.0"` is in the list.

If npmjs publish fails for the same NPM_TOKEN / GH Packages billing reasons documented in [[reference-odon-ui-release]] memory, rotate the token / re-run the workflow as described there.

- [ ] **Step 6: Mark plan complete**

Once 2.5.0 is live on npmjs, the template plan can start.

---

## Final Verification

- [ ] `npm run test` green (all new + modified tests pass).
- [ ] `npm run typecheck` clean.
- [ ] `npm run build` clean.
- [ ] `npm run verify-exports` clean.
- [ ] `@knkcs/anker@2.5.0` resolvable from npmjs (`npm view`).

---

## Notes for the Implementer

- **Backward compatibility**: the `children` callback's second arg (`meta`) is optional at call time — TypeScript allows under-arity callbacks — so existing consumers that wrote `{(field) => …}` continue to compile unchanged. Don't try to make the second arg required.
- **Yellow vs amber palette**: Chakra's default theme has `yellow.50` through `yellow.900`. Don't introduce a new `amber` palette token — `yellow` is the existing convention used by other anker styles. The spec was clarified to use yellow consistently.
- **Storybook**: anker's Storybook is the visual sign-off surface. Every visual change gets a story; reviewers expect to see it.
- **Test isolation**: vitest tests use `@testing-library/react`; each test creates its own `FormProvider`. Don't share state across tests.
- **`npm run verify-exports`** is anker's own check that runtime exports match the `.d.ts`. Run it before committing the index.ts changes — it'll catch typos.
- **Don't extend the FormField surface beyond what's specified.** No new `renderDirtyMarker` callback prop, no `dirtyClassName` opt-in, no theming hooks. The visual is hard-coded yellow dot + yellow border; consumers who want customisation can opt out and roll their own.
