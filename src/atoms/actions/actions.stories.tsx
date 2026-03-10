import { HStack } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { Collapse } from "./collapse";
import { Edit } from "./edit";
import { Filter } from "./filter";
import { Handle } from "./handle";
import { Remove } from "./remove";

const meta = {
	title: "Atoms/Actions",
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const AllActions: Story = {
	render() {
		return (
			<HStack gap={4}>
				<Edit />
				<Remove />
				<Collapse collapsed={false} />
				<Collapse collapsed={true} />
				<Handle />
			</HStack>
		);
	},
};

export const FilterAction: Story = {
	render() {
		return (
			<HStack gap={4}>
				<Filter />
				<Filter activeFilterCount={3} />
			</HStack>
		);
	},
};
