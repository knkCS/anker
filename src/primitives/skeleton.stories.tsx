import type { Meta, StoryObj } from "@storybook/react";
import { HStack, Stack } from "./layout";
import { Skeleton, SkeletonCircle, SkeletonText } from "./skeleton";

const meta = {
	title: "Primitives/Skeleton",
	component: Skeleton,
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Stack gap={6} maxW="400px">
			<HStack gap={4}>
				<SkeletonCircle size={12} />
				<Stack gap={2} flex={1}>
					<Skeleton height="4" />
					<Skeleton height="4" width="60%" />
				</Stack>
			</HStack>
			<SkeletonText lines={4} />
			<Skeleton height="120px" borderRadius="md" />
		</Stack>
	),
};
