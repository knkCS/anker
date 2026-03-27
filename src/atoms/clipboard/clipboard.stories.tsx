import type { Meta, StoryObj } from "@storybook/react";
import { HStack, Stack } from "../../primitives/layout";
import { Text } from "../../primitives/typography";
import { ClipboardButton, ClipboardInput, ClipboardLink } from "./clipboard";

const meta = {
	title: "Atoms/Clipboard",
	component: ClipboardButton,
} satisfies Meta<typeof ClipboardButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Button: Story = {
	args: {
		value: "Hello, World!",
	},
};

export const WithInput: Story = {
	render() {
		return <ClipboardInput value="https://knkcs.github.io/anker/" />;
	},
};

export const WithLink: Story = {
	render() {
		return (
			<HStack>
				<Text fontSize="sm">Share this page</Text>
				<ClipboardLink value="https://knkcs.github.io/anker/" />
			</HStack>
		);
	},
};

export const AllVariants: Story = {
	render() {
		return (
			<Stack gap={4}>
				<HStack>
					<Text fontSize="sm">Copy button:</Text>
					<ClipboardButton value="copied text" />
				</HStack>
				<ClipboardInput value="https://example.com/api/v1/resource" />
				<HStack>
					<Text fontSize="sm">Copy link:</Text>
					<ClipboardLink value="https://example.com" />
				</HStack>
			</Stack>
		);
	},
};
