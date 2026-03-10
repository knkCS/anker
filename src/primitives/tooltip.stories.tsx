import { Button } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { Tooltip } from "./tooltip";

const meta = {
	title: "Primitives/Tooltip",
	component: Tooltip,
	args: {
		content: "This is a tooltip",
	},
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render(args) {
		return (
			<Tooltip {...args}>
				<Button variant="outline">Hover me</Button>
			</Tooltip>
		);
	},
};

export const WithArrow: Story = {
	args: {
		showArrow: true,
		content: "Tooltip with arrow",
	},
	render(args) {
		return (
			<Tooltip {...args}>
				<Button variant="outline">With arrow</Button>
			</Tooltip>
		);
	},
};

export const Disabled: Story = {
	args: {
		disabled: true,
		content: "You won't see this",
	},
	render(args) {
		return (
			<Tooltip {...args}>
				<Button variant="outline">No tooltip</Button>
			</Tooltip>
		);
	},
};
