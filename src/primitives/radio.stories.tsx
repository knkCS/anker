import type { Meta, StoryObj } from "@storybook/react";
import { Stack } from "./layout";
import { Radio, RadioGroup } from "./radio";

const meta = {
	title: "Primitives/Radio",
	component: Radio,
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj;

export const Default: Story = {
	render() {
		return (
			<RadioGroup defaultValue="option1">
				<Stack gap="2">
					<Radio value="option1">Option 1</Radio>
					<Radio value="option2">Option 2</Radio>
					<Radio value="option3">Option 3</Radio>
				</Stack>
			</RadioGroup>
		);
	},
};

export const Sizes: Story = {
	render() {
		return (
			<Stack gap="4">
				<RadioGroup defaultValue="sm" size="sm">
					<Stack direction="row" gap="4">
						<Radio value="sm">Small</Radio>
						<Radio value="sm2">Small 2</Radio>
					</Stack>
				</RadioGroup>
				<RadioGroup defaultValue="md" size="md">
					<Stack direction="row" gap="4">
						<Radio value="md">Medium</Radio>
						<Radio value="md2">Medium 2</Radio>
					</Stack>
				</RadioGroup>
				<RadioGroup defaultValue="lg" size="lg">
					<Stack direction="row" gap="4">
						<Radio value="lg">Large</Radio>
						<Radio value="lg2">Large 2</Radio>
					</Stack>
				</RadioGroup>
			</Stack>
		);
	},
};
