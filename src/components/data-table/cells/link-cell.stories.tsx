import type { Meta, StoryObj } from "@storybook/react";
import { createColumnHelper } from "@tanstack/react-table";
import { MemoryRouter } from "react-router-dom";
import { DataTable } from "../data-table";
import { LinkCell } from "./link-cell";

const meta = {
	title: "Components/DataTable/Cells/LinkCell",
	component: LinkCell,
	decorators: [
		(Story) => (
			<MemoryRouter>
				<Story />
			</MemoryRouter>
		),
	],
} satisfies Meta<typeof LinkCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		to: "/projects/123",
		label: "Project Alpha",
	},
};

export const WithoutLabel: Story = {
	args: {
		to: "/projects/123/edit",
	},
};

export const NullValue: Story = {
	args: {
		to: null,
	},
};

interface SampleRow {
	id: number;
	name: string;
	path: string | null;
}

const sampleData: SampleRow[] = [
	{ id: 1, name: "Project Alpha", path: "/projects/1" },
	{ id: 2, name: "Project Beta", path: "/projects/2" },
	{ id: 3, name: "Deleted Project", path: null },
];

const columnHelper = createColumnHelper<SampleRow>();

const columns = [
	columnHelper.accessor("id", { header: "ID" }),
	columnHelper.accessor("name", {
		header: "Name",
		cell: (info) => (
			<LinkCell to={info.row.original.path} label={info.getValue()} />
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
