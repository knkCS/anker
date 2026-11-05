import { Checkbox } from "@chakra-ui/react";
import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
	type Column,
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
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type React from "react";
import { useCallback, useMemo } from "react";
import { Box, Flex } from "../../primitives/layout";
import { Skeleton } from "../../primitives/skeleton";
import { Table } from "../../primitives/table";
import { Text } from "../../primitives/typography";
import { Pagination } from "../pagination";
import {
	type ColumnWidthSource,
	columnWidth,
	tableMinWidth,
} from "./column-width";
import {
	buildReorderAnnouncements,
	createRowReorderColumn,
	REORDER_COLUMN_ID,
	type ReorderableRow,
	reorderScreenReaderInstructions,
	resolveRowReorder,
	SortableTableRow,
} from "./row-reorder";

/** Column id of the checkbox column injected when `selectable` is set. */
const SELECT_COLUMN_ID = "_select";

/**
 * The checkbox column's `size`: its content width in px, the small checkbox's
 * control. DataTable adds the cell's padding, as to every column.
 */
const SELECT_COLUMN_SIZE = 16;

export interface DataTableProps<T extends Record<string, unknown>> {
	/**
	 * Column definitions for TanStack Table.
	 *
	 * A column's `size` is the width of its CONTENT in px: its header and every
	 * cell get that plus the cell's padding, which DataTable adds itself. A
	 * column with `minSize` and no `size` gets at least that much content width
	 * and whatever the table has over. Once any column carries either, the
	 * table is never narrower than the sum of its columns (the drag-handle and
	 * selection columns included) and scrolls sideways in a narrower container.
	 * With neither on any column, the columns share the table's width.
	 */
	columns: ColumnDef<T, unknown>[];
	/** Data array */
	data: T[];
	/** Enable row selection */
	selectable?: boolean;
	/** Controlled row selection state */
	rowSelection?: RowSelectionState;
	/** Row selection change handler */
	onRowSelectionChange?: OnChangeFn<RowSelectionState>;
	/** Controlled sorting state */
	sorting?: SortingState;
	/** Sorting change handler */
	onSortingChange?: OnChangeFn<SortingState>;
	/** Row click handler */
	onRowClick?: (row: T) => void;
	/** Loading state */
	loading?: boolean;
	/** Empty state content */
	emptyState?: React.ReactNode;
	/** Pagination - total items */
	total?: number;
	/** Pagination - current page (1-based) */
	page?: number;
	/** Pagination - items per page */
	pageSize?: number;
	/** Pagination - page change handler */
	onPageChange?: (page: number) => void;
	/** Table variant */
	variant?: "line" | "striped" | "hoverable";
	/** Custom row ID extractor for stable selection across data changes. @default row index */
	getRowId?: (originalRow: T, index: number, parent?: Row<T>) => string;
	/**
	 * Enables drag-and-drop (and keyboard) row reordering. When set, a drag-handle
	 * column is injected at the start of the table and this callback fires on drop.
	 *
	 * Both indices address the `data` array you passed in — the table stays
	 * controlled, so apply the move to your own data yourself. Reordering works
	 * within the rows currently rendered; moving a row across pages is out of scope.
	 *
	 * A manual order and a sort order are two different orders: reorder assumes an
	 * unsorted table, where the visible order *is* `data`'s order. Don't offer both
	 * on the same table.
	 */
	onRowReorder?: (fromIndex: number, toIndex: number) => void;
}

/** DataTable's own columns, by id: their sizes alone ask for no minimum width. */
const BUILT_IN_COLUMNS: ReadonlySet<string> = new Set([
	SELECT_COLUMN_ID,
	REORDER_COLUMN_ID,
]);

/**
 * TanStack fills every column definition with default sizes (150, min 20),
 * which would read as a width on every column. Cleared, a resolved column's
 * `size` / `minSize` is what its definition says and nothing else, so a table
 * whose columns set none lays out as it always has. (`getSize()` still falls
 * back to TanStack's defaults.)
 */
const NO_DEFAULT_SIZES = {
	size: undefined,
	minSize: undefined,
	maxSize: undefined,
};

/** What a column's width is read from: its id and its definition's sizes. */
function widthSource<T>(column: Column<T, unknown>): ColumnWidthSource {
	return {
		id: column.id,
		size: column.columnDef.size,
		minSize: column.columnDef.minSize,
	};
}

/** The CSS width of a column's header and cells, or `undefined` to flex. */
function widthOfColumn<T>(column: Column<T, unknown>): string | undefined {
	return columnWidth(widthSource(column));
}

const LOADING_ROW_COUNT = 5;

function DataTableInner<T extends Record<string, unknown>>(
	props: DataTableProps<T>,
) {
	const {
		columns,
		data,
		selectable = false,
		rowSelection,
		onRowSelectionChange,
		sorting,
		onSortingChange,
		onRowClick,
		loading = false,
		emptyState,
		total,
		page,
		pageSize,
		onPageChange,
		variant = "line",
		getRowId,
		onRowReorder,
	} = props;

	const reorderable = onRowReorder !== undefined;

	const selectionColumn = useMemo<ColumnDef<T, unknown>>(
		() => ({
			id: SELECT_COLUMN_ID,
			size: SELECT_COLUMN_SIZE,
			minSize: SELECT_COLUMN_SIZE,
			maxSize: SELECT_COLUMN_SIZE,
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

	const reorderColumn = useMemo(() => createRowReorderColumn<T>(), []);

	const allColumns = useMemo(
		() => [
			...(reorderable ? [reorderColumn] : []),
			...(selectable ? [selectionColumn] : []),
			...columns,
		],
		[reorderable, reorderColumn, selectable, selectionColumn, columns],
	);

	const table = useReactTable({
		data,
		columns: allColumns,
		state: {
			...(sorting !== undefined ? { sorting } : {}),
			...(rowSelection !== undefined ? { rowSelection } : {}),
		},
		onSortingChange,
		onRowSelectionChange,
		getCoreRowModel: getCoreRowModel(),
		...(onSortingChange === undefined
			? { getSortedRowModel: getSortedRowModel() }
			: {}),
		defaultColumn: NO_DEFAULT_SIZES,
		enableRowSelection: selectable,
		manualSorting: onSortingChange !== undefined,
		...(getRowId !== undefined ? { getRowId } : {}),
	});

	const hasPagination =
		total !== undefined &&
		page !== undefined &&
		pageSize !== undefined &&
		onPageChange !== undefined;

	const isEmpty = !loading && data.length === 0;

	const rows = table.getRowModel().rows;

	const minWidth = tableMinWidth(
		table.getVisibleLeafColumns().map(widthSource),
		BUILT_IN_COLUMNS,
	);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			// A press that never travels this far stays a click, not a drag.
			activationConstraint: { distance: 4 },
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const reorderableRows = useMemo<ReorderableRow[]>(
		() => rows.map((row) => ({ id: row.id, index: row.index })),
		[rows],
	);

	const announcements = useMemo(
		() => buildReorderAnnouncements(reorderableRows),
		[reorderableRows],
	);

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const move = resolveRowReorder(
				reorderableRows,
				event.active.id,
				event.over?.id,
			);
			if (move) onRowReorder?.(move.fromIndex, move.toIndex);
		},
		[reorderableRows, onRowReorder],
	);

	const rowIds = useMemo(
		() => reorderableRows.map((row) => row.id),
		[reorderableRows],
	);

	const renderRow = (row: (typeof rows)[number]) => {
		const rowProps = {
			"data-selected": row.getIsSelected() || undefined,
			cursor: onRowClick ? ("pointer" as const) : undefined,
			onClick: onRowClick ? () => onRowClick(row.original) : undefined,
			tabIndex: onRowClick ? 0 : undefined,
			role: onRowClick ? "button" : undefined,
			onKeyDown: onRowClick
				? (e: React.KeyboardEvent) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							onRowClick(row.original);
						}
					}
				: undefined,
		};

		const cells = row.getVisibleCells().map((cell) => (
			<Table.Cell key={cell.id} width={widthOfColumn(cell.column)}>
				{flexRender(cell.column.columnDef.cell, cell.getContext())}
			</Table.Cell>
		));

		return reorderable ? (
			<SortableTableRow key={row.id} id={row.id} {...rowProps}>
				{cells}
			</SortableTableRow>
		) : (
			<Table.Row key={row.id} {...rowProps}>
				{cells}
			</Table.Row>
		);
	};

	const tableBox = (
		<Box overflowX="auto">
			{/* Chakra v3's Table.Root types only include built-in variants.
				    Our custom table recipe adds "striped" and "hoverable" variants
				    that work at runtime but require a type cast. Module augmentation
				    for slot recipe variants is not supported in Chakra v3. */}
			<Table.Root variant={variant as "line"} minWidth={minWidth}>
				<Table.Header>
					{table.getHeaderGroups().map((headerGroup) => (
						<Table.Row key={headerGroup.id}>
							{headerGroup.headers.map((header) => {
								const canSort = header.column.getCanSort();
								const sorted = header.column.getIsSorted();

								return (
									<Table.ColumnHeader
										key={header.id}
										cursor={canSort ? "pointer" : undefined}
										onClick={
											canSort
												? header.column.getToggleSortingHandler()
												: undefined
										}
										aria-sort={
											sorted === "asc"
												? "ascending"
												: sorted === "desc"
													? "descending"
													: canSort
														? "none"
														: undefined
										}
										userSelect={canSort ? "none" : undefined}
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
										width={widthOfColumn(header.column)}
									>
										<Flex alignItems="center" gap={1}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
											{canSort && sorted === "asc" && (
												<ArrowUp size={14} aria-hidden="true" />
											)}
											{canSort && sorted === "desc" && (
												<ArrowDown size={14} aria-hidden="true" />
											)}
											{canSort && !sorted && (
												<ArrowUpDown size={14} aria-hidden="true" />
											)}
										</Flex>
									</Table.ColumnHeader>
								);
							})}
						</Table.Row>
					))}
				</Table.Header>
				<Table.Body>
					{loading &&
						Array.from({ length: LOADING_ROW_COUNT }).map((_, rowIdx) => (
							<Table.Row key={`loading-${String(rowIdx)}`} aria-hidden="true">
								{allColumns.map((_, colIdx) => (
									<Table.Cell key={`loading-cell-${String(colIdx)}`}>
										<Skeleton height="4" borderRadius="sm" />
									</Table.Cell>
								))}
							</Table.Row>
						))}
					{!loading && rows.map(renderRow)}
					{isEmpty && (
						<Table.Row>
							<Table.Cell colSpan={allColumns.length} textAlign="center" py={8}>
								{emptyState ?? (
									<Text color="muted" fontSize="sm">
										No data available
									</Text>
								)}
							</Table.Cell>
						</Table.Row>
					)}
				</Table.Body>
			</Table.Root>
		</Box>
	);

	return (
		<Flex direction="column" gap={4}>
			{reorderable ? (
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={handleDragEnd}
					accessibility={{
						announcements,
						screenReaderInstructions: reorderScreenReaderInstructions,
					}}
				>
					<SortableContext
						items={rowIds}
						strategy={verticalListSortingStrategy}
					>
						{tableBox}
					</SortableContext>
				</DndContext>
			) : (
				tableBox
			)}
			{hasPagination && (
				<Flex justifyContent="center">
					<Pagination
						page={page}
						total={total}
						pageSize={pageSize}
						onPageChange={onPageChange}
					/>
				</Flex>
			)}
		</Flex>
	);
}

export const DataTable = DataTableInner as typeof DataTableInner & {
	displayName: string;
};
DataTable.displayName = "DataTable";
