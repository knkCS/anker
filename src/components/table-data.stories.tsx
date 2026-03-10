import { Flex } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { TableData } from "./table-data";

const meta = {
	title: "Components/TableData",
	component: TableData,
} satisfies Meta<typeof TableData>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: "Simple table data text",
	},
};

export const Truncated: Story = {
	render() {
		return (
			<Flex maxW="200px">
				<TableData>
					This is a very long text that should be truncated and show a tooltip
					on hover
				</TableData>
			</Flex>
		);
	},
};
