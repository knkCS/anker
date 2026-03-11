import type { Meta, StoryObj } from "@storybook/react";
import type {
	ColumnDef,
	RowSelectionState,
	SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
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

const baseColumns: ColumnDef<User, unknown>[] = [
	{ accessorKey: "name", header: "Name" },
	{ accessorKey: "email", header: "Email" },
	{ accessorKey: "role", header: "Role" },
	{ accessorKey: "status", header: "Status" },
];

const sortableColumns: ColumnDef<User, unknown>[] = [
	{ accessorKey: "name", header: "Name", enableSorting: true },
	{ accessorKey: "email", header: "Email" },
	{ accessorKey: "role", header: "Role", enableSorting: true },
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
