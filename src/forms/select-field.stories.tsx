import type { Meta, StoryObj } from "@storybook/react";
import { FormProvider, useForm } from "react-hook-form";
import { SelectField } from "./select-field";

const meta = {
	title: "Forms/SelectField",
	component: SelectField,
	decorators: [
		(Story) => {
			const methods = useForm({
				defaultValues: { role: "" },
			});
			return (
				<FormProvider {...methods}>
					<Story />
				</FormProvider>
			);
		},
	],
} satisfies Meta<typeof SelectField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		name: "role",
		label: "Role",
		placeholder: "Select a role...",
		children: (
			<>
				<option value="admin">Admin</option>
				<option value="editor">Editor</option>
				<option value="viewer">Viewer</option>
			</>
		),
	},
};

export const WithHelperText: Story = {
	args: {
		name: "role",
		label: "Role",
		helperText: "Select the user's role",
		children: (
			<>
				<option value="admin">Admin</option>
				<option value="editor">Editor</option>
				<option value="viewer">Viewer</option>
			</>
		),
	},
};
