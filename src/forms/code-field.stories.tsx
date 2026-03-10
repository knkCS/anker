import type { Meta, StoryObj } from "@storybook/react";
import { FormProvider, useForm } from "react-hook-form";
import { CodeField } from "./code-field";

const meta = {
	title: "Forms/CodeField",
	component: CodeField,
	decorators: [
		(Story) => {
			const methods = useForm({
				defaultValues: { code: "const hello = 'world';" },
			});
			return (
				<FormProvider {...methods}>
					<Story />
				</FormProvider>
			);
		},
	],
} satisfies Meta<typeof CodeField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		name: "code",
		label: "Code Editor",
		helperText:
			"Pass the Editor prop from @monaco-editor/react for full editor experience",
	},
};

export const ReadOnly: Story = {
	args: {
		name: "code",
		label: "Read-only Code",
		readOnly: true,
	},
};
