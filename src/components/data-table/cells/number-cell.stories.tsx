import type { Meta, StoryObj } from "@storybook/react";
import { NumberCell } from "./number-cell";

const meta = {
	title: "Components/DataTable/Cells/NumberCell",
	component: NumberCell,
	args: {
		value: 1234567.89,
	},
} satisfies Meta<typeof NumberCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLocale: Story = {
	args: {
		value: 1234567.89,
		locale: "de-DE",
	},
};

export const NullValue: Story = {
	args: {
		value: null,
	},
};
