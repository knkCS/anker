import type { Meta, StoryObj } from "@storybook/react";
import { MenuButton } from "./menu-button";

const meta = {
	title: "Atoms/MenuButton",
	component: MenuButton,
} satisfies Meta<typeof MenuButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleAction: Story = {
	args: {
		menuLabel: "Move to…",
		variant: "solid",
		colorPalette: "primary",
		actions: [{ label: "Move to In Review", onClick: () => {} }],
	},
};

export const Menu: Story = {
	args: {
		menuLabel: "Move to…",
		variant: "solid",
		colorPalette: "primary",
		actions: [
			{ label: "In Review", onClick: () => {} },
			{ label: "Approved", onClick: () => {} },
			{ label: "Archived", onClick: () => {} },
		],
	},
};

export const Empty: Story = {
	args: {
		menuLabel: "Move to…",
		actions: [],
		emptyLabel: "No transitions available",
	},
};
