import type { Meta, StoryObj } from "@storybook/react";
import { BooleanCell } from "./boolean-cell";

const meta = {
	title: "Components/DataTable/Cells/BooleanCell",
	component: BooleanCell,
	args: {
		value: true,
	},
} satisfies Meta<typeof BooleanCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FalseValue: Story = {
	args: {
		value: false,
	},
};

export const CustomLabels: Story = {
	args: {
		value: true,
		trueLabel: "Active",
		falseLabel: "Inactive",
	},
};

export const NullValue: Story = {
	args: {
		value: null,
	},
};
