# Component Documentation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add autodocs + targeted MDX documentation to anker's Storybook for internal devs and new team members.

**Architecture:** Enable Storybook autodocs globally for baseline prop tables on every component. Add co-located MDX files for ~10 components that need guidelines, accessibility notes, and gaps/migration sections. Add an Introduction landing page and sidebar sort order.

**Tech Stack:** Storybook 8.4, @storybook/blocks (Canvas, ArgTypes, Meta), MDX, react-docgen-typescript

---

### Task 1: Enable Autodocs Globally

**Files:**
- Modify: `.storybook/main.ts`
- Modify: `.storybook/preview.tsx`

**Step 1: Add autodocs tag to preview.tsx**

In `.storybook/preview.tsx`, add `tags: ["autodocs"]` to the preview config:

```tsx
const preview: Preview = {
	decorators: [withChakra],
	tags: ["autodocs"],
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
};
```

**Step 2: Verify autodocs works**

Run: `npm run dev`

Open Storybook in browser. Navigate to any component (e.g., Primitives/Alert). Verify there is now a "Docs" tab alongside the "Canvas" tab. The Docs tab should show a description area, the primary story rendered, and an auto-generated props table.

**Step 3: Commit**

```bash
git add .storybook/preview.tsx
git commit -m "feat(docs): enable autodocs globally in Storybook"
```

---

### Task 2: Configure Sidebar Sort Order

**Files:**
- Modify: `.storybook/preview.tsx`

**Step 1: Add storySort parameter**

In `.storybook/preview.tsx`, add a `storySort` option inside `parameters.options`:

```tsx
const preview: Preview = {
	decorators: [withChakra],
	tags: ["autodocs"],
	parameters: {
		options: {
			storySort: {
				order: [
					"Introduction",
					"Primitives",
					"Components",
					"Atoms",
					"Forms",
					"Feedback",
				],
			},
		},
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
};
```

**Step 2: Verify sidebar order**

Run: `npm run dev`

Open Storybook. The sidebar should now show categories in order: Primitives, Components, Atoms, Forms, Feedback. (Introduction will appear once we create it in Task 4.)

**Step 3: Commit**

```bash
git add .storybook/preview.tsx
git commit -m "feat(docs): configure sidebar sort order by layer"
```

---

### Task 3: Add Missing JSDoc to Key Props Interfaces

Add JSDoc comments to props interfaces that are missing them, focusing on components that will get MDX docs (Tier 1) and any primitives with custom props. Do NOT touch Chakra pass-through type aliases — they inherit docs from Chakra.

**Files:**
- Modify: `src/components/card-list.tsx` — Add JSDoc to `headers`, `hasComponentLeft`, `hasMenu`, `children`
- Modify: `src/components/card-list-item.tsx` — Add JSDoc to all props
- Modify: `src/components/card-list-data.tsx` — Add JSDoc to all props
- Modify: `src/components/drawer.tsx` — Add JSDoc to `open`, `onClose`, `title`, `footerText`, `children`, `saveLabel`, `closeLabel`, `saveButtonDisabled`, `additionalButtons`, `onSave`
- Modify: `src/feedback/confirm-modal.tsx` — Add JSDoc to `ConfirmOptions` props (`title`, `message`, `confirmLabel`, `cancelLabel`, `colorPalette`, `beforeConfirmActions`)
- Modify: `src/primitives/avatar.tsx` — Add JSDoc to custom props
- Modify: `src/primitives/switch.tsx` — Add JSDoc to custom props
- Modify: `src/primitives/radio.tsx` — Add JSDoc to custom props
- Modify: `src/primitives/menu.tsx` — Add JSDoc to custom props on MenuContentProps, MenuTriggerItemProps

**Step 1: Add JSDoc comments**

For each file, add `/** ... */` comments above each prop in the interface. Follow the existing pattern used in `ModalProps`:

```tsx
export interface CardListProps {
	/** Column header labels displayed above the grid. */
	headers: string[];
	/** Whether rows have a left-side component slot (e.g., avatar). */
	hasComponentLeft?: boolean;
	/** Whether rows have a right-side menu slot. */
	hasMenu?: boolean;
	/** CardListItem children to render as rows. */
	children?: React.ReactNode;
	/** Total number of grid columns. Defaults to 12. */
	columnCount?: number;
	/** Content to display when there are no rows. */
	emptyState?: React.ReactNode;
}
```

```tsx
export interface DrawerProps
	extends Omit<DrawerRootProps, "open" | "onOpenChange"> {
	/** Whether the drawer is open. */
	open: boolean;
	/** Called when the drawer should close. */
	onClose(): void;
	/** Header title content. */
	title: string | React.ReactNode;
	/** Text displayed in the footer area (left side). */
	footerText?: string | React.ReactNode;
	/** Drawer body content. */
	children: React.ReactNode;
	/** Label for the save button. @default "Save" */
	saveLabel?: string;
	/** Label for the close button. @default "Close" */
	closeLabel?: string;
	/** Whether the save button is disabled. */
	saveButtonDisabled?: boolean;
	/** Whether the save action is in progress. Shows spinner on save button. */
	loading?: boolean;
	/** Extra buttons rendered before the save button. */
	additionalButtons?: React.ReactNode;
	/** Called when the save button is clicked. If not provided, no save button is shown. */
	onSave?(): void;
}
```

```tsx
export interface ConfirmOptions {
	/** Dialog title text. */
	title: string;
	/** Dialog body content. */
	message: React.ReactNode;
	/** Label for the confirm button. @default "Confirm" */
	confirmLabel?: string;
	/** Label for the cancel button. @default "Cancel" */
	cancelLabel?: string;
	/** Color palette for the confirm button. @default "red" */
	colorPalette?: ButtonProps["colorPalette"];
	/** Extra actions rendered before the confirm button. */
	beforeConfirmActions?: React.ReactNode;
}
```

Apply similar JSDoc patterns to the remaining files listed above.

**Step 2: Verify docs render**

Run: `npm run dev`

Open Storybook, navigate to Components/Drawer Docs tab. Verify the ArgTypes table shows the JSDoc descriptions.

**Step 3: Commit**

```bash
git add src/components/card-list.tsx src/components/card-list-item.tsx src/components/card-list-data.tsx src/components/drawer.tsx src/feedback/confirm-modal.tsx src/primitives/avatar.tsx src/primitives/switch.tsx src/primitives/radio.tsx src/primitives/menu.tsx
git commit -m "docs: add JSDoc comments to props interfaces for autodocs"
```

---

### Task 4: Create Introduction Page

**Files:**
- Create: `src/introduction.mdx`

**Step 1: Create the introduction MDX file**

```mdx
import { Meta } from "@storybook/blocks";

<Meta title="Introduction" />

# Anker UI Library

Anker is the shared UI component library for the **knk software group**, built on Chakra UI v3, React 19, and TypeScript.

## Installation

```bash
npm install @knkcs/anker
```

## Architecture

The library is organized in six layers, each available as a subpath export:

| Layer | Import | Description |
|-------|--------|-------------|
| **Theme** | `@knkcs/anker/theme` | Design tokens, color scales, semantic tokens, component recipes |
| **Primitives** | `@knkcs/anker/primitives` | Thin wrappers around Chakra UI with consistent defaults |
| **Components** | `@knkcs/anker/components` | Higher-level composites (Modal, Drawer, CardList, Stepper) |
| **Atoms** | `@knkcs/anker/atoms` | Small reusable units (Persona, StatusBadge, Select, Clipboard) |
| **Forms** | `@knkcs/anker/forms` | Form controls built on React Hook Form + Zod |
| **Feedback** | `@knkcs/anker/feedback` | Feedback patterns (ConfirmModal with provider + hook) |

## Quick Start

```tsx
import { Provider } from "@knkcs/anker/primitives";
import { Modal } from "@knkcs/anker/components";
import { InputField } from "@knkcs/anker/forms";
```

Wrap your app with the Provider:

```tsx
import { Provider } from "@knkcs/anker/primitives";

function App() {
  return (
    <Provider>
      {/* your app */}
    </Provider>
  );
}
```

## Key Conventions

- **Icons**: Lucide React exclusively — no FontAwesome
- **Forms**: React Hook Form + Zod — no Formik/Yup
- **Styling**: Semantic tokens (`bg-canvas`, `accent`, `border`) — no hardcoded colors
- **Strings**: All user-facing text is passed via props with English defaults — no i18n keys
- **Accessibility**: ARIA attributes on all interactive components, 44×44px minimum touch targets
```

**Step 2: Verify the page renders**

Run: `npm run dev`

Open Storybook. "Introduction" should appear at the top of the sidebar. Click it and verify it renders the content.

**Step 3: Commit**

```bash
git add src/introduction.mdx
git commit -m "docs: add Introduction landing page to Storybook"
```

---

### Task 5: MDX — Modal

**Files:**
- Create: `src/components/modal.mdx`

**Step 1: Create the MDX file**

```mdx
import { Canvas, Meta, ArgTypes } from "@storybook/blocks";
import * as Stories from "./modal.stories";

<Meta of={Stories} />

# Modal

A dialog overlay for focused user interactions — confirmations, forms, detail views.

## Usage

<Canvas of={Stories.Default} />

## Guidelines

- **Do** use Modal for actions requiring user focus: confirmations, multi-field forms, detail editing.
- **Don't** use Modal for simple alerts or confirmations — use `ConfirmModal` from `@knkcs/anker/feedback` instead.
- **Don't** nest modals. If you need a confirmation inside a modal, use `useConfirmModal`.
- Keep modal content concise. If content exceeds the viewport, consider using a Drawer instead.
- Provide `onSave` to get the default Cancel/Save footer. Pass `footer` for full custom control.

## Accessibility

- Traps focus inside the modal while open.
- `Escape` key closes the modal.
- Close button has a configurable `closeLabel` (defaults to "Close").
- Uses Chakra's `Dialog` with `Portal` — renders outside the DOM hierarchy.

## Gaps & Migration

| Gap | Status | Notes |
|-----|--------|-------|
| Form integration via render prop | Not planned | Pass form content as `children` instead. Manage form state externally with React Hook Form. |
| Nested modals | Not supported | Use `useConfirmModal` for confirmations within a modal. |
| `onSave` async support (auto-loading) | Not yet | Set `loading` prop manually from your mutation state. |
| Full-screen variant | Not yet | Use `size="full"` from Chakra — not exposed as a named prop. |

## Props

<ArgTypes of={Stories} />
```

**Step 2: Verify**

Run: `npm run dev`

Open Storybook → Components/Modal → Docs tab. Should show the MDX content with embedded story and props table.

**Step 3: Commit**

```bash
git add src/components/modal.mdx
git commit -m "docs: add MDX documentation for Modal"
```

---

### Task 6: MDX — Drawer

**Files:**
- Create: `src/components/drawer.mdx`

**Step 1: Create the MDX file**

```mdx
import { Canvas, Meta, ArgTypes } from "@storybook/blocks";
import * as Stories from "./drawer.stories";

<Meta of={Stories} />

# Drawer

A panel that slides in from the edge of the screen for secondary content, forms, or detail views.

## Usage

<Canvas of={Stories.Default} />

## Guidelines

- **Do** use Drawer for editing detail records, secondary forms, or content that benefits from staying in context.
- **Don't** use Drawer for quick confirmations — use `ConfirmModal` instead.
- Drawer is better than Modal when the content may be long or when the user needs to reference the page behind it.
- Provide `onSave` to get the save button in the footer. Omit it for read-only drawers.
- Use `additionalButtons` for extra actions like "Delete" or "Reset" alongside the save button.

## Accessibility

- Traps focus while open.
- `Escape` key closes the drawer.
- Close button uses `closeLabel` as `aria-label` (defaults to "Close").
- Uses RTL-safe `insetInlineEnd` for close button positioning.

## Gaps & Migration

| Gap | Status | Notes |
|-----|--------|-------|
| Left-side placement | Not yet | Chakra supports `placement="start"` but it's not exposed as a prop. Pass it via rest props. |
| Custom width / size variants | Not yet | Uses Chakra's default drawer sizing. Override via `size` rest prop. |
| Cancel button in footer | Not included | Only save button shown. Use `additionalButtons` or `footerText` for cancel. |

## Props

<ArgTypes of={Stories} />
```

**Step 2: Verify**

Run: `npm run dev` → Components/Drawer → Docs tab.

**Step 3: Commit**

```bash
git add src/components/drawer.mdx
git commit -m "docs: add MDX documentation for Drawer"
```

---

### Task 7: MDX — CardList

**Files:**
- Create: `src/components/card-list.mdx`

**Step 1: Create the MDX file**

```mdx
import { Canvas, Meta, ArgTypes } from "@storybook/blocks";
import * as Stories from "./card-list.stories";

<Meta of={Stories} />

# CardList

A grid-based list for displaying structured records as rows with column headers. Formerly known as `Table`.

## Usage

<Canvas of={Stories.Default} />

## Guidelines

- **Do** use CardList for displaying lists of records with consistent column layouts (e.g., user lists, role lists).
- **Don't** use CardList for data-heavy tables with sorting/filtering — use `DataTable` instead.
- Use `hasComponentLeft` when rows start with an avatar or icon.
- Use `hasMenu` when rows have a kebab/action menu on the right.
- Provide `emptyState` for zero-result scenarios.

## Composition

CardList uses three components together:

- **`CardList`** — The container with headers and grid layout.
- **`CardListItem`** — A single row. Accepts `onClick`, `isSelected`, menu items, and a left component slot.
- **`CardListData`** — A cell within a row. Uses `colSpan` for grid sizing.

## Accessibility

- Root element has `role="grid"` and `aria-colcount`.
- Headers have `role="columnheader"`.
- Rows are clickable with `role="row"`.

## Gaps & Migration

| Gap | Status | Notes |
|-----|--------|-------|
| Sorting by column | Not supported | Use `DataTable` for sortable columns. |
| Pagination built-in | Not included | Combine with `Pagination` component below the list. |
| Drag-and-drop reorder | Not yet | Not available in anker yet. |
| `Table` import name | Deprecated | `Table`, `TableItem`, `TableData` still work as re-exports but will be removed. Migrate to `CardList`, `CardListItem`, `CardListData`. |

## Props

### CardList

<ArgTypes of={Stories} />
```

**Step 2: Verify**

Run: `npm run dev` → Components/CardList → Docs tab.

**Step 3: Commit**

```bash
git add src/components/card-list.mdx
git commit -m "docs: add MDX documentation for CardList"
```

---

### Task 8: MDX — Pagination

**Files:**
- Create: `src/components/pagination.mdx`

**Step 1: Create the MDX file**

```mdx
import { Canvas, Meta, ArgTypes } from "@storybook/blocks";
import * as Stories from "./pagination.stories";

<Meta of={Stories} />

# Pagination

A page navigation control for server-paginated data. Custom component — no Chakra equivalent.

## Usage

<Canvas of={Stories.Default} />

## Guidelines

- **Do** use Pagination for server-paginated lists with a known total item count.
- **Don't** use for infinite scroll or client-side filtering/sorting.
- Pair with a page-size selector (`Select` atom) when datasets are large.
- `page` is 1-based. The component clamps it to valid range internally.
- Use `maxVisiblePages` to control how many page buttons show before ellipsis appears. Default is 5.

## Accessibility

- Active page has `aria-current="page"`.
- Previous/Next buttons have configurable `aria-label` via `previousLabel`/`nextLabel` props.
- Disabled state is set on Previous when on page 1, on Next when on last page.

## Gaps & Migration

| Gap | Status | Notes |
|-----|--------|-------|
| `onPageSizeChange` callback | Not yet | Core had a built-in page size dropdown. Handle page size externally with a `Select`. |
| Keyboard arrow navigation between page buttons | Not supported | Tab navigation works. |
| "Go to page" input | Not planned | Use the page buttons or build a custom input alongside. |
| Compact variant for mobile | Not yet | Shows full page buttons on all screen sizes. |

## Props

<ArgTypes of={Stories} />
```

**Step 2: Verify**

Run: `npm run dev` → Components/Pagination → Docs tab.

**Step 3: Commit**

```bash
git add src/components/pagination.mdx
git commit -m "docs: add MDX documentation for Pagination"
```

---

### Task 9: MDX — Stepper

**Files:**
- Create: `src/components/stepper/stepper.mdx`

**Step 1: Create the MDX file**

```mdx
import { Canvas, Meta, ArgTypes } from "@storybook/blocks";
import * as Stories from "./stepper.stories";

<Meta of={Stories} />

# Stepper

A multi-step wizard for guiding users through sequential workflows — forms, onboarding, configuration.

## Usage

<Canvas of={Stories.Default} />

## Guidelines

- **Do** use Stepper for multi-step forms or workflows where steps are sequential and progress should be visible.
- **Don't** use Stepper for tabbed content where order doesn't matter — use Tabs instead.
- Each step gets a `StepperStep` with a `title` (and optional `description`).
- Step content goes inside `StepperStepContent`. Only the active step's content is visible.
- Use the `useStepper` hook to control navigation programmatically.
- Use `useStepperNextButton` and `useStepperPrevButton` hooks for navigation button props.

## Hook API

```tsx
import { useStepper, useStepperNextButton, useStepperPrevButton } from "@knkcs/anker/components";

const stepper = useStepper({ stepCount: 3 });
const nextProps = useStepperNextButton(); // { onClick, disabled }
const prevProps = useStepperPrevButton(); // { onClick, disabled }
```

## Accessibility

- Active step uses `aria-current="step"`.
- Steps show check icons when completed.
- Collapsible animation on step content transitions.

## Gaps & Migration

| Gap | Status | Notes |
|-----|--------|-------|
| Non-linear navigation (click any step) | Not yet | Steps are sequential only. Users can go back but not skip ahead. |
| Async validation before next step | Not built-in | Validate in your `onNext` handler and conditionally call `stepper.next()`. |
| Vertical orientation | Not yet | Horizontal layout only. |
| Step error state | Not yet | No visual error indicator on individual steps. |

## Props

<ArgTypes of={Stories} />
```

**Step 2: Verify**

Run: `npm run dev` → Components/Stepper → Docs tab.

**Step 3: Commit**

```bash
git add src/components/stepper/stepper.mdx
git commit -m "docs: add MDX documentation for Stepper"
```

---

### Task 10: MDX — ConfirmModal

**Files:**
- Create: `src/feedback/confirm-modal.mdx`

**Step 1: Create the MDX file**

```mdx
import { Canvas, Meta, ArgTypes } from "@storybook/blocks";
import * as Stories from "./confirm-modal.stories";

<Meta of={Stories} />

# ConfirmModal

A promise-based confirmation dialog driven by a provider + hook pattern. Wrap your app with `ConfirmModalProvider`, then call `useConfirmModal()` anywhere.

## Usage

<Canvas of={Stories.Default} />

## Setup

Wrap your app (or a subtree) with the provider:

```tsx
import { ConfirmModalProvider } from "@knkcs/anker/feedback";

function App() {
  return (
    <ConfirmModalProvider>
      {/* your app */}
    </ConfirmModalProvider>
  );
}
```

Then use the hook in any component:

```tsx
import { useConfirmModal } from "@knkcs/anker/feedback";

function DeleteButton() {
  const { confirm } = useConfirmModal();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete item?",
      message: "This action cannot be undone.",
      confirmLabel: "Delete",
      colorPalette: "red",
    });
    if (confirmed) {
      // perform delete
    }
  };

  return <Button onClick={handleDelete}>Delete</Button>;
}
```

## Guidelines

- **Do** use ConfirmModal for destructive actions (delete, discard changes, revoke access).
- **Do** use inside modals/drawers — it renders its own portal, no nesting issues.
- **Don't** use for informational alerts. Use `Alert` primitive instead.
- Set `colorPalette="red"` for destructive confirmations (default).
- Use `beforeConfirmActions` to add extra buttons (e.g., "Delete and notify").

## Accessibility

- Uses `role="alertdialog"` for screen reader announcement.
- Initial focus is on the Cancel button (safe default for destructive actions).
- `Escape` key dismisses and resolves `false`.

## Gaps & Migration

| Gap | Status | Notes |
|-----|--------|-------|
| Async confirm handler (loading state) | Not yet | `confirm()` resolves immediately. Handle loading in the caller. |
| Custom body content (forms, checkboxes) | Partial | `message` accepts ReactNode, but no built-in form support. |
| Multiple concurrent confirmations | Not supported | Only one confirmation dialog at a time. |
| Non-destructive variant (info confirm) | Supported | Set `colorPalette="primary"` for non-destructive confirmation. |

## Props (ConfirmOptions)

<ArgTypes of={Stories} />
```

**Step 2: Verify**

Run: `npm run dev` → Feedback/ConfirmModal → Docs tab.

**Step 3: Commit**

```bash
git add src/feedback/confirm-modal.mdx
git commit -m "docs: add MDX documentation for ConfirmModal"
```

---

### Task 11: MDX — Popover / HoverCard / Tooltip

Group these three portal-pattern components into one MDX since the main value is explaining when to use which.

**Files:**
- Create: `src/primitives/popover.mdx`

**Step 1: Create the MDX file**

```mdx
import { Canvas, Meta } from "@storybook/blocks";
import * as PopoverStories from "./popover.stories";
import * as HoverCardStories from "./hover-card.stories";
import * as TooltipStories from "./tooltip.stories";

<Meta title="Primitives/Popover, HoverCard & Tooltip" />

# Popover, HoverCard & Tooltip

Three overlay components for contextual content. Each serves a different purpose.

## When to Use Which

| Component | Trigger | Content | Use Case |
|-----------|---------|---------|----------|
| **Tooltip** | Hover/focus | Text only, brief | Icon button labels, abbreviation explanations |
| **HoverCard** | Hover | Rich content | User profile previews, link previews |
| **Popover** | Click | Interactive content | Menus, forms, pickers, multi-action panels |

## Tooltip

<Canvas of={TooltipStories.Default} />

Short text label on hover/focus. No interactive content.

## HoverCard

<Canvas of={HoverCardStories.Default} />

Rich preview on hover. Supports arrow, portal, and custom content.

## Popover

<Canvas of={PopoverStories.Default} />

Interactive content on click. Supports header, body, footer, close trigger.

## Common Pattern

All three use the portal pattern:

```
Root → Portal → Positioner → Content (with optional Arrow)
```

Anker wraps this into simplified APIs:
- `Tooltip` — `content` prop, renders text
- `HoverCard` — `Trigger` + `HoverCardContent` wrapper
- `Popover` — `Trigger` + `PopoverContent` wrapper with sub-components (Header, Body, Footer)

## Gaps & Migration

| Gap | Status | Notes |
|-----|--------|-------|
| Controlled open state for Tooltip | Supported | Pass `open` and `onOpenChange` via rest props. |
| Popover form integration | Supported | Put form content inside `PopoverBody`. |
| HoverCard delay customization | Supported | Pass `openDelay`/`closeDelay` via rest props. |
| Tooltip on disabled buttons | Workaround | Wrap disabled button in a `<span>` — disabled elements don't fire hover events. |
```

**Step 2: Verify**

Run: `npm run dev` → Primitives/Popover, HoverCard & Tooltip → Docs tab.

**Step 3: Commit**

```bash
git add src/primitives/popover.mdx
git commit -m "docs: add MDX documentation for Popover, HoverCard & Tooltip"
```

---

### Task 12: MDX — TreeView

**Files:**
- Create: `src/components/tree-view.mdx`

**Step 1: Create the MDX file**

```mdx
import { Canvas, Meta, ArgTypes } from "@storybook/blocks";
import * as Stories from "./tree-view.stories";

<Meta of={Stories} />

# TreeView

A hierarchical tree for displaying nested data — file explorers, org charts, category trees.

## Usage

<Canvas of={Stories.Default} />

## Data-Driven API

TreeView uses Chakra's `createTreeCollection` to define the tree structure, then `TreeViewNode` to render nodes:

```tsx
import { createTreeCollection } from "@chakra-ui/react";
import { TreeViewRoot, TreeViewTree, TreeViewNode } from "@knkcs/anker/components";

const collection = createTreeCollection({
  nodeToValue: (node) => node.id,
  nodeToString: (node) => node.name,
  rootNode: {
    id: "ROOT",
    name: "",
    children: [
      { id: "file-1", name: "readme.md" },
      {
        id: "folder-1",
        name: "src",
        children: [{ id: "file-2", name: "index.ts" }],
      },
    ],
  },
});
```

Then render with `TreeViewNode`:

```tsx
<TreeViewRoot collection={collection}>
  <TreeViewTree>
    <TreeViewNode
      render={({ node, nodeState }) =>
        nodeState.isBranch ? (
          <TreeViewBranchControl>
            <TreeViewBranchIndicator><ChevronRight /></TreeViewBranchIndicator>
            <TreeViewBranchText>{node.name}</TreeViewBranchText>
          </TreeViewBranchControl>
        ) : (
          <TreeViewItem>
            <TreeViewItemText>{node.name}</TreeViewItemText>
          </TreeViewItem>
        )
      }
    />
  </TreeViewTree>
</TreeViewRoot>
```

## Guidelines

- **Do** use the data-driven API with `createTreeCollection` + `TreeViewNode`. This is the correct Chakra v3 pattern.
- **Don't** compose `TreeViewBranch` / `TreeViewItem` manually without `TreeViewNodeProvider` — it will crash with a missing context error.
- Use `nodeState.isBranch` in the render function to differentiate folders from files.

## Gaps & Migration

| Gap | Status | Notes |
|-----|--------|-------|
| Checkbox selection | Exported | Use `TreeViewNodeCheckbox` for multi-select trees. |
| Drag-and-drop reorder | Not supported | Not available in Chakra's TreeView. |
| Lazy loading children | Not built-in | Manage loading state externally and update the collection. |
| Search/filter | Not built-in | Filter the collection data before passing to `createTreeCollection`. |

## Props

<ArgTypes of={Stories} />
```

**Step 2: Verify**

Run: `npm run dev` → Components/TreeView → Docs tab.

**Step 3: Commit**

```bash
git add src/components/tree-view.mdx
git commit -m "docs: add MDX documentation for TreeView"
```

---

### Task 13: Run Final Verification

**Step 1: Run lint**

```bash
npm run lint
```

Expected: No new errors. Only the 16 pre-existing `noExplicitAny` warnings.

**Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: Clean pass.

**Step 3: Verify all MDX pages render**

Run: `npm run dev`

Check each MDX docs page in Storybook:
- Introduction (top of sidebar)
- Components/Modal → Docs tab
- Components/Drawer → Docs tab
- Components/CardList → Docs tab
- Components/Pagination → Docs tab
- Components/Stepper → Docs tab
- Components/TreeView → Docs tab
- Feedback/ConfirmModal → Docs tab
- Primitives/Popover, HoverCard & Tooltip → Docs tab

Verify each page shows: narrative content, embedded stories via Canvas, and props table via ArgTypes.

**Step 4: Verify autodocs on a component without MDX**

Navigate to Primitives/Alert → Docs tab. Should show auto-generated docs with stories and props table.

**Step 5: Commit any remaining fixes**

If any issues found, fix and commit.
