import type { Meta, StoryObj } from "@storybook/react";
import { FormProvider, useForm } from "react-hook-form";
import { MarkdownField } from "./markdown-field";

const meta = {
	title: "Forms/MarkdownField",
	component: MarkdownField,
	decorators: [
		(Story) => {
			const methods = useForm({
				defaultValues: { content: "# Hello\n\nThis is **markdown**." },
			});
			return (
				<FormProvider {...methods}>
					<Story />
				</FormProvider>
			);
		},
	],
} satisfies Meta<typeof MarkdownField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		name: "content",
		label: "Content",
		helperText:
			"Pass the MDEditor prop from @uiw/react-md-editor for full editor experience",
	},
};

export const ReadOnly: Story = {
	args: {
		name: "content",
		label: "Content (Read Only)",
		readOnly: true,
	},
};
