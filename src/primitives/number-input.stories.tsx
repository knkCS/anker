import type { Meta, StoryObj } from "@storybook/react";
import {
	NumberInputField,
	NumberInputLabel,
	NumberInputRoot,
} from "./number-input";

const meta = {
	title: "Primitives/NumberInput",
	component: NumberInputRoot,
} satisfies Meta<typeof NumberInputRoot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		defaultValue: "5",
		min: 0,
		max: 100,
		children: <NumberInputField />,
	},
};

export const WithLabel: Story = {
	render() {
		return (
			<NumberInputRoot defaultValue="10" min={0} max={100}>
				<NumberInputLabel>Quantity</NumberInputLabel>
				<NumberInputField />
			</NumberInputRoot>
		);
	},
};

export const WithoutStepper: Story = {
	args: {
		showStepper: false,
		defaultValue: "42",
		children: <NumberInputField />,
	},
};

export const WithStep: Story = {
	args: {
		defaultValue: "0",
		min: 0,
		max: 100,
		step: 5,
		children: <NumberInputField />,
	},
};
