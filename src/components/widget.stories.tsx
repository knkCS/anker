import type { Meta, StoryObj } from "@storybook/react";
import { BarChart3, Users } from "lucide-react";
import { Text } from "../primitives/typography";
import { Widget } from "./widget";

const meta = {
	title: "Components/Widget",
	component: Widget,
} satisfies Meta<typeof Widget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		heading: "Total Users",
		subHeading: "Last 30 days",
		icon: <Users size={20} />,
		children: (
			<Text fontSize="3xl" fontWeight="bold">
				1,234
			</Text>
		),
	},
};

export const WithChart: Story = {
	args: {
		heading: "Revenue",
		icon: <BarChart3 size={20} />,
		children: (
			<Text fontSize="3xl" fontWeight="bold">
				$12,345
			</Text>
		),
	},
};
