import { HStack, Stack } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { Progress, ProgressCircle } from "./progress";

const meta = {
	title: "Primitives/Progress",
	component: Progress,
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		value: 45,
		maxW: "400px",
	},
};

export const WithLabel: Story = {
	args: {
		value: 65,
		label: "Uploading...",
		showValue: true,
		maxW: "400px",
	},
};

export const Sizes: Story = {
	render() {
		return (
			<Stack gap={4} maxW="400px">
				<Progress value={30} size="xs" />
				<Progress value={50} size="sm" />
				<Progress value={70} size="md" />
				<Progress value={90} size="lg" />
			</Stack>
		);
	},
};

export const Circle: Story = {
	render() {
		return (
			<HStack gap={6}>
				<ProgressCircle value={25} showValue size="md" />
				<ProgressCircle value={50} showValue size="md" colorPalette="primary" />
				<ProgressCircle
					value={75}
					showValue
					size="md"
					colorPalette="secondary"
				/>
			</HStack>
		);
	},
};

export const Indeterminate: Story = {
	args: {
		value: null,
		maxW: "400px",
	},
};
