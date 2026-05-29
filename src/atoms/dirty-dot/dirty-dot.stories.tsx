import type { Meta, StoryObj } from "@storybook/react";
import { DirtyDot } from "./dirty-dot";

const meta = {
	title: "Atoms/DirtyDot",
	component: DirtyDot,
	args: { active: true },
	argTypes: {
		active: { control: "boolean" },
		label: { control: "text" },
	},
} satisfies Meta<typeof DirtyDot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
	render: (args) => (
		<span style={{ font: "14px system-ui" }}>
			Editor
			<DirtyDot {...args} />
		</span>
	),
};

export const Hidden: Story = {
	args: { active: false },
	render: (args) => (
		<span style={{ font: "14px system-ui" }}>
			Editor
			<DirtyDot {...args} />
		</span>
	),
};
