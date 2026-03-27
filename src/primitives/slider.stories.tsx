import type { Meta, StoryObj } from "@storybook/react";
import { Stack } from "./layout";
import { Slider } from "./slider";

const meta = {
	title: "Primitives/Slider",
	component: Slider,
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		defaultValue: [40],
		maxW: "300px",
	},
};

export const WithLabel: Story = {
	args: {
		defaultValue: [50],
		label: "Volume",
		showValue: true,
		maxW: "300px",
	},
};

export const WithMarks: Story = {
	args: {
		defaultValue: [50],
		marks: [0, 25, 50, 75, 100],
		maxW: "300px",
	},
};

export const Range: Story = {
	args: {
		defaultValue: [25, 75],
		label: "Price range",
		showValue: true,
		maxW: "300px",
	},
};

export const Sizes: Story = {
	render() {
		return (
			<Stack gap={6} maxW="300px">
				<Slider defaultValue={[30]} size="sm" label="Small" />
				<Slider defaultValue={[50]} size="md" label="Medium" />
				<Slider defaultValue={[70]} size="lg" label="Large" />
			</Stack>
		);
	},
};
