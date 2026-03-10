import { Text } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { Table } from "./table";

const meta = {
	title: "Components/Table",
	component: Table,
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		headers: ["Name", "Status", "Date"],
		children: <Text p={4}>Table rows go here.</Text>,
	},
};

export const WithMenu: Story = {
	args: {
		headers: ["Title", "Author", "Published"],
		hasMenu: true,
		children: <Text p={4}>Table rows with menu column.</Text>,
	},
};

export const WithComponentLeft: Story = {
	args: {
		headers: ["Name", "Role"],
		hasComponentLeft: true,
		children: <Text p={4}>Table rows with left component slot.</Text>,
	},
};
