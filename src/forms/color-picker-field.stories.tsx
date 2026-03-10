import type { Meta, StoryObj } from "@storybook/react";
import { FormProvider, useForm } from "react-hook-form";
import { ColorPickerField } from "./color-picker-field";

const meta = {
	title: "Forms/ColorPickerField",
	component: ColorPickerField,
	decorators: [
		(Story) => {
			const methods = useForm({
				defaultValues: { color: "#3182ce" },
			});
			return (
				<FormProvider {...methods}>
					<Story />
				</FormProvider>
			);
		},
	],
} satisfies Meta<typeof ColorPickerField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		name: "color",
		label: "Brand Color",
	},
};

export const WithHelperText: Story = {
	args: {
		name: "color",
		label: "Brand Color",
		helperText: "Choose your brand color",
	},
};
