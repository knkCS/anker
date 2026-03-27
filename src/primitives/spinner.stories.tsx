import type { Meta, StoryObj } from "@storybook/react";
import { HStack } from "./layout";
import { Spinner } from "./spinner";

const meta = {
	title: "Primitives/Spinner",
	component: Spinner,
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
	render() {
		return (
			<HStack gap={4}>
				<Spinner size="xs" />
				<Spinner size="sm" />
				<Spinner size="md" />
				<Spinner size="lg" />
				<Spinner size="xl" />
			</HStack>
		);
	},
};

export const WithColor: Story = {
	args: {
		colorPalette: "primary",
		size: "lg",
	},
};
