import type { Meta, StoryObj } from "@storybook/react";
import { UrlCell } from "./url-cell";

const meta = {
	title: "Components/DataTable/Cells/UrlCell",
	component: UrlCell,
	args: {
		value: "https://example.com/page",
	},
} satisfies Meta<typeof UrlCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = {
	args: {
		value: "https://example.com/page",
		label: "Open link",
	},
};

export const NullValue: Story = {
	args: {
		value: null,
	},
};
