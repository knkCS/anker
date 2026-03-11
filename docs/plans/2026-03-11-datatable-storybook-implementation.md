# DataTable Storybook Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Storybook stories and MDX documentation for the DataTable component.

**Architecture:** Create a stories file with 7 stories covering all DataTable features (default, sorting, selection, loading, empty, pagination, custom cells), plus a co-located MDX doc following the established pattern (description, usage, guidelines, accessibility, gaps & migration, props).

**Tech Stack:** Storybook 8, TanStack React Table, Chakra UI v3, TypeScript, MDX

---

### Task 1: Create DataTable stories file with shared data and Default story

**Files:**
- Create: `src/components/data-table/data-table.stories.tsx`

**Context:**
- The DataTable component lives at `src/components/data-table/data-table.tsx`
- It wraps TanStack React Table with sorting, selection, pagination, loading, and empty state support
- Follow the pattern from `src/components/modal.stories.tsx` and `src/components/card-list.stories.tsx`
- Use Biome formatting: tabs for indentation, double quotes for strings

**Step 1: Create the stories file with sample data and Default story**

```tsx
import type { ColumnDef } from "@tanstack/react-table";
import type { Meta, StoryObj } from "@storybook/react";
import { DataTable } from "./data-table";

type User = {
	id: string;
	name: string;
	email: string;
	role: string;
	status: string;
};

const sampleUsers: User[] = [
	{ id: "1", name: "Alice Johnson", email: "alice@example.com", role: "Admin", status: "Active" },
	{ id: "2", name: "Bob Smith", email: "bob@example.com", role: "Editor", status: "Active" },
	{ id: "3", name: "Charlie Lee", email: "charlie@example.com", role: "Viewer", status: "Inactive" },
	{ id: "4", name: "Diana Park", email: "diana@example.com", role: "Editor", status: "Active" },
	{ id: "5", name: "Eve Martinez", email: "eve@example.com", role: "Admin", status: "Pending" },
];

const baseColumns: ColumnDef<User, unknown>[] = [
	{ accessorKey: "name", header: "Name" },
	{ accessorKey: "email", header: "Email" },
	{ accessorKey: "role", header: "Role" },
	{ accessorKey: "status", header: "Status" },
];

const meta = {
	title: "Components/DataTable",
	component: DataTable,
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => <DataTable columns={baseColumns} data={sampleUsers} />,
};
```

**Step 2: Verify it renders in Storybook**

Run: `npm run dev`
Navigate to: Components > DataTable > Default
Expected: A table with 5 rows showing Name, Email, Role, Status columns.

**Step 3: Commit**

```bash
git add src/components/data-table/data-table.stories.tsx
git commit -m "docs: add DataTable stories with Default story"
```

---

### Task 2: Add Sorting, Selection, and Loading stories

**Files:**
- Modify: `src/components/data-table/data-table.stories.tsx`

**Context:**
- Sorting requires controlled `sorting` and `onSortingChange` state — use `useState` with `SortingState` from `@tanstack/react-table`
- Selection requires `selectable`, controlled `rowSelection` and `onRowSelectionChange` — use `useState` with `RowSelectionState`
- Loading just needs `loading={true}` prop
- Each story that needs state uses a wrapper component with `render: () => <Demo />` (see Modal stories pattern)

**Step 1: Add the three stories**

Add these imports at the top:

```tsx
import { useState } from "react";
import type { RowSelectionState, SortingState } from "@tanstack/react-table";
```

Add `enableSorting: true` to the name and role columns for the sorting story:

```tsx
const sortableColumns: ColumnDef<User, unknown>[] = [
	{ accessorKey: "name", header: "Name", enableSorting: true },
	{ accessorKey: "email", header: "Email" },
	{ accessorKey: "role", header: "Role", enableSorting: true },
	{ accessorKey: "status", header: "Status" },
];
```

Add the three stories after the Default story:

```tsx
const SortingDemo = () => {
	const [sorting, setSorting] = useState<SortingState>([]);
	return (
		<DataTable
			columns={sortableColumns}
			data={sampleUsers}
			sorting={sorting}
			onSortingChange={setSorting}
		/>
	);
};

export const Sorting: Story = {
	render: () => <SortingDemo />,
};

const SelectionDemo = () => {
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
	return (
		<DataTable
			columns={baseColumns}
			data={sampleUsers}
			selectable
			rowSelection={rowSelection}
			onRowSelectionChange={setRowSelection}
		/>
	);
};

export const Selection: Story = {
	render: () => <SelectionDemo />,
};

export const Loading: Story = {
	render: () => <DataTable columns={baseColumns} data={[]} loading />,
};
```

**Step 2: Verify in Storybook**

Run: `npm run dev`
- Sorting story: clicking Name/Role headers toggles sort arrows
- Selection story: checkboxes appear, select-all works
- Loading story: 5 skeleton rows, no data

**Step 3: Commit**

```bash
git add src/components/data-table/data-table.stories.tsx
git commit -m "docs: add Sorting, Selection, and Loading stories for DataTable"
```

---

### Task 3: Add Empty, Paginated, and CustomCells stories

**Files:**
- Modify: `src/components/data-table/data-table.stories.tsx`

**Context:**
- Empty story: `data={[]}` with custom `emptyState` ReactNode
- Paginated story: needs 25 rows of data, `pageSize=5`, controlled page state — simulate client-side pagination by slicing the data array
- CustomCells story: use custom `cell` renderers — a StatusBadge (from `../../atoms/status-badge`) and a formatted date string
- Import `Text` from Chakra for the empty state, `StatusBadge` from atoms

**Step 1: Add imports**

```tsx
import { Text } from "@chakra-ui/react";
import { StatusBadge } from "../../atoms/status-badge";
```

**Step 2: Create the paginated dataset**

```tsx
const paginatedUsers: User[] = Array.from({ length: 25 }, (_, i) => ({
	id: String(i + 1),
	name: `User ${String(i + 1)}`,
	email: `user${String(i + 1)}@example.com`,
	role: i % 3 === 0 ? "Admin" : i % 3 === 1 ? "Editor" : "Viewer",
	status: i % 4 === 0 ? "Inactive" : "Active",
}));
```

**Step 3: Add the three stories**

```tsx
export const Empty: Story = {
	render: () => (
		<DataTable
			columns={baseColumns}
			data={[]}
			emptyState={
				<Text color="fg.muted" fontSize="sm">
					No users found. Try adjusting your filters.
				</Text>
			}
		/>
	),
};

const PaginatedDemo = () => {
	const [page, setPage] = useState(1);
	const pageSize = 5;
	const pageData = paginatedUsers.slice((page - 1) * pageSize, page * pageSize);
	return (
		<DataTable
			columns={baseColumns}
			data={pageData}
			total={paginatedUsers.length}
			page={page}
			pageSize={pageSize}
			onPageChange={setPage}
		/>
	);
};

export const Paginated: Story = {
	render: () => <PaginatedDemo />,
};

const statusColors: Record<string, string> = {
	Active: "#16a34a",
	Inactive: "#dc2626",
	Pending: "#ca8a04",
};

const customCellColumns: ColumnDef<User, unknown>[] = [
	{ accessorKey: "name", header: "Name" },
	{ accessorKey: "email", header: "Email" },
	{ accessorKey: "role", header: "Role" },
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ getValue }) => {
			const status = getValue<string>();
			return <StatusBadge label={status} color={statusColors[status] ?? "#6b7280"} />;
		},
	},
];

export const CustomCells: Story = {
	render: () => <DataTable columns={customCellColumns} data={sampleUsers} />,
};
```

**Step 4: Verify in Storybook**

Run: `npm run dev`
- Empty story: shows "No users found" message
- Paginated story: 5 rows per page, 5 pages, navigation works
- CustomCells story: Status column shows colored badges

**Step 5: Commit**

```bash
git add src/components/data-table/data-table.stories.tsx
git commit -m "docs: add Empty, Paginated, and CustomCells stories for DataTable"
```

---

### Task 4: Create DataTable MDX documentation

**Files:**
- Create: `src/components/data-table/data-table.mdx`

**Context:**
- Follow the established MDX pattern from `src/components/modal.mdx` and `src/components/card-list.mdx`
- Import `Canvas`, `Meta`, `ArgTypes` from `@storybook/blocks`
- Import stories as `* as Stories from "./data-table.stories"`
- Use markdown tables (remark-gfm is configured)
- Sections: description, usage, guidelines, accessibility, gaps & migration, props

**Step 1: Create the MDX file**

```mdx
import { Canvas, Meta, ArgTypes } from "@storybook/blocks";
import * as Stories from "./data-table.stories";

<Meta of={Stories} />

# DataTable

A data-driven table for displaying, sorting, and selecting structured records. Built on TanStack React Table.

## Usage

<Canvas of={Stories.Default} />

## Guidelines

- **Do** use DataTable for data-heavy tables that need sorting, selection, or pagination.
- **Don't** use DataTable for simple record lists without interactivity — use `CardList` from `@knkcs/anker/components` instead.
- **Do** keep column definitions outside the component to avoid re-renders.
- **Don't** mix client-side and server-side sorting. If `onSortingChange` is provided, sorting is manual (server-side) — handle it in your data-fetching logic.
- Provide a custom `emptyState` for better UX when filters return no results.

## Sorting

<Canvas of={Stories.Sorting} />

Click column headers to toggle sort direction. Columns must have `enableSorting: true` in their definition. Provide controlled `sorting` and `onSortingChange` props.

## Selection

<Canvas of={Stories.Selection} />

Set `selectable` to add checkbox columns. Provide controlled `rowSelection` and `onRowSelectionChange` props. The header checkbox supports select-all and indeterminate states.

## Custom Cells

<Canvas of={Stories.CustomCells} />

Use the `cell` property in column definitions to render custom content. Any React component works — badges, icons, formatted values.

## Accessibility

- Sortable column headers have `aria-sort` (`ascending`, `descending`, or `none`).
- Sort icons use `aria-hidden="true"` — the sort state is conveyed via `aria-sort`.
- Selection checkboxes have `aria-label` for each row and the select-all header.
- Loading skeleton rows are marked `aria-hidden="true"`.

## Gaps & Migration

| Gap | Status | Notes |
|-----|--------|-------|
| Column filtering | Not yet | Filter UI and logic must be implemented externally. |
| Column resizing | Not yet | Not supported by the current wrapper. |
| Row virtualization | Not yet | For very large datasets. Consider `@tanstack/react-virtual`. |
| Row expansion | Not yet | Expandable row detail is not implemented. |
| Server-side sorting example | Gap | `onSortingChange` enables manual sorting, but no example docs for API integration. |
| Drag-and-drop row reorder | Not yet | Not available in anker yet. |

## Props

<ArgTypes of={Stories} />
```

**Step 2: Verify in Storybook**

Run: `npm run dev`
Navigate to: Components > DataTable > Docs
Expected: Full documentation page with description, live Canvas blocks, guidelines, accessibility notes, gaps table, and auto-generated props.

**Step 3: Commit**

```bash
git add src/components/data-table/data-table.mdx
git commit -m "docs: add MDX documentation for DataTable"
```

---

### Task 5: Verify Storybook build and lint

**Files:**
- None (verification only)

**Step 1: Run lint**

Run: `npm run lint`
Expected: No errors in the new files. If Biome reports formatting issues, fix with `npm run lint:write`.

**Step 2: Run Storybook build**

Run: `npm run build:storybook`
Expected: Build succeeds without errors.

**Step 3: Commit any lint fixes**

```bash
git add -A
git commit -m "style: fix lint issues in DataTable stories"
```

Only commit if there were lint fixes. Skip if clean.
