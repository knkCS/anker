import type { Meta, StoryObj } from "@storybook/react";
import { FormProvider, useForm } from "react-hook-form";
import { FileField } from "./file-field";

const meta = {
	title: "Forms/FileField",
	component: FileField,
	decorators: [
		(Story) => {
			const methods = useForm({
				defaultValues: { file: null },
			});
			return (
				<FormProvider {...methods}>
					<Story />
				</FormProvider>
			);
		},
	],
} satisfies Meta<typeof FileField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		name: "file",
		label: "Upload File",
		helperText:
			"Pass the useDropzone hook from react-dropzone for drag-and-drop support",
	},
};

export const Disabled: Story = {
	args: {
		name: "file",
		label: "Upload File",
		disabled: true,
	},
};
