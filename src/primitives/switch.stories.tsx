import type { Meta, StoryObj } from "@storybook/react";
import { Stack } from "./layout";
import { Switch } from "./switch";

const meta = {
	title: "Primitives/Switch",
	component: Switch,
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: "Enable notifications",
	},
};

export const Sizes: Story = {
	render() {
		return (
			<Stack gap="4">
				<Switch size="sm">Small</Switch>
				<Switch size="md">Medium</Switch>
				<Switch size="lg">Large</Switch>
			</Stack>
		);
	},
};

export const Disabled: Story = {
	args: {
		disabled: true,
		children: "Disabled switch",
	},
};

export const Checked: Story = {
	args: {
		defaultChecked: true,
		children: "Active",
	},
};

export const WithTrackLabel: Story = {
	args: {
		trackLabel: { on: "ON", off: "OFF" },
		size: "lg",
		children: "Track labels",
	},
};
