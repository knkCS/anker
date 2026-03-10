import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { EditableHeading } from "./editable-heading";

const meta = {
	title: "Forms/EditableHeading",
	component: EditableHeading,
} satisfies Meta<typeof EditableHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		value: "My Page Title",
	},
};

const InteractiveRender = () => {
	const [value, setValue] = useState("Click to edit");
	return (
		<EditableHeading
			value={value}
			onChange={setValue}
			onSubmit={(v) => console.log("Submitted:", v)}
		/>
	);
};

export const Interactive: Story = {
	render: () => <InteractiveRender />,
};
