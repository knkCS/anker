# DataTable Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 8 issues in DataTable: unstable column references, missing getRowId, wasteful getSortedRowModel, keyboard a11y gaps, missing tests, and stories not demonstrating best practices.

**Architecture:** All core fixes go into `data-table.tsx` in a single task (they're tightly coupled — memoization, getRowId, and keyboard a11y all touch the same `useReactTable` config and JSX). Tests and stories are separate tasks. Each fix gets its own commit to close its GitHub issue.

**Tech Stack:** TanStack React Table v8, Chakra UI v3, Vitest, Storybook

**Spec:** `docs/superpowers/specs/2026-03-25-datatable-hardening-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/data-table/data-table.tsx` | Modify | Fixes #22, #23, #24, #25, #27, #28 |
| `src/components/data-table/__tests__/data-table.test.tsx` | Modify | Fix #29 |
| `src/components/data-table/data-table.stories.tsx` | Modify | Fix #30 |

---

### Task 1: Core DataTable fixes

Apply 6 fixes to `data-table.tsx`, each committed separately.

**Files:**
- Modify: `src/components/data-table/data-table.tsx`

- [ ] **Step 1: Add `getRowId` prop (#22)**

In the imports, add `type Row` to the TanStack import block:

```tsx
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	type OnChangeFn,
	type Row,
	type RowSelectionState,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
```

Add to `DataTableProps<T>` (after the `onPageChange` prop):

```tsx
/** Custom row ID extractor for stable selection across data changes. @default row index */
getRowId?: (originalRow: T, index: number, parent?: Row<T>) => string;
```

Destructure it in the component:

```tsx
const {
	// ...existing props...
	getRowId,
} = props;
```

Pass it to `useReactTable`:

```tsx
const table = useReactTable({
	data,
	columns: allColumns,
	getRowId,
	// ...rest unchanged...
});
```

Run: `npm run typecheck`
Expected: No errors

```bash
git add src/components/data-table/data-table.tsx
git commit -m "feat(components): add getRowId prop to DataTable for stable row selection

Closes #22"
```

- [ ] **Step 2: Memoize selectionColumn and allColumns (#24)**

Add `useMemo` to the React import:

```tsx
import type React from "react";
import { useMemo } from "react";
```

Replace the current `selectionColumn` const (lines 73–107) and `allColumns` (line 109) with:

```tsx
const selectionColumn = useMemo<ColumnDef<T, unknown>>(
	() => ({
		id: "_select",
		header: ({ table }) => (
			<Checkbox.Root
				checked={
					table.getIsAllPageRowsSelected()
						? true
						: table.getIsSomePageRowsSelected()
							? "indeterminate"
							: false
				}
				onCheckedChange={(details) =>
					table.toggleAllPageRowsSelected(!!details.checked)
				}
				aria-label="Select all rows"
				size="sm"
			>
				<Checkbox.HiddenInput />
				<Checkbox.Control />
			</Checkbox.Root>
		),
		cell: ({ row }) => (
			<Checkbox.Root
				checked={row.getIsSelected()}
				onCheckedChange={(details) => row.toggleSelected(!!details.checked)}
				aria-label={`Select row ${String(row.index + 1)}`}
				size="sm"
				onClick={(e) => e.stopPropagation()}
			>
				<Checkbox.HiddenInput />
				<Checkbox.Control />
			</Checkbox.Root>
		),
		enableSorting: false,
	}),
	[],
);

const allColumns = useMemo(
	() => (selectable ? [selectionColumn, ...columns] : columns),
	[selectable, selectionColumn, columns],
);
```

Run: `npm run typecheck`
Expected: No errors

```bash
git add src/components/data-table/data-table.tsx
git commit -m "perf(components): memoize DataTable selection column and allColumns

Prevents unnecessary TanStack column reprocessing on every render.

Closes #24"
```

- [ ] **Step 3: Conditional getSortedRowModel (#23)**

Replace line 121:

```tsx
getSortedRowModel: getSortedRowModel(),
```

With:

```tsx
...(onSortingChange === undefined
	? { getSortedRowModel: getSortedRowModel() }
	: {}),
```

Run: `npm run typecheck`
Expected: No errors

```bash
git add src/components/data-table/data-table.tsx
git commit -m "perf(components): only register getSortedRowModel when not in manual sort mode

Closes #23"
```

- [ ] **Step 4: Keyboard a11y for sortable headers (#27)**

On the `Table.ColumnHeader` element (around line 148), add after the existing `userSelect` prop:

```tsx
tabIndex={canSort ? 0 : undefined}
role={canSort ? "button" : undefined}
onKeyDown={
	canSort
		? (e: React.KeyboardEvent) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					header.column.getToggleSortingHandler()?.(e);
				}
			}
		: undefined
}
```

Run: `npm run typecheck`
Expected: No errors

```bash
git add src/components/data-table/data-table.tsx
git commit -m "fix(components): add keyboard accessibility to sortable DataTable headers

Closes #27"
```

- [ ] **Step 5: Keyboard a11y for clickable rows (#28)**

On the `Table.Row` element for data rows (around line 203), add after the existing `onClick` prop:

```tsx
tabIndex={onRowClick ? 0 : undefined}
role={onRowClick ? "button" : undefined}
onKeyDown={
	onRowClick
		? (e: React.KeyboardEvent) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onRowClick(row.original);
				}
			}
		: undefined
}
```

Run: `npm run typecheck`
Expected: No errors

```bash
git add src/components/data-table/data-table.tsx
git commit -m "fix(components): add keyboard accessibility to clickable DataTable rows

Closes #28"
```

- [ ] **Step 6: Improve variant type cast comment (#25)**

Replace the existing comment above `Table.Root` (lines 137–138):

```tsx
{/* The custom theme extends the table recipe with additional variants
    (striped, hoverable) beyond Chakra's built-in types */}
```

With:

```tsx
{/* Chakra v3's Table.Root types only include built-in variants.
    Our custom table recipe adds "striped" and "hoverable" variants
    that work at runtime but require a type cast. Module augmentation
    for slot recipe variants is not supported in Chakra v3. */}
```

Run: `npm run typecheck && npm run lint && npm run build`
Expected: All pass

```bash
git add src/components/data-table/data-table.tsx
git commit -m "docs(components): improve DataTable variant type cast explanation

Closes #25"
```

---

### Task 2: Add sorting and selection tests (#29)

**Files:**
- Modify: `src/components/data-table/__tests__/data-table.test.tsx`

- [ ] **Step 1: Add sorting test**

Add a new test after the existing "handles row click" test:

```tsx
it("calls onSortingChange when a sortable header is clicked", async () => {
	const handleSortingChange = vi.fn();
	const user = userEvent.setup();
	const sortableColumns: DataTableProps<SampleRow>["columns"] = [
		{ accessorKey: "name", header: "Name", enableSorting: true },
		{ accessorKey: "age", header: "Age" },
	];

	renderWithChakra(
		<DataTable
			columns={sortableColumns}
			data={sampleData}
			sorting={[]}
			onSortingChange={handleSortingChange}
		/>,
	);

	await user.click(screen.getByText("Name"));
	expect(handleSortingChange).toHaveBeenCalled();
});
```

- [ ] **Step 2: Add selection test**

```tsx
it("calls onRowSelectionChange when a row checkbox is clicked", async () => {
	const handleSelectionChange = vi.fn();
	const user = userEvent.setup();

	renderWithChakra(
		<DataTable
			columns={sampleColumns}
			data={sampleData}
			selectable
			rowSelection={{}}
			onRowSelectionChange={handleSelectionChange}
		/>,
	);

	const checkboxes = screen.getAllByRole("checkbox");
	// First checkbox is select-all, rest are per-row
	await user.click(checkboxes[1]);
	expect(handleSelectionChange).toHaveBeenCalled();
});
```

- [ ] **Step 3: Add getRowId test**

```tsx
it("uses getRowId for stable row identity", () => {
	renderWithChakra(
		<DataTable
			columns={sampleColumns}
			data={sampleData}
			selectable
			rowSelection={{ "1": true }}
			onRowSelectionChange={vi.fn()}
			getRowId={(row) => row.id}
		/>,
	);

	const checkboxes = screen.getAllByRole("checkbox");
	// Row with id="1" (Alice) should be selected
	expect(checkboxes[1]).toBeChecked();
});
```

- [ ] **Step 4: Run tests**

Run: `npm run test`
Expected: All tests pass (existing + 3 new)

- [ ] **Step 5: Commit**

```bash
git add src/components/data-table/__tests__/data-table.test.tsx
git commit -m "test(components): add sorting, selection, and getRowId tests for DataTable

Closes #29"
```

---

### Task 3: Update stories to use createColumnHelper (#30)

**Files:**
- Modify: `src/components/data-table/data-table.stories.tsx`

- [ ] **Step 1: Refactor stories**

Read `src/components/data-table/data-table.stories.tsx`. Replace the inline `ColumnDef<User, unknown>[]` arrays with `createColumnHelper<User>()`:

Add import:
```tsx
import { createColumnHelper } from "@tanstack/react-table";
```

Replace `baseColumns`:
```tsx
const columnHelper = createColumnHelper<User>();

const baseColumns = [
	columnHelper.accessor("name", { header: "Name" }),
	columnHelper.accessor("email", { header: "Email" }),
	columnHelper.accessor("role", { header: "Role" }),
	columnHelper.accessor("status", { header: "Status" }),
];
```

Replace `sortableColumns`:
```tsx
const sortableColumns = [
	columnHelper.accessor("name", { header: "Name", enableSorting: true }),
	columnHelper.accessor("email", { header: "Email" }),
	columnHelper.accessor("role", { header: "Role", enableSorting: true }),
	columnHelper.accessor("status", { header: "Status" }),
];
```

Replace `customCellColumns`:
```tsx
const customCellColumns = [
	columnHelper.accessor("name", { header: "Name" }),
	columnHelper.accessor("email", { header: "Email" }),
	columnHelper.accessor("role", { header: "Role" }),
	columnHelper.accessor("status", {
		header: "Status",
		cell: (info) => {
			const status = info.getValue();
			return (
				<StatusBadge label={status} color={statusColors[status] ?? "#6b7280"} />
			);
		},
	}),
];
```

Remove the unused `ColumnDef` type import (only `RowSelectionState` and `SortingState` should remain).

- [ ] **Step 2: Run verification**

Run:
1. `npm run typecheck` — no errors
2. `npm run lint` — no new errors
3. `npm run build` — success
4. `npm run test` — all pass

- [ ] **Step 3: Commit**

```bash
git add src/components/data-table/data-table.stories.tsx
git commit -m "refactor(components): update DataTable stories to use createColumnHelper

Demonstrates the recommended type-safe column definition pattern
from docs/react-table-reference.md.

Closes #30"
```

- [ ] **Step 4: Push**

```bash
git push origin main
```
