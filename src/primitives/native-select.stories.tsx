import type { Meta, StoryObj } from "@storybook/react";
import { Stack } from "./layout";
import { NativeSelect } from "./native-select";

const meta = {
	title: "Primitives/NativeSelect",
	component: NativeSelect,
} satisfies Meta<typeof NativeSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleOptions = (
	<>
		<option value="draft">Draft</option>
		<option value="review">In Review</option>
		<option value="published">Published</option>
		<option value="archived">Archived</option>
	</>
);

export const Default: Story = {
	args: {
		children: sampleOptions,
	},
};

export const WithPlaceholder: Story = {
	args: {
		placeholder: "Select a status",
		children: sampleOptions,
	},
};

export const Sizes: Story = {
	render() {
		return (
			<Stack gap={3} maxW="300px">
				<NativeSelect size="xs" placeholder="Extra Small">
					{sampleOptions}
				</NativeSelect>
				<NativeSelect size="sm" placeholder="Small">
					{sampleOptions}
				</NativeSelect>
				<NativeSelect size="md" placeholder="Medium (default)">
					{sampleOptions}
				</NativeSelect>
				<NativeSelect size="lg" placeholder="Large">
					{sampleOptions}
				</NativeSelect>
				<NativeSelect size="xl" placeholder="Extra Large">
					{sampleOptions}
				</NativeSelect>
			</Stack>
		);
	},
};

export const Disabled: Story = {
	args: {
		disabled: true,
		placeholder: "Disabled",
		children: sampleOptions,
	},
};
