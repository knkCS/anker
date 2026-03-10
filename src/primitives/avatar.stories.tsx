import type { Meta, StoryObj } from "@storybook/react";
import { Avatar, AvatarGroup } from "./avatar";

const meta = {
	title: "Primitives/Avatar",
	component: Avatar,
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		name: "Jane Doe",
	},
};

export const WithImage: Story = {
	args: {
		name: "Jane Doe",
		src: "https://i.pravatar.cc/150?u=jane",
	},
};

export const Sizes: Story = {
	render() {
		return (
			<AvatarGroup>
				<Avatar name="A" size="xs" />
				<Avatar name="B" size="sm" />
				<Avatar name="C" size="md" />
				<Avatar name="D" size="lg" />
				<Avatar name="E" size="xl" />
			</AvatarGroup>
		);
	},
};

export const Fallback: Story = {
	args: {
		name: "John Smith",
	},
};
