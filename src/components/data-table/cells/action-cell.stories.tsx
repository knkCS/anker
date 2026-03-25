import type { Meta, StoryObj } from "@storybook/react";
import { Edit, Eye, Trash2 } from "lucide-react";
import { ActionCell } from "./action-cell";

const meta = {
	title: "Components/DataTable/Cells/ActionCell",
	component: ActionCell,
} satisfies Meta<typeof ActionCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
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
				icon: Trash2,
				label: "Delete",
				colorPalette: "red",
				onClick: () => console.log("Delete clicked"),
			},
		],
	},
};

export const EditOnly: Story = {
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

export const WithDisabledAction: Story = {
	args: {
		actions: [
			{
				icon: Edit,
				label: "Edit",
				onClick: () => console.log("Edit clicked"),
			},
			{
				icon: Trash2,
				label: "Delete",
				colorPalette: "red",
				disabled: true,
				onClick: () => console.log("Delete clicked"),
			},
		],
	},
};
