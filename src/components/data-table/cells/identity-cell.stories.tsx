import type { Meta, StoryObj } from "@storybook/react";
import { IdentityCell } from "./identity-cell";

const meta = {
	title: "Components/DataTable/Cells/IdentityCell",
	component: IdentityCell,
	args: {
		name: "Jane Doe",
		subText: "jane@example.com",
	},
} satisfies Meta<typeof IdentityCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithImage: Story = {
	args: {
		name: "Jane Doe",
		subText: "jane@example.com",
		avatarSrc: "https://i.pravatar.cc/150?u=jane",
	},
};

export const NameOnly: Story = {
	args: {
		name: "Jane Doe",
	},
};

export const ExplicitFallback: Story = {
	args: {
		name: "Jane Doe",
		subText: "Admin",
		avatarFallback: "JD",
	},
};

export const SizeMd: Story = {
	args: {
		name: "Jane Doe",
		subText: "jane@example.com",
		size: "md",
	},
};

export const NullName: Story = {
	args: {
		name: null,
	},
};
