import { HStack } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { BarChart3, DollarSign, Users } from "lucide-react";
import { Stat } from "./stat";

const meta = {
	title: "Atoms/Stat",
	component: Stat,
} satisfies Meta<typeof Stat>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		label: "Total Revenue",
		value: "$45,231",
		icon: <DollarSign size={16} />,
	},
};

export const Loading: Story = {
	args: {
		label: "Loading...",
		loading: true,
		icon: <BarChart3 size={16} />,
	},
};

export const Multiple: Story = {
	args: {
		label: "Revenue",
		value: "$12,345",
	},
	render() {
		return (
			<HStack gap={4}>
				<Stat label="Revenue" value="$12,345" icon={<DollarSign size={16} />} />
				<Stat label="Users" value="1,234" icon={<Users size={16} />} />
				<Stat
					label="Growth"
					value="+12.5%"
					icon={<BarChart3 size={16} />}
				/>
			</HStack>
		);
	},
};
