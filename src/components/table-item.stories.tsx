import type { Meta, StoryObj } from "@storybook/react";
import { Text } from "../primitives/typography";
import { TableItem } from "./table-item";

const meta = {
	title: "Components/TableItem",
	component: TableItem,
} satisfies Meta<typeof TableItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: (
			<>
				<Text>John Doe</Text>
				<Text>Active</Text>
				<Text>2024-01-15</Text>
			</>
		),
	},
};

export const Active: Story = {
	args: {
		isActive: true,
		children: (
			<>
				<Text>Selected Item</Text>
				<Text>Active</Text>
			</>
		),
	},
};

export const WithMenu: Story = {
	args: {
		menuItems: [
			{ label: "Edit", onClick: () => {} },
			{ label: "Delete", onClick: () => {}, color: "red" },
		],
		children: (
			<>
				<Text>Item with Menu</Text>
				<Text>Published</Text>
			</>
		),
	},
};
