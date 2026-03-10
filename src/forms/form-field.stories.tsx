import { Input } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { FormProvider, useForm } from "react-hook-form";
import { FormField } from "./form-field";

const meta = {
	title: "Forms/FormField",
	component: FormField,
	decorators: [
		(Story) => {
			const methods = useForm({
				defaultValues: { example: "" },
			});
			return (
				<FormProvider {...methods}>
					<Story />
				</FormProvider>
			);
		},
	],
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		name: "example",
		label: "Example Field",
		helperText: "This is a helper text",
		children: (field) => <Input {...field} value={field.value ?? ""} />,
	},
};

export const Required: Story = {
	args: {
		name: "example",
		label: "Required Field",
		required: true,
		children: (field) => <Input {...field} value={field.value ?? ""} />,
	},
};
