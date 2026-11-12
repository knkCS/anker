import type { Meta, StoryObj } from "@storybook/react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import type { StatusBadgeTone } from "../../../atoms/status-badge";
import { StatusBadgeCell } from "./status-badge-cell";

const statusToneMap: Record<string, StatusBadgeTone> = {
	published: "success",
	draft: "warning",
	archived: "neutral",
};

// Stands in for status colours a user picked and the backend stores.
const userColorMap: Record<string, string> = {
	lead: "#7c3aed",
	contacted: "#0891b2",
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
		toneMap: statusToneMap,
	},
};

export const NoColorMap: Story = {
	args: {
		value: "draft",
	},
};

export const FallbackTone: Story = {
	args: {
		value: "unknown-status",
		toneMap: statusToneMap,
		fallbackTone: "danger",
	},
};

/** `colorMap` is for data-driven colours only — write `toneMap` in code. */
export const DataDrivenColorMap: Story = {
	args: {
		value: "lead",
		colorMap: userColorMap,
	},
};

/** A value in both maps takes its tone. */
export const ToneBeatsColor: Story = {
	args: {
		value: "lead",
		toneMap: { lead: "info" },
		colorMap: userColorMap,
	},
};

export const WithDetail: Story = {
	args: {
		value: "failed",
		toneMap: { ...statusToneMap, failed: "danger" },
		detail: "Export timed out after 30s",
	},
};

export const WithDetailCustomColor: Story = {
	args: {
		value: "pending",
		toneMap: statusToneMap,
		detail: "Waiting for approval",
		detailColor: "muted",
	},
};

export const WithTooltip: Story = {
	args: {
		value: "metadata",
		toneMap: { metadata: "info" },
		tooltip: "Click the row to inspect the full payload",
	},
};

export const WithTooltipAndDetail: Story = {
	args: {
		value: "failed",
		toneMap: { ...statusToneMap, failed: "danger" },
		detail: "Export timed out after 30s",
		tooltip: "Retried 3 times before giving up",
	},
};

export const WithIconOn: Story = {
	args: {
		value: "On",
		toneMap: { On: "success", Off: "neutral" },
		icon: <Eye size={12} />,
	},
};

export const WithIconOff: Story = {
	args: {
		value: "Off",
		toneMap: { On: "success", Off: "neutral" },
		icon: <EyeOff size={12} />,
	},
};

export const WithIconAndTooltip: Story = {
	args: {
		value: "Verified",
		toneMap: { Verified: "success" },
		icon: <ShieldCheck size={12} />,
		tooltip: "Account 2FA is enabled",
	},
};

export const NullValue: Story = {
	args: {
		value: null,
	},
};
