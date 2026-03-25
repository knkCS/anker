import type { Meta, StoryObj } from "@storybook/react";
import { SplitButton } from "./split-button";

const meta = {
	title: "Atoms/SplitButton",
	component: SplitButton,
} satisfies Meta<typeof SplitButton>;

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
