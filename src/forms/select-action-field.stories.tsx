import type { Meta, StoryObj } from "@storybook/react";
import { SelectActionField } from "./select-action-field";

const meta = {
	title: "Forms/SelectActionField",
	component: SelectActionField,
} satisfies Meta<typeof SelectActionField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		label: "Create",
		onClick: () => alert("Primary click"),
		menuItems: [
			{ label: "Create from template", onClick: () => alert("Template") },
			{ label: "Import", onClick: () => alert("Import") },
		],
	},
};

export const MenuOnly: Story = {
	args: {
		label: "Actions",
		menuItems: [
			{ label: "Edit", onClick: () => alert("Edit") },
			{ label: "Delete", onClick: () => alert("Delete"), color: "red" },
		],
	},
};

export const ButtonOnly: Story = {
	args: {
		label: "Create",
		onClick: () => alert("Create"),
	},
};
