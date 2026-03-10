import type { Meta, StoryObj } from "@storybook/react";
import { FormProvider, useForm } from "react-hook-form";
import { InputField } from "./input-field";

const meta = {
	title: "Forms/InputField",
	component: InputField,
	decorators: [
		(Story) => {
			const methods = useForm({
				defaultValues: { name: "", email: "", url: "" },
			});
			return (
				<FormProvider {...methods}>
					<Story />
				</FormProvider>
			);
		},
	],
} satisfies Meta<typeof InputField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		name: "name",
		label: "Name",
		placeholder: "Enter your name",
	},
};

export const WithPrependAndAppend: Story = {
	args: {
		name: "url",
		label: "Website",
		prepend: "https://",
		append: ".com",
		placeholder: "example",
	},
};

export const ReadOnly: Story = {
	args: {
		name: "email",
		label: "Email",
		readOnly: true,
	},
};
