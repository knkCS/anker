import type { Meta, StoryObj } from "@storybook/react";
import { CodeCell } from "./code-cell";

const meta = {
	title: "Components/DataTable/Cells/CodeCell",
	component: CodeCell,
	args: {
		value: "SELECT * FROM users WHERE id = 1;",
	},
} satisfies Meta<typeof CodeCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ShortMax: Story = {
	args: {
		value: "SELECT * FROM users WHERE id = 1;",
		maxLength: 20,
	},
};

export const NullValue: Story = {
	args: {
		value: null,
	},
};
