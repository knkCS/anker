import type { Meta, StoryObj } from "@storybook/react";
import { StatusBadgeCell } from "./status-badge-cell";

const statusColorMap: Record<string, string> = {
	published: "green",
	draft: "yellow",
	archived: "gray",
};

const meta = {
	title: "Components/DataTable/Cells/StatusBadgeCell",
	component: StatusBadgeCell,
	args: {
		value: "published",
	},
} satisfies Meta<typeof StatusBadgeCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		value: "published",
		colorMap: statusColorMap,
	},
};

export const NoColorMap: Story = {
	args: {
		value: "draft",
	},
};

export const FallbackColor: Story = {
	args: {
		value: "unknown-status",
		colorMap: statusColorMap,
		fallbackColor: "red",
	},
};

export const NullValue: Story = {
	args: {
		value: null,
	},
};
