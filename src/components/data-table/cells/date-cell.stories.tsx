import type { Meta, StoryObj } from "@storybook/react";
import { DateCell } from "./date-cell";

const meta = {
	title: "Components/DataTable/Cells/DateCell",
	component: DateCell,
	args: {
		value: "2025-11-15T10:30:00Z",
	},
} satisfies Meta<typeof DateCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Relative: Story = {
	args: {
		value: "2026-03-20T14:45:00Z",
		showRelative: true,
	},
};

export const CustomFormat: Story = {
	args: {
		value: "2025-11-15T10:30:00Z",
		format: "DD/MM/YYYY HH:mm",
	},
};

export const NullValue: Story = {
	args: {
		value: null,
	},
};
