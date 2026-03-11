# Tier 2 Docs & Missing Stories Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add missing Skeleton stories and MDX documentation for Tier 2 components (Select, Accordion, Breadcrumb).

**Architecture:** Create one stories file (Skeleton) and three MDX docs (Select, Accordion, Breadcrumb). MDX files follow established patterns but use a lighter structure (no Gaps & Migration) for Accordion and Breadcrumb since they're thin Chakra wrappers.

**Tech Stack:** Storybook 8, Chakra UI v3, TypeScript, MDX

---

### Task 1: Create Skeleton stories

**Files:**
- Create: `src/primitives/skeleton.stories.tsx`

**Context:**
- The Skeleton component is at `src/primitives/skeleton.tsx`
- Exports three variants: `Skeleton` (rectangular), `SkeletonText` (multi-line text), `SkeletonCircle` (circular)
- No stories file exists yet
- Follow Biome formatting: tabs, double quotes

**Step 1: Create the stories file**

```tsx
import { HStack, Stack } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton, SkeletonCircle, SkeletonText } from "./skeleton";

const meta = {
	title: "Primitives/Skeleton",
	component: Skeleton,
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Stack gap={6} maxW="400px">
			<HStack gap={4}>
				<SkeletonCircle size={12} />
				<Stack gap={2} flex={1}>
					<Skeleton height="4" />
					<Skeleton height="4" width="60%" />
				</Stack>
			</HStack>
			<SkeletonText lines={4} />
			<Skeleton height="120px" borderRadius="md" />
		</Stack>
	),
};
```

**Step 2: Verify in Storybook**

Run: `npm run dev`
Navigate to: Primitives > Skeleton > Default
Expected: A layout showing a circular skeleton, text line skeletons, multi-line text skeleton, and a rectangular block skeleton.

**Step 3: Commit**

```bash
git add src/primitives/skeleton.stories.tsx
git commit -m "docs: add Skeleton stories"
```

---

### Task 2: Create Select MDX documentation

**Files:**
- Create: `src/atoms/select/select.mdx`

**Context:**
- Stories file: `src/atoms/select/select.stories.tsx` with `Default` and `Multi` stories
- The meta title is `"Atoms/Select"` and does NOT set `component` (uses bare `Meta`)
- `BaseSelect` wraps `chakra-react-select` with custom option renderers (avatar, color, icon)
- `BaseOption` interface has: `id`, `label`, optional `avatar`, `color`, `icon`, `data`
- Also exports `CreatableSelect` (from chakra-react-select directly), `TableMenuList`, `TableOption`
- Follow the MDX pattern from `src/components/modal.mdx`

**Step 1: Create the MDX file**

```mdx
import { Canvas, Meta, ArgTypes } from "@storybook/blocks";
import * as Stories from "./select.stories";

<Meta of={Stories} />

# Select

A searchable dropdown for single or multi-value selection. Built on [chakra-react-select](https://github.com/csandman/chakra-react-select) with custom option renderers for avatars, color indicators, and icons.

## Usage

<Canvas of={Stories.Default} />

## Multi-Select

<Canvas of={Stories.Multi} />

Set `isMulti` to allow selecting multiple values. Selected items appear as tags.

## Variants

- **`BaseSelect`** — The primary select component. Wraps chakra-react-select with custom `SingleValue`, `MultiValue`, and `Option` renderers that display avatar, color circle, icon, and label.
- **`CreatableSelect`** — Re-exported from chakra-react-select. Allows users to create new options on the fly.
- **`TableMenuList` / `TableOption`** — Specialized components for rendering options as table rows with multiple columns. Use `createTableMenuComponents()` to configure.

## BaseOption Shape

Options must conform to the `BaseOption` interface:

- `id` (required) — unique identifier, used as the option value
- `label` (required) — display text
- `avatar` — renders an `Avatar` with the given name
- `color` — renders a color circle indicator
- `icon` — renders a custom React node
- `data` — arbitrary metadata for custom logic

## Guidelines

- **Do** use `BaseSelect` for most dropdown needs — it handles avatars, colors, and icons out of the box.
- **Don't** use raw `chakra-react-select` directly — `BaseSelect` provides consistent option rendering.
- **Do** set `menuPortalTarget` (defaults to `document.body`) to avoid z-index issues inside modals or drawers.
- **Don't** forget that `loading` and `disabled` are the prop names (not `isLoading`/`isDisabled`).
- Use `isClearable={false}` when a value is always required.

## Accessibility

- Keyboard navigable: arrow keys to browse options, Enter to select, Escape to close.
- ARIA attributes are handled by chakra-react-select (combobox role, listbox, option roles).
- Screen readers announce selected values and available options.
- Multi-select tags are keyboard-removable with Backspace.

## Props

<ArgTypes of={Stories} />
```

**Step 2: Verify in Storybook**

Run: `npm run dev`
Navigate to: Atoms > Select > Docs
Expected: Full documentation page with description, two Canvas blocks, variant descriptions, guidelines, accessibility, and props.

**Step 3: Commit**

```bash
git add src/atoms/select/select.mdx
git commit -m "docs: add MDX documentation for Select"
```

---

### Task 3: Create Accordion MDX documentation

**Files:**
- Create: `src/primitives/accordion.mdx`

**Context:**
- Stories file: `src/primitives/accordion.stories.tsx` with `Default` and `Multiple` stories
- `AccordionItem` takes `label` and `children`, wraps Chakra's nested accordion structure
- `AccordionRoot` supports `collapsible`, `multiple`, `defaultValue`
- Lighter MDX structure: no Gaps & Migration section

**Step 1: Create the MDX file**

```mdx
import { Canvas, Meta, ArgTypes } from "@storybook/blocks";
import * as Stories from "./accordion.stories";

<Meta of={Stories} />

# Accordion

A vertically stacked set of collapsible sections. Wraps Chakra's Accordion with a simplified API — pass `label` and `children` instead of composing nested trigger/content components.

## Usage

<Canvas of={Stories.Default} />

## Multiple Open

<Canvas of={Stories.Multiple} />

Set `multiple` on `AccordionRoot` to allow several sections open simultaneously. Without it, opening one section closes the others.

## Guidelines

- **Do** use Accordion for progressive disclosure — FAQ pages, settings panels, grouped form sections.
- **Don't** use Accordion for primary navigation or critical content that users must see.
- **Do** set `collapsible` on `AccordionRoot` if users should be able to close all sections.
- Keep accordion content concise. If a section has complex content, consider a separate page instead.

## Accessibility

- Each trigger is a focusable button with `aria-expanded` and `aria-controls`.
- Arrow keys navigate between triggers, Enter/Space toggles sections.
- Content regions have `role="region"` with `aria-labelledby` linking to the trigger.

## Props

### AccordionItem

<ArgTypes of={Stories} />
```

**Step 2: Verify in Storybook**

Run: `npm run dev`
Navigate to: Primitives > Accordion > Docs
Expected: Documentation page with usage, multiple open demo, guidelines, accessibility, and props.

**Step 3: Commit**

```bash
git add src/primitives/accordion.mdx
git commit -m "docs: add MDX documentation for Accordion"
```

---

### Task 4: Create Breadcrumb MDX documentation

**Files:**
- Create: `src/primitives/breadcrumb.mdx`

**Context:**
- Stories file: `src/primitives/breadcrumb.stories.tsx` with `Default` and `WithSeparator` stories
- Pure pass-through of Chakra Breadcrumb components: Root, List, Item, Link, CurrentLink, Separator, Ellipsis
- Lighter MDX structure: no Gaps & Migration section

**Step 1: Create the MDX file**

```mdx
import { Canvas, Meta, ArgTypes } from "@storybook/blocks";
import * as Stories from "./breadcrumb.stories";

<Meta of={Stories} />

# Breadcrumb

Navigation breadcrumbs showing the current page's location within a hierarchy.

## Usage

<Canvas of={Stories.Default} />

## Custom Separator

<Canvas of={Stories.WithSeparator} />

Pass a `separator` prop to `BreadcrumbRoot` to replace the default chevron (e.g., `separator="/"`).

## Composition

Breadcrumb uses several sub-components:

- **`BreadcrumbRoot`** — Container with optional `separator` prop.
- **`BreadcrumbList`** — The ordered list wrapper.
- **`BreadcrumbItem`** — A single breadcrumb entry.
- **`BreadcrumbLink`** — A clickable ancestor link.
- **`BreadcrumbCurrentLink`** — The current (non-clickable) page.
- **`BreadcrumbSeparator`** — Custom separator between items (optional, auto-inserted by default).
- **`BreadcrumbEllipsis`** — Collapsed items indicator for long trails.

## Guidelines

- **Do** use Breadcrumb for hierarchical navigation (e.g., Dashboard > Users > Edit).
- **Don't** use Breadcrumb for flat navigation or step indicators — use `Stepper` instead.
- Mark the current page with `BreadcrumbCurrentLink`, not a regular `BreadcrumbLink`.
- Keep breadcrumb trails short. Use `BreadcrumbEllipsis` for deep hierarchies.

## Accessibility

- Renders inside a `<nav aria-label="breadcrumb">` landmark.
- `BreadcrumbCurrentLink` sets `aria-current="page"` automatically.
- Links are keyboard navigable with standard tab order.

## Props

<ArgTypes of={Stories} />
```

**Step 2: Verify in Storybook**

Run: `npm run dev`
Navigate to: Primitives > Breadcrumb > Docs
Expected: Documentation page with usage, custom separator demo, composition guide, guidelines, accessibility, and props.

**Step 3: Commit**

```bash
git add src/primitives/breadcrumb.mdx
git commit -m "docs: add MDX documentation for Breadcrumb"
```

---

### Task 5: Verify Storybook build and lint

**Files:**
- None (verification only)

**Step 1: Run lint**

Run: `npm run lint`
Expected: No new errors. Fix with `npm run lint:write` if needed.

**Step 2: Run Storybook build**

Run: `npm run build:storybook`
Expected: Build succeeds without errors.

**Step 3: Commit any lint fixes**

```bash
git add -A
git commit -m "style: fix lint issues in Tier 2 docs"
```

Only commit if there were lint fixes. Skip if clean.
