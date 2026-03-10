import { Button, Icon } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { InboxIcon } from "lucide-react";
import { EmptyState } from "./empty-state";

const meta = {
	title: "Atoms/EmptyState",
	component: EmptyState,
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		header: "No results found",
		description: "Try adjusting your search or filters.",
	},
};

export const WithIcon: Story = {
	args: {
		header: "No items found",
		description: "There are no items to display. Try adding some.",
		icon: (
			<Icon asChild color="muted" boxSize={10}>
				<InboxIcon />
			</Icon>
		),
	},
};

export const WithActions: Story = {
	args: {
		header: "No items yet",
		description: "Get started by creating your first item.",
		actions: <Button>Create item</Button>,
	},
};
