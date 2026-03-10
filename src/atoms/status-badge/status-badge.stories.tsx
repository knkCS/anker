import { HStack } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { StatusBadge } from "./status-badge";

const meta = {
	title: "Atoms/StatusBadge",
	component: StatusBadge,
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		label: "Active",
		color: "#38A169",
	},
};

export const Variants: Story = {
	args: {
		label: "Active",
		color: "#38A169",
	},
	render() {
		return (
			<HStack gap={2}>
				<StatusBadge label="Active" color="#38A169" />
				<StatusBadge label="Pending" color="#ECC94B" />
				<StatusBadge label="Inactive" color="#E53E3E" />
				<StatusBadge label="Draft" color="#718096" />
				<StatusBadge label="Published" color="#3182CE" />
			</HStack>
		);
	},
};
