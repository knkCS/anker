# TanStack React Table v8 Reference — @knkcs/anker

This document describes how anker uses TanStack React Table v8. Read this before creating or modifying DataTable, column definitions, or cell components.

## Setup

**Version:** `@tanstack/react-table ^8.0.0` (peer dependency). Consumers install their own copy. The library externalizes it in `tsup.config.ts`.

**Core file:** `src/components/data-table/data-table.tsx` — the only file that imports TanStack runtime APIs. Cell components have zero TanStack coupling.

## DataTable Architecture

```
Consumer defines columns + data
        ↓
DataTable wraps useReactTable()
        ↓
Renders via Chakra Table.* components
        ↓
flexRender() delegates to consumer's cell renderers
```

The `DataTable<T>` component is a thin wrapper around `useReactTable`. It handles:
- Rendering headers, rows, and cells via Chakra's `Table.*` compound components
- Sort indicators (arrow icons + `aria-sort`)
- Optional row selection (checkbox column injected when `selectable={true}`)
- Loading skeleton rows
- Empty state
- External pagination via the `Pagination` component

Features **not** in DataTable (handled by consumers): filtering, column resizing, row expansion, grouping, virtualization.

## Column Definitions

### Prefer `createColumnHelper` (recommended)

```tsx
import { createColumnHelper } from "@tanstack/react-table";

const columnHelper = createColumnHelper<User>();

const columns = [
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => <TruncatedTextCell value={info.getValue()} maxLength={30} />,
  }),
  columnHelper.accessor("email", {
    header: "Email",
    enableSorting: true,
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: (info) => (
      <ActionCell actions={[
        { icon: Edit, label: "Edit", onClick: () => edit(info.row.original) },
      ]} />
    ),
  }),
];
```

`createColumnHelper` gives full TypeScript inference — `info.getValue()` returns the correct type based on the accessor key. No need for `getValue<string>()` casts.

### Alternative: inline `ColumnDef` objects

```tsx
const columns: ColumnDef<User, unknown>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "role", header: "Role", enableSorting: true },
];
```

Acceptable for simple cases but gives weaker type inference.

### Column types

| Type | Purpose | Created with |
|------|---------|-------------|
| **Accessor** | Has underlying data. Can sort/filter. | `columnHelper.accessor()` or `accessorKey`/`accessorFn` |
| **Display** | No data model. For actions, checkboxes, expanders. | `columnHelper.display()` |
| **Group** | Container for nested column headers. | `columnHelper.group()` |

### Anti-patterns for column definitions

| Never do | Why | Do instead |
|----------|-----|-----------|
| Define columns inside component body without memoization | New reference every render → infinite re-render loop | Define outside component, or wrap in `useMemo`/`useState` |
| `accessorKey: "address.city"` for nested objects | Does not traverse nested paths | `accessorFn: (row) => row.address.city` + explicit `id` |
| `accessorFn` without providing `id` | TanStack cannot derive ID from a function | Always add `id` when using `accessorFn` |
| `getValue<string>()` casts with `createColumnHelper` | Defeats the purpose of type inference | Let TypeScript infer from the accessor |

## Cell Components

Anker provides 11 reusable cell components in `src/components/data-table/cells/`. They are **plain React components with zero TanStack coupling** — they receive pre-extracted values and render UI.

### Pattern: cells receive values, not TanStack context

```tsx
// In column definition (consumer code):
cell: (info) => <NumberCell value={info.getValue()} locale="de-DE" />

// In cell component (library code):
export const NumberCell: React.FC<NumberCellProps> = ({ value, locale }) => {
  if (value == null) return <span>{emptyCellValue}</span>;
  // ... render
};
```

Cells never import from `@tanstack/react-table`. The `info.getValue()` call happens in the consumer's column definition, not inside the cell.

### Available cells

| Cell | Value type | Use case |
|------|-----------|----------|
| `TruncatedTextCell` | `string` | General text with optional truncation |
| `NumberCell` | `number \| string` | Locale-aware number formatting |
| `BooleanCell` | `boolean` | Yes/No labels (configurable) |
| `SlugCell` | `string` | Monospace identifiers |
| `CodeCell` | `string` | Monospace with background |
| `UrlCell` | `string` | Clickable external link |
| `ColorSwatchCell` | `string` | Color circle + hex value |
| `CountCell` | `array \| object \| number` | "N items" with pluralization |
| `StatusBadgeCell` | `string` | Colored status badge |
| `ActionCell` | N/A (uses `actions` prop) | Row action icon buttons |
| `DateCell` | `string \| Date \| number` | Formatted date, optional relative tooltip |

### Null handling

Every cell follows the same pattern:
```tsx
if (value == null) return <span>{emptyCellValue}</span>;  // renders "—"
```

### Shared utilities

```tsx
import { emptyCellValue, truncateText, pluralize } from "@knkcs/anker/components";
```

- `emptyCellValue` — the em-dash constant (`"—"`) used for null/undefined
- `truncateText(text, maxLength)` — truncate with `…`
- `pluralize(count, singular, plural)` — "1 item" vs "3 items"

## Sorting

### Client-side (default)

DataTable always registers `getSortedRowModel()`. Columns with `enableSorting: true` get sort indicators and click handlers.

```tsx
<DataTable columns={columns} data={data} />
```

### Server-side (controlled)

Pass `sorting` + `onSortingChange` to switch to manual/server-side sorting. DataTable sets `manualSorting: true` when `onSortingChange` is provided.

```tsx
const [sorting, setSorting] = useState<SortingState>([]);

<DataTable
  columns={columns}
  data={serverData}        // already sorted by server
  sorting={sorting}
  onSortingChange={setSorting}
/>

// Use `sorting` state to build API query params
```

**Important:** Do not mix client-side sorting with server-side pagination. Client-side sorting only sorts the current page's data slice — not the full dataset.

## Pagination

Pagination is **fully external** — the table instance never knows about pages. Data is sliced before being passed to DataTable.

```tsx
<DataTable
  columns={columns}
  data={currentPageData}   // pre-sliced by consumer
  total={totalItems}
  page={currentPage}       // 1-based
  pageSize={pageSize}
  onPageChange={setPage}
/>
```

The `Pagination` component renders below the table when all four pagination props are provided.

**Note:** Because pagination is external, `table.getIsAllPageRowsSelected()` operates on the current `data` slice only. "Select all" selects the current page, not all records.

## Row Selection

Controlled via `selectable` + `rowSelection` + `onRowSelectionChange`:

```tsx
const [selection, setSelection] = useState<RowSelectionState>({});

<DataTable
  columns={columns}
  data={data}
  selectable
  rowSelection={selection}
  onRowSelectionChange={setSelection}
/>
```

When `selectable={true}`, DataTable injects a `_select` checkbox column at the start with:
- Header: select-all checkbox with indeterminate state
- Cell: per-row checkbox with `aria-label`
- `enableSorting: false` to prevent sorting the checkbox column

### Row identity

DataTable currently does not expose a `getRowId` prop. TanStack defaults to row index as the ID, which means `RowSelectionState` keys are `"0"`, `"1"`, etc. If data order changes (after re-sort or re-fetch), selections may point to wrong rows. For stable selection across data changes, `getRowId` should be added to DataTable's props.

## Performance

### The #1 pitfall: unstable references

If `columns` or `data` get a new reference on every render, the table re-renders infinitely. This is the most common TanStack Table bug.

```tsx
// BAD — new array every render
<DataTable columns={columns} data={serverData.filter(x => x.active)} />

// GOOD — stable reference
const activeData = useMemo(() => serverData.filter(x => x.active), [serverData]);
<DataTable columns={columns} data={activeData} />
```

**Rules:**
- Define columns outside the component, or wrap in `useMemo`/`useState`
- Never create data inline — always memoize filtered/transformed data
- Never mutate data in place — produce new arrays immutably

### What NOT to memoize

- Don't `React.memo()` the entire table body — breaks selection, density toggles
- Don't memoize all cells blindly — features like `getIsSelected()` need cells to re-render

## Anti-Patterns

| Never do | Why | Do instead |
|----------|-----|-----------|
| Define `columns` inside render without memo | Infinite re-render loop | Define outside component or `useMemo` |
| Inline `data` transforms without memo | New reference each render | `useMemo` on derived data |
| Client-side sort + server-side pagination | Sorts only current page | Use `manualSorting: true` for server data |
| Mix `getSortedRowModel` with `manualSorting` | Wastes initialization; confusing intent | Omit `getSortedRowModel` when manual |
| Omit `rowCount`/`pageCount` with `manualPagination` | Table can't calculate page count | Always provide total count |
| Mutate `data` array in place | React won't detect changes | Produce new arrays immutably |
| Import `@tanstack/react-table` in cell components | Couples cells to TanStack | Cells receive plain values, no TanStack imports |

## TypeScript Patterns

### Generic DataTable export

```tsx
// Pattern for exporting a generic component from a library
function DataTableInner<T extends Record<string, unknown>>(props: DataTableProps<T>) { ... }

export const DataTable = DataTableInner as typeof DataTableInner & {
  displayName: string;
};
DataTable.displayName = "DataTable";
```

### Type-safe column helpers at consumer site

```tsx
// Consumer creates a typed helper — full autocomplete on accessor keys
const columnHelper = createColumnHelper<MyDataType>();
```

### `ColumnDef` generic

When passing columns as a prop, type them as `ColumnDef<T, unknown>[]`. The second generic (`unknown`) is the cell value type — `unknown` is the safe default when columns have mixed accessor types.

## File Map

```
src/components/data-table/
├── data-table.tsx          # useReactTable wrapper, renders Chakra Table.*
├── data-table.stories.tsx  # Usage examples with sorting, selection, pagination
├── data-table.mdx          # Component documentation
├── index.ts                # Barrel: DataTable + all cells + utilities
├── __tests__/
│   └── data-table.test.tsx # Rendering, empty state, loading, pagination
└── cells/
    ├── cell-utils.ts       # emptyCellValue, truncateText, pluralize
    ├── index.ts            # Cell barrel
    ├── cells.stories.tsx   # All cells in a DataTable demo
    ├── truncated-text-cell.tsx
    ├── number-cell.tsx
    ├── boolean-cell.tsx
    ├── slug-cell.tsx
    ├── code-cell.tsx
    ├── url-cell.tsx
    ├── color-swatch-cell.tsx
    ├── count-cell.tsx
    ├── status-badge-cell.tsx
    ├── action-cell.tsx
    └── date-cell.tsx
```
