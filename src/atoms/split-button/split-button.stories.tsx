import type { Meta, StoryObj } from "@storybook/react";
import { Plus } from "lucide-react";
import { SplitButton } from "./split-button";

const meta = {
	title: "Atoms/SplitButton",
	component: SplitButton,
} satisfies Meta<typeof SplitButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const taskTypes = [
	{ label: "Bug", onClick: () => {} },
	{ label: "Epic", onClick: () => {} },
	{ label: "Create from template", onClick: () => {} },
];

/**
 * SplitButton sets no variant of its own, so this is `Button`'s default look.
 * See `SmallSolid` for the primary-action appearance.
 */
export const Default: Story = {
	args: {
		label: "Create task",
		menuAriaLabel: "Choose a task type",
		onClick: () => {},
		menuItems: taskTypes,
	},
};

export const WithIcon: Story = {
	args: {
		...Default.args,
		icon: <Plus size={16} />,
	},
};

/** The spinner belongs to the default action; the chevron half only waits. */
export const Loading: Story = {
	args: {
		...Default.args,
		loading: true,
	},
};

export const WithDestructiveItem: Story = {
	args: {
		label: "Archive",
		menuAriaLabel: "Choose what to do with this task",
		onClick: () => {},
		menuItems: [
			{ label: "Archive and notify", onClick: () => {} },
			{ label: "Delete permanently", onClick: () => {}, destructive: true },
			{ label: "Merge into…", onClick: () => {}, disabled: true },
		],
	},
};

/**
 * Proves `size`, `variant` and `colorPalette` reach both halves — they used to
 * be discarded, which left this control `lg` and Chakra-blue next to the `md`
 * primary buttons beside it (#192).
 */
export const SmallSolid: Story = {
	args: {
		...Default.args,
		icon: <Plus size={16} />,
		size: "sm",
		variant: "solid",
		colorPalette: "primary",
	},
};
