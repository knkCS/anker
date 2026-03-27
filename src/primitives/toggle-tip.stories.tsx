import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../atoms/button/button";
import { InfoTip, ToggleTip } from "./toggle-tip";
import { Text } from "./typography";

const meta = {
	title: "Primitives/ToggleTip",
	component: ToggleTip,
} satisfies Meta<typeof ToggleTip>;

export default meta;
type Story = StoryObj;

export const Default: Story = {
	render() {
		return (
			<ToggleTip content="This is helpful information">
				<Button variant="outline" size="sm">
					Click for info
				</Button>
			</ToggleTip>
		);
	},
};

export const WithArrow: Story = {
	render() {
		return (
			<ToggleTip showArrow content="Tooltip content with an arrow">
				<Button variant="outline" size="sm">
					With arrow
				</Button>
			</ToggleTip>
		);
	},
};

export const InfoTipExample: Story = {
	render() {
		return (
			<Text>
				Some label <InfoTip>Additional context about this field.</InfoTip>
			</Text>
		);
	},
};
