import type { Meta, StoryObj } from "@storybook/react";
import { Plus, Settings, Trash, X } from "lucide-react";
import { HStack } from "../../primitives/layout";
import { IconButton } from "./icon-button";

const meta = {
	title: "Atoms/IconButton",
	component: IconButton,
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		"aria-label": "Settings",
		children: <Settings />,
	},
};

export const Variants: Story = {
	render() {
		return (
			<HStack gap={2}>
				<IconButton variant="primary" aria-label="Add">
					<Plus />
				</IconButton>
				<IconButton variant="secondary" aria-label="Settings">
					<Settings />
				</IconButton>
				<IconButton variant="outline" aria-label="Delete">
					<Trash />
				</IconButton>
				<IconButton variant="ghost" aria-label="Close">
					<X />
				</IconButton>
				<IconButton variant="link" aria-label="Add">
					<Plus />
				</IconButton>
			</HStack>
		);
	},
};

export const Sizes: Story = {
	render() {
		return (
			<HStack gap={2} alignItems="center">
				<IconButton size="xs" aria-label="Close">
					<X size={12} />
				</IconButton>
				<IconButton size="sm" aria-label="Close">
					<X size={14} />
				</IconButton>
				<IconButton size="md" aria-label="Close">
					<X size={16} />
				</IconButton>
				<IconButton size="lg" aria-label="Close">
					<X size={18} />
				</IconButton>
				<IconButton size="xl" aria-label="Close">
					<X size={20} />
				</IconButton>
			</HStack>
		);
	},
};
