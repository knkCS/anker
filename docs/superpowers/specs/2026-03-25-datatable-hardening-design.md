# DataTable Hardening — Design Spec

## Problem

The DataTable component has 8 issues: unstable column references causing unnecessary re-renders, missing `getRowId` making selection unreliable across data changes, wasteful `getSortedRowModel` registration in server-side mode, keyboard accessibility gaps on sortable headers and clickable rows, missing test coverage for sorting/selection, and stories not demonstrating the recommended `createColumnHelper` pattern.

## Goal

Fix all 8 issues in a single refactor of `data-table.tsx` + its tests and stories. Zero breaking changes to the public API (only additions).

## Design

### Fix 1: Add `getRowId` prop (#22 — High)

**File:** `src/components/data-table/data-table.tsx`

Add to `DataTableProps<T>` (matching TanStack's exact signature, including the optional `parent` parameter for sub-row scenarios):
```tsx
/** Custom row ID extractor for stable selection across data changes. @default row index */
getRowId?: (originalRow: T, index: number, parent?: Row<T>) => string;
```

Add `Row` to the existing TanStack import:
```tsx
import { type Row, ... } from "@tanstack/react-table";
```

Pass through to `useReactTable`:
```tsx
getRowId,
```

### Fix 2: Memoize columns (#24 — High)

**File:** `src/components/data-table/data-table.tsx`

The `selectionColumn` object is recreated every render inside the component body. It cannot be extracted to module level because it is typed as `ColumnDef<T, unknown>` where `T` is the component's generic parameter — `T` is not in scope at module level.

Instead, memoize `selectionColumn` with `useMemo` (it has no dependencies — it uses only TanStack render props), then memoize `allColumns`:

```tsx
const selectionColumn = useMemo<ColumnDef<T, unknown>>(
    () => ({
        id: "_select",
        header: ({ table }) => ( /* ... checkbox JSX unchanged ... */ ),
        cell: ({ row }) => ( /* ... checkbox JSX unchanged ... */ ),
        enableSorting: false,
    }),
    [],
);

const allColumns = useMemo(
    () => (selectable ? [selectionColumn, ...columns] : columns),
    [selectable, selectionColumn, columns],
);
```

Add `useMemo` to the React import.

**Note on caller responsibility:** The `useMemo` on `allColumns` only provides benefit if the caller also stabilizes their `columns` prop (define outside component or wrap in `useMemo`). This is documented in `docs/react-table-reference.md` as the #1 pitfall. The memoization here prevents the *additional* instability that DataTable itself was introducing; caller instability is the caller's responsibility.

### Fix 3: Conditional `getSortedRowModel` (#23 — Medium)

**File:** `src/components/data-table/data-table.tsx`

Only register `getSortedRowModel` when not in manual sorting mode:

```tsx
...(onSortingChange === undefined
    ? { getSortedRowModel: getSortedRowModel() }
    : {}),
```

This avoids wasting initialization in server-side sorting mode and makes the intent clearer.

### Fix 4: Keyboard a11y for sortable headers (#27 — Medium)

**File:** `src/components/data-table/data-table.tsx`

Sortable column headers currently have `onClick` + `cursor: pointer` but no keyboard support. Add to sortable `Table.ColumnHeader`:

```tsx
{...(canSort && {
    tabIndex: 0,
    role: "button",
    onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            header.column.getToggleSortingHandler()?.(e);
        }
    },
})}
```

### Fix 5: Keyboard a11y for clickable rows (#28 — Medium)

**File:** `src/components/data-table/data-table.tsx`

When `onRowClick` is provided, rows get `onClick` but no keyboard support. Add:

```tsx
{...(onRowClick && {
    tabIndex: 0,
    role: "button",
    onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onRowClick(row.original);
        }
    },
})}
```

### Fix 6: Variant type cast (#25 — Low)

**File:** `src/components/data-table/data-table.tsx`

Keep the `variant={variant as "line"}` cast but improve the comment explaining why. Module augmentation for Chakra v3 slot recipe variants is complex and not worth the effort for one component. The custom table recipe adds `"striped"` and `"hoverable"` variants that Chakra's built-in types don't include.

No code change beyond updating the comment.

### Fix 7: Test coverage (#29 — Low)

**File:** `src/components/data-table/__tests__/data-table.test.tsx`

Add tests for:
1. **Sorting:** render with sortable columns + `sorting` + `onSortingChange`, click a sortable header, assert `onSortingChange` is called
2. **Selection:** render with `selectable` + `rowSelection` + `onRowSelectionChange`, click a row checkbox, assert `onRowSelectionChange` is called
3. **getRowId:** render with `getRowId`, verify selection uses custom IDs

### Fix 8: Stories use `createColumnHelper` (#30 — Low)

**File:** `src/components/data-table/data-table.stories.tsx`

Refactor story column definitions from inline `ColumnDef<User, unknown>[]` objects to `createColumnHelper<User>()`. This demonstrates the recommended pattern from `docs/react-table-reference.md`.

### Files changed

| File | Changes |
|------|---------|
| `src/components/data-table/data-table.tsx` | Fixes 1-6: getRowId prop, memoize columns, conditional getSortedRowModel, keyboard a11y, comment update |
| `src/components/data-table/__tests__/data-table.test.tsx` | Fix 7: sorting, selection, getRowId tests |
| `src/components/data-table/data-table.stories.tsx` | Fix 8: createColumnHelper pattern |
| `src/components/index.ts` | Re-export updated `DataTableProps` (already exported, type widens with new optional prop — non-breaking) |

### Public API

Non-breaking addition: `getRowId` prop added to `DataTableProps<T>`. All other changes are internal.

## Verification

- `npm run typecheck` passes
- `npm run lint` passes
- `npm run build` passes
- `npm run test` passes (including new sorting/selection tests)
- Storybook: DataTable stories render correctly
