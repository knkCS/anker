import { Text } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { CardRoot } from "./card";

const meta = {
	title: "Components/Card",
	component: CardRoot,
} satisfies Meta<typeof CardRoot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: <Text>Card content goes here.</Text>,
	},
};

export const WithMaxWidth: Story = {
	args: {
		maxW: "lg",
		children: <Text>A card with a constrained max width.</Text>,
	},
};
