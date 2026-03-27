import type { Meta, StoryObj } from "@storybook/react";
import { Stack } from "./layout";
import { SegmentedControl } from "./segmented-control";

const meta = {
	title: "Primitives/SegmentedControl",
	component: SegmentedControl,
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		defaultValue: "list",
		items: ["list", "grid", "board"],
	},
};

export const WithLabels: Story = {
	args: {
		defaultValue: "react",
		items: [
			{ value: "react", label: "React" },
			{ value: "vue", label: "Vue" },
			{ value: "angular", label: "Angular" },
		],
	},
};

export const WithDisabled: Story = {
	args: {
		defaultValue: "active",
		items: [
			{ value: "active", label: "Active" },
			{ value: "inactive", label: "Inactive" },
			{ value: "archived", label: "Archived", disabled: true },
		],
	},
};

export const Sizes: Story = {
	render() {
		const items = ["Small", "Medium", "Large"];
		return (
			<Stack gap={4}>
				<SegmentedControl items={items} defaultValue="Small" size="sm" />
				<SegmentedControl items={items} defaultValue="Medium" size="md" />
				<SegmentedControl items={items} defaultValue="Large" size="lg" />
			</Stack>
		);
	},
};
