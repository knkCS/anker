import type { Meta, StoryObj } from "@storybook/react";
import { CircleCheck } from "lucide-react";
import { HStack } from "../../primitives/layout";
import { STATUS_BADGE_TONES, StatusBadge } from "./status-badge";

const meta = {
	title: "Atoms/StatusBadge",
	component: StatusBadge,
	argTypes: {
		tone: { control: "select", options: STATUS_BADGE_TONES },
		color: { control: "color" },
	},
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		label: "Active",
		tone: "success",
	},
};

/** Every tone. Toggle the toolbar theme to see them follow dark mode. */
export const Variants: Story = {
	args: {
		label: "Active",
		tone: "success",
	},
	render() {
		return (
			<HStack gap={2}>
				<StatusBadge label="Active" tone="success" />
				<StatusBadge label="Expiring" tone="warning" />
				<StatusBadge label="Failed" tone="danger" />
				<StatusBadge label="Running" tone="info" />
				<StatusBadge label="Draft" tone="neutral" />
				<StatusBadge label="Featured" tone="accent" />
			</HStack>
		);
	},
};

export const WithIcon: Story = {
	args: {
		label: "Verified",
		tone: "success",
		icon: <CircleCheck size={12} />,
	},
};

// A status colour picked by a user and stored in the backend. In a real
// screen it arrives as data (`color={status.color}`); the literals below
// only stand in for that data.
const userStatuses = [
	{ name: "Lead", color: "#7c3aed" },
	{ name: "Contacted", color: "#0891b2" },
	{ name: "Won", color: "#ca8a04" },
];

/** `color` is for data-driven colours only — write `tone` in code. */
export const DataDrivenColor: Story = {
	args: {
		label: "Lead",
		color: userStatuses[0].color,
	},
	render() {
		return (
			<HStack gap={2}>
				{userStatuses.map((status) => (
					<StatusBadge
						key={status.name}
						label={status.name}
						color={status.color}
					/>
				))}
			</HStack>
		);
	},
};
