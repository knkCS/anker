import type { Meta, StoryObj } from "@storybook/react";
import { Box } from "../../primitives/layout";
import DateInput from "./date-input";

const meta = {
	title: "Atoms/DateInput",
	component: DateInput,
} satisfies Meta<typeof DateInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		value: "2024-01-15",
	},
	render(args) {
		return (
			<Box maxW="300px">
				<DateInput {...args} />
			</Box>
		);
	},
};

export const WithMinMax: Story = {
	args: {
		value: "2024-06-15",
		minDate: "2024-01-01",
		maxDate: "2024-12-31",
	},
	render(args) {
		return (
			<Box maxW="300px">
				<DateInput {...args} />
			</Box>
		);
	},
};
