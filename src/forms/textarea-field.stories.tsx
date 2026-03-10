import type { Meta, StoryObj } from "@storybook/react";
import { FormProvider, useForm } from "react-hook-form";
import { TextareaField } from "./textarea-field";

const meta = {
	title: "Forms/TextareaField",
	component: TextareaField,
	decorators: [
		(Story) => {
			const methods = useForm({
				defaultValues: { description: "" },
			});
			return (
				<FormProvider {...methods}>
					<Story />
				</FormProvider>
			);
		},
	],
} satisfies Meta<typeof TextareaField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		name: "description",
		label: "Description",
		placeholder: "Enter a description...",
	},
};

export const WithHelperText: Story = {
	args: {
		name: "description",
		label: "Description",
		helperText: "Maximum 500 characters",
		placeholder: "Enter a description...",
	},
};
