import type { Meta, StoryObj } from "@storybook/react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
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

export const WithDetail: Story = {
	args: {
		value: "failed",
		colorMap: { ...statusColorMap, failed: "red" },
		detail: "Export timed out after 30s",
	},
};

export const WithDetailCustomColor: Story = {
	args: {
		value: "pending",
		colorMap: statusColorMap,
		detail: "Waiting for approval",
		detailColor: "muted",
	},
};

export const WithTooltip: Story = {
	args: {
		value: "metadata",
		colorMap: { metadata: "blue" },
		tooltip: "Click the row to inspect the full payload",
	},
};

export const WithTooltipAndDetail: Story = {
	args: {
		value: "failed",
		colorMap: { ...statusColorMap, failed: "red" },
		detail: "Export timed out after 30s",
		tooltip: "Retried 3 times before giving up",
	},
};

export const WithIconOn: Story = {
	args: {
		value: "On",
		colorMap: { On: "green", Off: "gray" },
		icon: <Eye size={12} />,
	},
};

export const WithIconOff: Story = {
	args: {
		value: "Off",
		colorMap: { On: "green", Off: "gray" },
		icon: <EyeOff size={12} />,
	},
};

export const WithIconAndTooltip: Story = {
	args: {
		value: "Verified",
		colorMap: { Verified: "green" },
		icon: <ShieldCheck size={12} />,
		tooltip: "Account 2FA is enabled",
	},
};

export const NullValue: Story = {
	args: {
		value: null,
	},
};
