# Group 1 Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 3 independent components: InlineEdit (forms), SidebarSection (components), ColorSwatchPicker (atoms).

**Architecture:** Each component is independent with no cross-dependencies. InlineEdit replaces EditableHeading using Chakra v3's Editable compound component. SidebarSection is a new component with internal edit-mode state. ColorSwatchPicker is a new controlled atom with preset swatches and optional hex input.

**Tech Stack:** Chakra UI v3 (Editable, layout primitives), lucide-react icons, React state

**Specs:**
- `docs/superpowers/specs/2026-03-26-inline-edit-design.md`
- `docs/superpowers/specs/2026-03-26-sidebar-section-design.md`
- `docs/superpowers/specs/2026-03-26-color-swatch-picker-design.md`

---

## File Map

| File | Action | Component |
|------|--------|-----------|
| `src/forms/inline-edit.tsx` | Create | InlineEdit |
| `src/forms/inline-edit.stories.tsx` | Create | InlineEdit |
| `src/forms/inline-edit.mdx` | Create | InlineEdit |
| `src/forms/editable-heading.tsx` | Delete | InlineEdit (replaces) |
| `src/forms/editable-heading.stories.tsx` | Delete | InlineEdit (replaces) |
| `src/forms/index.ts` | Modify | InlineEdit exports |
| `src/components/sidebar-section.tsx` | Create | SidebarSection |
| `src/components/sidebar-section.stories.tsx` | Create | SidebarSection |
| `src/components/sidebar-section.mdx` | Create | SidebarSection |
| `src/components/index.ts` | Modify | SidebarSection exports |
| `src/atoms/color-swatch-picker/color-swatch-picker.tsx` | Create | ColorSwatchPicker |
| `src/atoms/color-swatch-picker/index.ts` | Create | ColorSwatchPicker |
| `src/atoms/color-swatch-picker/color-swatch-picker.stories.tsx` | Create | ColorSwatchPicker |
| `src/atoms/color-swatch-picker/color-swatch-picker.mdx` | Create | ColorSwatchPicker |
| `src/atoms/index.ts` | Modify | ColorSwatchPicker exports |

---

### Task 1: InlineEdit — replace EditableHeading (#47)

**Files:**
- Create: `src/forms/inline-edit.tsx`
- Create: `src/forms/inline-edit.stories.tsx`
- Create: `src/forms/inline-edit.mdx`
- Delete: `src/forms/editable-heading.tsx`
- Delete: `src/forms/editable-heading.stories.tsx`
- Modify: `src/forms/index.ts`

- [ ] **Step 1: Create inline-edit.tsx**

Read `src/forms/editable-heading.tsx` first for reference. Create `src/forms/inline-edit.tsx` with the full component. Key points:
- Uses Chakra v3's `Editable.Root`, `Editable.Preview`, `Editable.Input`, `Editable.Textarea`, `Editable.EditTrigger`
- `useEditableContext` for edit controls visibility and `cancel()` for allowEmpty revert
- `CancelRefCapture` child component to capture `cancel` from context into a ref
- `variant` prop: `"input"` (default) uses `Editable.Input`, `"textarea"` uses `Editable.Textarea`
- `allowEmpty` (default false): on commit, if trimmed value is empty, calls `cancelRef.current()` to revert
- `onSubmit` receives trimmed value
- `disabled` passed to `Editable.Root`
- `Editable.Textarea` uses `minH` for sizing (not `rows` — may not be typed)
- Pencil icon (`Pencil` from lucide-react, size 16) shown when not editing

Full props interface per spec:
```tsx
export interface InlineEditProps {
	value?: string;
	onSubmit?: (nextValue: string) => void;
	onChange?: (nextValue: string) => void;
	onCancel?: (previousValue: string) => void;
	variant?: "input" | "textarea";
	placeholder?: string;
	fontSize?: string;
	fontWeight?: string;
	maxW?: string;
	disabled?: boolean;
	allowEmpty?: boolean;
	rows?: number;
	editLabel?: string;
}
```

Defaults: `variant = "input"`, `fontSize = "md"`, `allowEmpty = false`, `rows = 3`, `editLabel = "Edit"`.

Set `InlineEdit.displayName = "InlineEdit"`.

- [ ] **Step 2: Create inline-edit.stories.tsx**

Title: `"Forms/InlineEdit"`. Stories:

- `Default` — args: `{ value: "Click to edit" }`
- `Interactive` — stateful render with `useState`, controlled `value` + `onChange` + `onSubmit`
- `Textarea` — `variant="textarea"`, multi-line value
- `Disabled` — `disabled={true}`
- `AllowEmpty` — `allowEmpty={true}`, demonstrates empty submission
- `HeadingStyle` — `fontSize="3xl"`, `fontWeight="bold"`, demonstrates the old EditableHeading use case

Use `satisfies Meta<typeof InlineEdit>`.

- [ ] **Step 3: Create inline-edit.mdx**

```mdx
import { Canvas, Meta, ArgTypes } from "@storybook/blocks";
import * as Stories from "./inline-edit.stories";

<Meta of={Stories} />

# InlineEdit

Click-to-edit component for inline text editing. Supports single-line input and multi-line textarea variants.

## Usage

<Canvas of={Stories.Interactive} />

## Textarea

<Canvas of={Stories.Textarea} />

## Heading Style

For heading-sized inline edits (replaces the former EditableHeading):

<Canvas of={Stories.HeadingStyle} />

## Props

<ArgTypes of={Stories} />
```

- [ ] **Step 4: Update forms/index.ts**

Replace the EditableHeading export block (lines 26-30):

From:
```ts
// EditableHeading
export {
	EditableHeading,
	type EditableHeadingProps,
} from "./editable-heading";
```

To:
```ts
// InlineEdit
export {
	InlineEdit,
	type InlineEditProps,
} from "./inline-edit";
```

- [ ] **Step 5: Delete old files**

```bash
rm src/forms/editable-heading.tsx src/forms/editable-heading.stories.tsx
```

- [ ] **Step 6: Verify and commit**

Run: `npm run typecheck && npm run lint && npm run build && npm run test`
Expected: All pass

```bash
git add src/forms/inline-edit.tsx src/forms/inline-edit.stories.tsx src/forms/inline-edit.mdx src/forms/index.ts
git rm src/forms/editable-heading.tsx src/forms/editable-heading.stories.tsx
git commit -m "feat(forms): add InlineEdit component replacing EditableHeading

Generalized click-to-edit with input/textarea variants, allowEmpty
control, and configurable font size. Uses Chakra v3 Editable.

BREAKING CHANGE: EditableHeading removed. Use InlineEdit instead.

Closes #47"
```

---

### Task 2: SidebarSection (#52)

**Files:**
- Create: `src/components/sidebar-section.tsx`
- Create: `src/components/sidebar-section.stories.tsx`
- Create: `src/components/sidebar-section.mdx`
- Modify: `src/components/index.ts`

- [ ] **Step 1: Create sidebar-section.tsx**

Component with three interaction modes:
1. Read-only (no actionIcon) — just label + content
2. Action callback (actionIcon + onAction) — button calls external handler
3. Two-slot edit (actionIcon + editContent, no onAction) — internal isEditing toggle

Plus render-prop escape hatch when children is a function.

Key implementation:
- `useState(defaultEditing ?? false)` for internal edit state
- Action button rendered only when `actionIcon && (onAction || editContent)`
- Click logic: `onAction` takes priority, else toggle `isEditing` when `editContent` exists
- Icon swaps to `X` (lucide-react) when editing and no `onAction`
- Empty state: when content is null/empty and `emptyText` provided, show muted text

Uses: `Box`, `Flex`, `Text` from `@chakra-ui/react`, `IconButton` from `../../atoms/button`, `X` from `lucide-react`.

Full props per spec. Set `SidebarSection.displayName = "SidebarSection"`.

- [ ] **Step 2: Create sidebar-section.stories.tsx**

Title: `"Components/SidebarSection"`. Stories:

- `ReadOnly` — simple text content
- `WithAction` — Plus icon, `onAction` logs to console
- `TwoSlotEdit` — Settings icon, editContent is a placeholder form, toggleable
- `RenderProp` — render-prop with isEditing/setEditing
- `EmptyState` — `emptyText="No items assigned"`
- `StackedSections` — multiple sections with `borderBottomWidth="1px"` dividers

Use `satisfies Meta<typeof SidebarSection>`.

- [ ] **Step 3: Create sidebar-section.mdx**

```mdx
import { Canvas, Meta, ArgTypes } from "@storybook/blocks";
import * as Stories from "./sidebar-section.stories";

<Meta of={Stories} />

# SidebarSection

Lightweight metadata panel slot for sidebar layouts. Uppercase label, optional action button, content area with display/edit mode toggle.

## Read-only

<Canvas of={Stories.ReadOnly} />

## With Action

<Canvas of={Stories.WithAction} />

## Edit Mode

<Canvas of={Stories.TwoSlotEdit} />

## Empty State

<Canvas of={Stories.EmptyState} />

## Stacked

<Canvas of={Stories.StackedSections} />

## Props

<ArgTypes of={Stories} />
```

- [ ] **Step 4: Add to components/index.ts**

Add between the `// Stepper` section and `// Table (deprecated)` section:

```ts
// SidebarSection
export type { SidebarSectionProps } from "./sidebar-section";
export { SidebarSection } from "./sidebar-section";
```

- [ ] **Step 5: Verify and commit**

Run: `npm run typecheck && npm run lint && npm run build && npm run test`
Expected: All pass

```bash
git add src/components/sidebar-section.tsx src/components/sidebar-section.stories.tsx src/components/sidebar-section.mdx src/components/index.ts
git commit -m "feat(components): add SidebarSection for sidebar metadata panels

Lightweight flush sidebar slot with three interaction modes:
read-only, action callback, and two-slot edit mode with
render-prop escape hatch.

Closes #52"
```

---

### Task 3: ColorSwatchPicker (#53)

**Files:**
- Create: `src/atoms/color-swatch-picker/color-swatch-picker.tsx`
- Create: `src/atoms/color-swatch-picker/index.ts`
- Create: `src/atoms/color-swatch-picker/color-swatch-picker.stories.tsx`
- Create: `src/atoms/color-swatch-picker/color-swatch-picker.mdx`
- Modify: `src/atoms/index.ts`

- [ ] **Step 1: Create color-swatch-picker.tsx**

Controlled component with:
- Preset color swatches in flex-wrap layout
- Selected swatch has `borderWidth="2px"`, `borderColor="border.emphasized"`
- Optional hex input (`showHexInput`) — validates 6-digit hex on blur/Enter
- Optional preview box (`showPreview`) — colored square
- `size` prop controls swatch dimensions (sm=4, md=5, lg=7 Chakra spacing tokens)
- `DEFAULT_PRESETS` constant with 8 sensible colors
- Internal `hexInput` state synced with external `value` via `useEffect`

Uses: `Box`, `Flex`, `HStack`, `Stack` from `@chakra-ui/react`, `TextInput` from `../text-input`.

Full props per spec. Set `ColorSwatchPicker.displayName = "ColorSwatchPicker"`.

- [ ] **Step 2: Create index.ts barrel**

```ts
export { ColorSwatchPicker, type ColorSwatchPickerProps } from "./color-swatch-picker";
```

- [ ] **Step 3: Create color-swatch-picker.stories.tsx**

Title: `"Atoms/ColorSwatchPicker"`. Stories:

- `Default` — interactive with `useState`, preset swatches only
- `WithHexInput` — `showHexInput={true}`
- `WithPreview` — `showHexInput={true}`, `showPreview={true}`
- `CustomPresets` — custom 4-color palette
- `SmallSize` — `size="sm"`
- `NoSelection` — no initial value

Use `satisfies Meta<typeof ColorSwatchPicker>`.

- [ ] **Step 4: Create color-swatch-picker.mdx**

```mdx
import { Canvas, Meta, ArgTypes } from "@storybook/blocks";
import * as Stories from "./color-swatch-picker.stories";

<Meta of={Stories} />

# ColorSwatchPicker

Preset color swatch selector with optional hex input and preview.

## Usage

<Canvas of={Stories.Default} />

## With Hex Input

<Canvas of={Stories.WithHexInput} />

## With Preview

<Canvas of={Stories.WithPreview} />

## Props

<ArgTypes of={Stories} />
```

- [ ] **Step 5: Add to atoms/index.ts**

Add after the `// Clipboard` section (alphabetical, before `// Comment`):

```ts
// ColorSwatchPicker
export {
	ColorSwatchPicker,
	type ColorSwatchPickerProps,
} from "./color-swatch-picker";
```

- [ ] **Step 6: Verify and commit**

Run: `npm run typecheck && npm run lint && npm run build && npm run test`
Expected: All pass

```bash
git add src/atoms/color-swatch-picker/ src/atoms/index.ts
git commit -m "feat(atoms): add ColorSwatchPicker for preset color selection

Controlled color swatch selector with optional hex input and
preview box. Works standalone or with RHF Controller.

Closes #53"
```

---

### Task 4: Push

- [ ] **Step 1: Push all commits**

```bash
git push origin main
```
