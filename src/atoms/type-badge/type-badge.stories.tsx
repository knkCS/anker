import { HStack } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { TypeBadge } from "./type-badge";

const meta = {
	title: "Atoms/TypeBadge",
	component: TypeBadge,
} satisfies Meta<typeof TypeBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		name: "Feature",
	},
};

export const Variants: Story = {
	args: {
		name: "Feature",
	},
	render() {
		return (
			<HStack gap={2}>
				<TypeBadge name="Feature" />
				<TypeBadge name="Bug" />
				<TypeBadge name="Task" />
				<TypeBadge name="Story" />
			</HStack>
		);
	},
};
