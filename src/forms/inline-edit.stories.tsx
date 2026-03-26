import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { InlineEdit } from "./inline-edit";

const meta = {
	title: "Forms/InlineEdit",
	component: InlineEdit,
} satisfies Meta<typeof InlineEdit>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		value: "Click to edit",
	},
};

const InteractiveRender = () => {
	const [value, setValue] = useState("Click to edit");
	return (
		<InlineEdit
			value={value}
			onChange={setValue}
			onSubmit={(v) => console.log("Submitted:", v)}
		/>
	);
};

export const Interactive: Story = {
	render: () => <InteractiveRender />,
};

export const Textarea: Story = {
	args: {
		variant: "textarea",
		value: "This is a multi-line\ntext value that spans\nseveral lines.",
		rows: 4,
	},
};

export const Disabled: Story = {
	args: {
		disabled: true,
		value: "Cannot edit this",
	},
};

export const AllowEmpty: Story = {
	args: {
		allowEmpty: true,
		value: "Clear me",
	},
};

export const HeadingStyle: Story = {
	args: {
		fontSize: "3xl",
		fontWeight: "bold",
		value: "Page Title",
	},
};
