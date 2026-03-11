import { Box, Checkbox, Flex, Table, Text } from "@chakra-ui/react";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	type OnChangeFn,
	type RowSelectionState,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type React from "react";
import { Skeleton } from "../../primitives/skeleton";
import { Pagination } from "../pagination";

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
	} = props;

	const selectionColumn: ColumnDef<T, unknown> = {
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
	};

	const allColumns = selectable ? [selectionColumn, ...columns] : columns;

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
		getSortedRowModel: getSortedRowModel(),
		enableRowSelection: selectable,
		manualSorting: onSortingChange !== undefined,
	});

	const hasPagination =
		total !== undefined &&
		page !== undefined &&
		pageSize !== undefined &&
		onPageChange !== undefined;

	const isEmpty = !loading && data.length === 0;

	return (
		<Flex direction="column" gap={4}>
			<Box overflowX="auto">
				{/* The custom theme extends the table recipe with additional variants
				    (striped, hoverable) beyond Chakra's built-in types */}
				<Table.Root variant={variant as "line"}>
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
						{!loading &&
							table.getRowModel().rows.map((row) => (
								<Table.Row
									key={row.id}
									data-selected={row.getIsSelected() || undefined}
									cursor={onRowClick ? "pointer" : undefined}
									onClick={
										onRowClick ? () => onRowClick(row.original) : undefined
									}
								>
									{row.getVisibleCells().map((cell) => (
										<Table.Cell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</Table.Cell>
									))}
								</Table.Row>
							))}
						{isEmpty && (
							<Table.Row>
								<Table.Cell
									colSpan={allColumns.length}
									textAlign="center"
									py={8}
								>
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
