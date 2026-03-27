import type { Meta, StoryObj } from "@storybook/react";
import { Box, Stack } from "../../primitives/layout";
import TextInput from "./text-input";

const meta = {
	title: "Atoms/TextInput",
	component: TextInput,
} satisfies Meta<typeof TextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		placeholder: "Enter text...",
	},
	render(args) {
		return (
			<Box maxW="400px">
				<TextInput {...args} />
			</Box>
		);
	},
};

export const WithAddons: Story = {
	args: {
		placeholder: "Enter text...",
	},
	render() {
		return (
			<Stack maxW="400px" gap={4}>
				<TextInput prepend="https://" placeholder="example.com" />
				<TextInput append=".com" placeholder="domain" />
				<TextInput prepend="$" append=".00" placeholder="0" />
			</Stack>
		);
	},
};
