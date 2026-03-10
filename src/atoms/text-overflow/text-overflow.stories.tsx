import { Box } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { TextOverflow } from "./text-overflow";

const meta = {
	title: "Atoms/TextOverflow",
	component: TextOverflow,
} satisfies Meta<typeof TextOverflow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: "This is a short text that fits within the container.",
	},
	render(args) {
		return (
			<Box maxW="200px">
				<TextOverflow {...args} />
			</Box>
		);
	},
};

export const Overflowing: Story = {
	args: {
		children:
			"This is a very long text that will overflow the container and show a tooltip when hovered.",
	},
	render(args) {
		return (
			<Box maxW="200px" overflow="hidden">
				<TextOverflow truncate {...args} />
			</Box>
		);
	},
};
