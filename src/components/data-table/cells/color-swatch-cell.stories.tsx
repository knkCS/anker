import type { Meta, StoryObj } from "@storybook/react";
import { ColorSwatchCell } from "./color-swatch-cell";

const meta = {
	title: "Components/DataTable/Cells/ColorSwatchCell",
	component: ColorSwatchCell,
	args: {
		value: "#2087d7",
	},
} satisfies Meta<typeof ColorSwatchCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OrangeColor: Story = {
	args: {
		value: "#e9580c",
	},
};

export const GreenColor: Story = {
	args: {
		value: "#16a34a",
	},
};

export const NullValue: Story = {
	args: {
		value: null,
	},
};
