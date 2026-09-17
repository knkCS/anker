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
	buildReorderAnnouncements,
	createRowReorderColumn,
	REORDER_COLUMN_ID,
	type ReorderableRow,
	reorderScreenReaderInstructions,
	resolveRowReorder,
	SortableTableRow,
} from "./row-reorder";

export interface DataTableProps<T extends Record<string, unknown>> {
	/** Column definitions for TanStack Table */
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
	 */
	onRowReorder?: (fromIndex: number, toIndex: number) => void;
}

/** Internal columns rendered at a fixed width rather than flexing. */
const FIXED_WIDTH_COLUMN_IDS = new Set<string>(["_select", REORDER_COLUMN_ID]);

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
			id: "_select",
			size: 40,
			minSize: 40,
			maxSize: 40,
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

	const sensors = useSensors(
		useSensor(PointerSensor, {
			// Let a click on the handle still reach the row; only a real drag wins.
			activationConstraint: { distance: 4 },
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const getReorderableRows = useCallback(
		(): ReorderableRow[] =>
			table.getRowModel().rows.map((row) => ({ id: row.id, index: row.index })),
		[table],
	);

	const announcements = useMemo(
		() => buildReorderAnnouncements(getReorderableRows),
		[getReorderableRows],
	);

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const move = resolveRowReorder(
				getReorderableRows(),
				event.active.id,
				event.over?.id,
			);
			if (move) onRowReorder?.(move.fromIndex, move.toIndex);
		},
		[getReorderableRows, onRowReorder],
	);

	const rowIds = useMemo(() => rows.map((row) => row.id), [rows]);

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
			<Table.Cell
				key={cell.id}
				style={
					FIXED_WIDTH_COLUMN_IDS.has(cell.column.id)
						? { width: cell.column.getSize() }
						: undefined
				}
			>
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
			<Table.Root variant={variant as "line"}>
				<Table.Header>
					{table.getHeaderGroups().map((headerGroup) => (
						<Table.Row key={headerGroup.id}>
							{headerGroup.headers.map((header) => {
								const canSort = header.column.getCanSort();
								const sorted = header.column.getIsSorted();
								const isFixedWidthCol = FIXED_WIDTH_COLUMN_IDS.has(
									header.column.id,
								);

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
										style={
											isFixedWidthCol
												? { width: header.column.getSize() }
												: undefined
										}
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
