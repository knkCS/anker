import { Stack } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { Persona } from "./persona";

const meta = {
	title: "Atoms/Persona",
	component: Persona,
} satisfies Meta<typeof Persona>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		name: "John Doe",
	},
};

export const Sizes: Story = {
	args: {
		name: "John Doe",
	},
	render() {
		return (
			<Stack gap={4}>
				<Persona name="John Doe" size="xs" />
				<Persona name="John Doe" size="sm" />
				<Persona name="John Doe" size="md" />
				<Persona name="John Doe" size="lg" />
			</Stack>
		);
	},
};

export const HiddenDetails: Story = {
	args: {
		name: "Jane Doe",
		hideDetails: true,
	},
};

export const CustomLabel: Story = {
	args: {
		name: "Jane Doe",
		label: "Custom Label",
	},
};
