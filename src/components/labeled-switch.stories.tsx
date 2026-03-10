import { Stack } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { LabeledSwitch } from "./labeled-switch";

const meta = {
	title: "Components/LabeledSwitch",
	component: LabeledSwitch,
} satisfies Meta<typeof LabeledSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		name: "notifications",
		label: "Enable notifications",
	},
};

export const Multiple: Story = {
	render() {
		return (
			<Stack gap="4">
				<LabeledSwitch name="email" label="Email notifications" />
				<LabeledSwitch name="sms" label="SMS notifications" />
				<LabeledSwitch
					name="push"
					label="Push notifications"
					defaultChecked
				/>
			</Stack>
		);
	},
};
