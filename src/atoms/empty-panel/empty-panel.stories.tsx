import type { Meta, StoryObj } from "@storybook/react";
import { EmptyPanel } from "./empty-panel";

const meta = {
	title: "Atoms/EmptyPanel",
	component: EmptyPanel,
} satisfies Meta<typeof EmptyPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		header: "No items found",
		description: "There are no items to display. Try adding some.",
	},
};
