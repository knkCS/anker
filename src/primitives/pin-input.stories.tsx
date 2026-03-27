import type { Meta, StoryObj } from "@storybook/react";
import { Stack } from "./layout";
import { PinInput } from "./pin-input";

const meta = {
	title: "Primitives/PinInput",
	component: PinInput,
} satisfies Meta<typeof PinInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		length: 4,
	},
};

export const SixDigits: Story = {
	args: {
		length: 6,
	},
};

export const Alphanumeric: Story = {
	args: {
		length: 4,
		type: "alphanumeric",
	},
};

export const OneTimeCode: Story = {
	args: {
		length: 6,
		otp: true,
	},
};

export const Sizes: Story = {
	render() {
		return (
			<Stack gap={4}>
				<PinInput length={4} size="sm" />
				<PinInput length={4} size="md" />
				<PinInput length={4} size="lg" />
			</Stack>
		);
	},
};
