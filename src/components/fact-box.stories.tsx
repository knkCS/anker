import { Text } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { Plus, Settings } from "lucide-react";
import { FactBox } from "./fact-box";

const meta = {
	title: "Components/FactBox",
	component: FactBox,
} satisfies Meta<typeof FactBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		name: "Details",
		children: <Text>Collapsible content goes here.</Text>,
	},
};

export const WithActions: Story = {
	args: {
		name: "Settings",
		actions: [
			{
				id: 1,
				type: "button",
				ariaLabel: "Add item",
				icon: <Plus size={16} />,
			},
			{
				id: 2,
				type: "button",
				ariaLabel: "Settings",
				icon: <Settings size={16} />,
			},
		],
		children: <Text>Content with action buttons.</Text>,
	},
};

export const NonCollapsible: Story = {
	args: {
		name: "Fixed Section",
		collapsible: false,
		children: <Text>This content is always visible.</Text>,
	},
};
