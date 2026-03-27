import type { Meta, StoryObj } from "@storybook/react";
import type { RowSelectionState, SortingState } from "@tanstack/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import { useState } from "react";
import { StatusBadge } from "../../atoms/status-badge";
import { Text } from "../../primitives/typography";
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
