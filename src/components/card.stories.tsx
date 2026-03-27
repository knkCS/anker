import type { Meta, StoryObj } from "@storybook/react";
import { Text } from "../primitives/typography";
import { Card } from "./card";

const meta = {
	title: "Components/Card",
	component: Card,
} satisfies Meta<typeof Card>;

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
