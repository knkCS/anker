import type { Meta, StoryObj } from "@storybook/react";
import { createColumnHelper } from "@tanstack/react-table";
import { Copy, Edit, Eye, Trash2 } from "lucide-react";
import { MemoryRouter } from "react-router-dom";
import { DataTable } from "../data-table";
import { ActionCell } from "./action-cell";
import { BooleanCell } from "./boolean-cell";
import { CodeCell } from "./code-cell";
import { ColorSwatchCell } from "./color-swatch-cell";
import { CountCell } from "./count-cell";
import { DateCell } from "./date-cell";
import { LinkCell } from "./link-cell";
import { MenuCell } from "./menu-cell";
import { NumberCell } from "./number-cell";
import { SlugCell } from "./slug-cell";
import { StatusBadgeCell } from "./status-badge-cell";
import { TruncatedTextCell } from "./truncated-text-cell";
import { UrlCell } from "./url-cell";

interface SampleRow {
	id: number;
	name: string | null;
	count: number | null;
	isActive: boolean | null;
	slug: string | null;
	code: string | null;
	url: string | null;
	path: string | null;
	color: string | null;
	amount: number | null;
	status: string | null;
	createdAt: string | null;
}

const sampleData: SampleRow[] = [
	{
		id: 1,
		name: "A long description that may need to be truncated if it exceeds the limit",
		count: 42,
		isActive: true,
		slug: "my-content-slug",
		code: "SELECT * FROM users WHERE id = 1;",
		url: "https://example.com/page",
		path: "/items/1",
		color: "#2087d7",
		amount: 1234567.89,
		status: "published",
		createdAt: "2025-11-15T10:30:00Z",
	},
	{
		id: 2,
		name: "Short name",
		count: 1,
		isActive: false,
		slug: "another-slug",
		code: "const x = 42;",
		url: "https://knkcs.de",
		path: "/items/2",
		color: "#e9580c",
		amount: 99,
		status: "draft",
		createdAt: "2026-01-20T08:00:00Z",
	},
	{
		id: 3,
		name: "Item with relative date",
		count: 7,
		isActive: true,
		slug: "third-entry",
		code: "npm install @knkcs/anker",
		url: "https://github.com/knkcs",
		path: "/items/3",
		color: "#16a34a",
		amount: 0,
		status: "archived",
		createdAt: "2026-03-20T14:45:00Z",
	},
	{
		id: 4,
		name: null,
		count: null,
		isActive: null,
		slug: null,
		code: null,
		url: null,
		path: null,
		color: null,
		amount: null,
		status: null,
		createdAt: null,
	},
];

const statusColorMap: Record<string, string> = {
	published: "#16a34a",
	draft: "#ca8a04",
	archived: "#6b7280",
};

const columnHelper = createColumnHelper<SampleRow>();

const columns = [
	columnHelper.accessor("name", {
		header: "Name (truncated)",
		cell: (info) => (
			<TruncatedTextCell value={info.getValue()} maxLength={30} />
		),
	}),
	columnHelper.accessor("count", {
		header: "Count",
		cell: (info) => (
			<CountCell value={info.getValue()} singular="item" plural="items" />
		),
	}),
	columnHelper.accessor("isActive", {
		header: "Active",
		cell: (info) => <BooleanCell value={info.getValue()} />,
	}),
	columnHelper.accessor("slug", {
		header: "Slug",
		cell: (info) => <SlugCell value={info.getValue()} />,
	}),
	columnHelper.accessor("code", {
		header: "Code",
		cell: (info) => <CodeCell value={info.getValue()} maxLength={30} />,
	}),
	columnHelper.accessor("url", {
		header: "URL",
		cell: (info) => <UrlCell value={info.getValue()} label="Open link" />,
	}),
	columnHelper.accessor("color", {
		header: "Color",
		cell: (info) => <ColorSwatchCell value={info.getValue()} />,
	}),
	columnHelper.accessor("amount", {
		header: "Amount",
		cell: (info) => <NumberCell value={info.getValue()} />,
	}),
	columnHelper.accessor("status", {
		header: "Status",
		cell: (info) => (
			<StatusBadgeCell value={info.getValue()} colorMap={statusColorMap} />
		),
	}),
	columnHelper.accessor("createdAt", {
		header: "Created",
		cell: (info) => <DateCell value={info.getValue()} showRelative />,
	}),
	columnHelper.accessor("path", {
		header: "Link",
		cell: (info) => (
			<LinkCell to={info.getValue()} label={info.row.original.name} />
		),
	}),
	columnHelper.display({
		id: "menu",
		header: "Menu",
		cell: (info) => (
			<MenuCell
				actions={[
					{
						icon: Eye,
						label: "View",
						onClick: () => console.log(`View row ${info.row.original.id}`),
					},
					{
						icon: Edit,
						label: "Edit",
						onClick: () => console.log(`Edit row ${info.row.original.id}`),
					},
					{
						icon: Copy,
						label: "Duplicate",
						onClick: () => console.log(`Duplicate row ${info.row.original.id}`),
					},
					{
						icon: Trash2,
						label: "Delete",
						colorPalette: "red",
						onClick: () => console.log(`Delete row ${info.row.original.id}`),
					},
				]}
			/>
		),
	}),
	columnHelper.display({
		id: "actions",
		header: "Actions",
		cell: (info) => (
			<ActionCell
				actions={[
					{
						icon: Eye,
						label: "View",
						onClick: () => console.log(`View row ${info.row.original.id}`),
					},
					{
						icon: Edit,
						label: "Edit",
						onClick: () => console.log(`Edit row ${info.row.original.id}`),
					},
					{
						icon: Trash2,
						label: "Delete",
						colorPalette: "red",
						onClick: () => console.log(`Delete row ${info.row.original.id}`),
					},
				]}
			/>
		),
	}),
];

const meta = {
	title: "Components/DataTable/Cells",
	component: DataTable,
	decorators: [
		(Story) => (
			<MemoryRouter>
				<Story />
			</MemoryRouter>
		),
	],
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllCells: Story = {
	render: () => <DataTable columns={columns} data={sampleData} />,
};

export const NullRow: Story = {
	render: () => (
		<DataTable columns={columns} data={[sampleData[sampleData.length - 1]]} />
	),
};

export const DateCellRelative: Story = {
	render: () => (
		<DataTable
			columns={[
				columnHelper.accessor("name", { header: "Name" }),
				columnHelper.accessor("createdAt", {
					header: "Created (relative)",
					cell: (info) => <DateCell value={info.getValue()} showRelative />,
				}),
			]}
			data={sampleData.filter((d) => d.createdAt != null)}
		/>
	),
};

export const BooleanCellCustomLabels: Story = {
	render: () => (
		<DataTable
			columns={[
				columnHelper.accessor("name", { header: "Name" }),
				columnHelper.accessor("isActive", {
					header: "Status",
					cell: (info) => (
						<BooleanCell
							value={info.getValue()}
							trueLabel="Active"
							falseLabel="Inactive"
						/>
					),
				}),
			]}
			data={sampleData}
		/>
	),
};

export const TruncatedTextCellDemo: Story = {
	render: () => (
		<DataTable
			columns={[
				columnHelper.accessor("name", {
					header: "Name (max 10 chars)",
					cell: (info) => (
						<TruncatedTextCell value={info.getValue()} maxLength={10} />
					),
				}),
				columnHelper.accessor("code", {
					header: "Code (max 20 chars)",
					cell: (info) => <CodeCell value={info.getValue()} maxLength={20} />,
				}),
			]}
			data={sampleData.filter((d) => d.name != null)}
		/>
	),
};
