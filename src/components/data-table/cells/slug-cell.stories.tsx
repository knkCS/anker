import type { Meta, StoryObj } from "@storybook/react";
import { SlugCell } from "./slug-cell";

const meta = {
	title: "Components/DataTable/Cells/SlugCell",
	component: SlugCell,
	args: {
		value: "my-content-slug",
	},
} satisfies Meta<typeof SlugCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NullValue: Story = {
	args: {
		value: null,
	},
};
