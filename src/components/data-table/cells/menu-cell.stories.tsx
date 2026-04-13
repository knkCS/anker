import type { Meta, StoryObj } from "@storybook/react";
import { createColumnHelper } from "@tanstack/react-table";
import { Copy, Download, Edit, Eye, MoreVertical, Trash2 } from "lucide-react";
import { DataTable } from "../data-table";
import { MenuCell } from "./menu-cell";

const meta = {
	title: "Components/DataTable/Cells/MenuCell",
	component: MenuCell,
} satisfies Meta<typeof MenuCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		actions: [
			{
				icon: Edit,
				label: "Edit",
				onClick: () => console.log("Edit clicked"),
			},
		],
	},
};

export const MultipleActions: Story = {
	args: {
		actions: [
			{
				icon: Eye,
				label: "View",
				onClick: () => console.log("View clicked"),
			},
			{
				icon: Edit,
				label: "Edit",
				onClick: () => console.log("Edit clicked"),
			},
			{
				icon: Copy,
				label: "Duplicate",
				onClick: () => console.log("Duplicate clicked"),
			},
			{
				icon: Download,
				label: "Export",
				onClick: () => console.log("Export clicked"),
			},
		],
	},
};

export const WithDestructiveAction: Story = {
	args: {
		actions: [
			{
				icon: Edit,
				label: "Edit",
				onClick: () => console.log("Edit clicked"),
			},
			{
				icon: Copy,
				label: "Duplicate",
				onClick: () => console.log("Duplicate clicked"),
			},
			{
				icon: Trash2,
				label: "Delete",
				colorPalette: "red",
				onClick: () => console.log("Delete clicked"),
			},
		],
	},
};

export const CustomThreshold: Story = {
	args: {
		menuThreshold: 2,
		actions: [
			{
				icon: Eye,
				label: "View",
				onClick: () => console.log("View clicked"),
			},
			{
				icon: Edit,
				label: "Edit",
				onClick: () => console.log("Edit clicked"),
			},
		],
	},
};

export const CustomThresholdExceeded: Story = {
	args: {
		menuThreshold: 2,
		actions: [
			{
				icon: Eye,
				label: "View",
				onClick: () => console.log("View clicked"),
			},
			{
				icon: Edit,
				label: "Edit",
				onClick: () => console.log("Edit clicked"),
			},
			{
				icon: Trash2,
				label: "Delete",
				colorPalette: "red",
				onClick: () => console.log("Delete clicked"),
			},
		],
	},
};

export const CustomIcon: Story = {
	args: {
		menuIcon: MoreVertical,
		actions: [
			{
				icon: Eye,
				label: "View",
				onClick: () => console.log("View clicked"),
			},
			{
				icon: Edit,
				label: "Edit",
				onClick: () => console.log("Edit clicked"),
			},
		],
	},
};

export const DisabledActions: Story = {
	args: {
		actions: [
			{
				icon: Eye,
				label: "View",
				onClick: () => console.log("View clicked"),
			},
			{
				icon: Edit,
				label: "Edit",
				onClick: () => console.log("Edit clicked"),
				disabled: true,
			},
			{
				icon: Trash2,
				label: "Delete",
				colorPalette: "red",
				onClick: () => console.log("Delete clicked"),
				disabled: true,
			},
		],
	},
};

interface SampleRow {
	id: number;
	name: string;
	status: string;
}

const sampleData: SampleRow[] = [
	{ id: 1, name: "Project Alpha", status: "active" },
	{ id: 2, name: "Project Beta", status: "draft" },
	{ id: 3, name: "Project Gamma", status: "archived" },
];

const columnHelper = createColumnHelper<SampleRow>();

const columns = [
	columnHelper.accessor("name", { header: "Name" }),
	columnHelper.accessor("status", { header: "Status" }),
	columnHelper.display({
		id: "actions",
		header: "",
		cell: (info) => (
			<MenuCell
				actions={[
					{
						icon: Eye,
						label: "View",
						onClick: () => console.log(`View ${info.row.original.name}`),
					},
					{
						icon: Edit,
						label: "Edit",
						onClick: () => console.log(`Edit ${info.row.original.name}`),
					},
					{
						icon: Trash2,
						label: "Delete",
						colorPalette: "red",
						onClick: () => console.log(`Delete ${info.row.original.name}`),
					},
				]}
			/>
		),
	}),
];

export const InTable: Story = {
	render: () => (
		<DataTable
			columns={columns}
			data={sampleData}
			onRowClick={(row) => console.log("Row clicked:", row.name)}
		/>
	),
};
