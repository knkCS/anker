import { arrayMove } from "@dnd-kit/sortable";
import type { Meta, StoryObj } from "@storybook/react";
import type {
	ColumnDef,
	RowSelectionState,
	SortingState,
} from "@tanstack/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import { useState } from "react";
import { StatusBadge } from "../../atoms/status-badge";
import { Box } from "../../primitives/layout";
import { Text } from "../../primitives/typography";
import { TruncatedTextCell } from "./cells/truncated-text-cell";
import { DataTable } from "./data-table";

type User = {
	id: string;
	name: string;
	email: string;
	role: string;
	status: string;
};

const sampleUsers: User[] = [
	{
		id: "1",
		name: "Alice Johnson",
		email: "alice@example.com",
		role: "Admin",
		status: "Active",
	},
	{
		id: "2",
		name: "Bob Smith",
		email: "bob@example.com",
		role: "Editor",
		status: "Active",
	},
	{
		id: "3",
		name: "Charlie Lee",
		email: "charlie@example.com",
		role: "Viewer",
		status: "Inactive",
	},
	{
		id: "4",
		name: "Diana Park",
		email: "diana@example.com",
		role: "Editor",
		status: "Active",
	},
	{
		id: "5",
		name: "Eve Martinez",
		email: "eve@example.com",
		role: "Admin",
		status: "Pending",
	},
];

const columnHelper = createColumnHelper<User>();

const baseColumns = [
	columnHelper.accessor("name", { header: "Name" }),
	columnHelper.accessor("email", { header: "Email" }),
	columnHelper.accessor("role", { header: "Role" }),
	columnHelper.accessor("status", { header: "Status" }),
];

const sortableColumns = [
	columnHelper.accessor("name", { header: "Name", enableSorting: true }),
	columnHelper.accessor("email", { header: "Email" }),
	columnHelper.accessor("role", { header: "Role", enableSorting: true }),
	columnHelper.accessor("status", { header: "Status" }),
];

const paginatedUsers: User[] = Array.from({ length: 25 }, (_, i) => ({
	id: String(i + 1),
	name: `User ${String(i + 1)}`,
	email: `user${String(i + 1)}@example.com`,
	role: i % 3 === 0 ? "Admin" : i % 3 === 1 ? "Editor" : "Viewer",
	status: i % 4 === 0 ? "Inactive" : "Active",
}));

const meta = {
	title: "Components/DataTable",
	component: DataTable,
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => <DataTable columns={baseColumns} data={sampleUsers} />,
};

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

export const CustomCells: Story = {
	render: () => <DataTable columns={customCellColumns} data={sampleUsers} />,
};

type LineItem = {
	id: string;
	description: string;
	quantity: string;
};

const lineItemColumns = createColumnHelper<LineItem>();

const reorderColumns = [
	// Position is derived, so it renumbers itself after every move.
	lineItemColumns.display({
		id: "position",
		header: "Position",
		cell: (info) => String(info.row.index + 1),
	}),
	lineItemColumns.accessor("description", { header: "Description" }),
	lineItemColumns.accessor("quantity", { header: "Quantity" }),
];

const initialLineItems: LineItem[] = [
	{ id: "1", description: "Cover design", quantity: "1" },
	{ id: "2", description: "Typesetting", quantity: "240" },
	{ id: "3", description: "Proofreading", quantity: "240" },
	{ id: "4", description: "Printing", quantity: "2000" },
	{ id: "5", description: "Binding", quantity: "2000" },
];

const RowReorderDemo = () => {
	const [items, setItems] = useState(initialLineItems);

	// The table stays controlled — it reports the move, we apply it.
	const handleReorder = (fromIndex: number, toIndex: number) => {
		setItems((current) => arrayMove(current, fromIndex, toIndex));
	};

	return (
		<DataTable
			columns={reorderColumns}
			data={items}
			getRowId={(row) => row.id}
			onRowReorder={handleReorder}
		/>
	);
};

export const RowReorder: Story = {
	render: () => <RowReorderDemo />,
};

// A column's `size` is the width of its CONTENT in px; DataTable adds the
// cell's padding. The trailing actions column sets only `minSize`, so it gets
// at least that and whatever the table has over. The table is never narrower
// than its columns and scrolls sideways inside its container instead.
const widthColumns = [
	columnHelper.accessor("name", { header: "Name", size: 160 }),
	columnHelper.accessor("email", { header: "Email", size: 220 }),
	columnHelper.accessor("role", { header: "Role", size: 90 }),
	columnHelper.accessor("status", { header: "Status", size: 90 }),
	columnHelper.display({
		id: "actions",
		header: "",
		minSize: 120,
		cell: () => <Text fontSize="sm">Edit · Delete</Text>,
	}),
];

const ColumnWidthsDemo = () => {
	const [users, setUsers] = useState(sampleUsers);
	return (
		// A narrow container: the table scrolls rather than squeezing its columns.
		<Box maxW="480px" borderWidth="1px" borderColor="border">
			<DataTable
				columns={widthColumns}
				data={users}
				getRowId={(row) => row.id}
				onRowReorder={(from, to) => setUsers((u) => arrayMove(u, from, to))}
			/>
		</Box>
	);
};

export const ColumnWidths: Story = {
	render: () => <ColumnWidthsDemo />,
};

type LongValueRow = { id: string; path: string; owner: string; note: string };

const longValueRows: LongValueRow[] = [
	{
		id: "1",
		path: "packages/acp-ui/src/screens/a-path-far-too-long-for-its-column.tsx",
		owner: "knkCS/agent-control-plane",
		note: "A custom cell that draws a box wider than its column",
	},
	{
		id: "2",
		path: "README.md",
		owner: "knkCS/anker",
		note: "Short",
	},
];

const longValueHelper = createColumnHelper<LongValueRow>();

const longValueColumns = [
	// TruncatedTextCell ends a value wider than its column in "…" and shows
	// the whole value on hover; one that fits shows no tooltip.
	longValueHelper.accessor("path", {
		header: "Path",
		size: 160,
		cell: ({ getValue }) => <TruncatedTextCell value={getValue()} />,
	}),
	longValueHelper.accessor("owner", {
		header: "Owner",
		size: 140,
		cell: ({ row }) => (
			<TruncatedTextCell
				value={row.original.owner}
				subText={row.original.note}
			/>
		),
	}),
	// Custom content that knows nothing of its column: DataTable clips it at
	// the column's edge, so it never paints over the next column.
	longValueHelper.display({
		id: "custom",
		header: "Custom",
		size: 120,
		cell: ({ row }) => (
			<Box bg="bg-muted" px={2} w="320px">
				{row.original.note}
			</Box>
		),
	}),
	longValueHelper.display({
		id: "next",
		header: "Next",
		size: 80,
		cell: () => <Text fontSize="sm">Next</Text>,
	}),
];

/** A long value in a narrow column stays inside it (#361). */
export const LongValueInNarrowColumn: Story = {
	render: () => (
		<DataTable
			columns={longValueColumns}
			data={longValueRows}
			getRowId={(row) => row.id}
		/>
	),
};
