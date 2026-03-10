import type { Meta, StoryObj } from "@storybook/react";
import { FormProvider, useForm } from "react-hook-form";
import { DatePickerField } from "./date-picker-field";

const meta = {
	title: "Forms/DatePickerField",
	component: DatePickerField,
	decorators: [
		(Story) => {
			const methods = useForm({
				defaultValues: { startDate: "" },
			});
			return (
				<FormProvider {...methods}>
					<Story />
				</FormProvider>
			);
		},
	],
} satisfies Meta<typeof DatePickerField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		name: "startDate",
		label: "Start Date",
	},
};

export const WithMinMax: Story = {
	args: {
		name: "startDate",
		label: "Start Date",
		min: "2024-01-01",
		max: "2024-12-31",
		helperText: "Select a date in 2024",
	},
};

export const DateTime: Story = {
	args: {
		name: "startDate",
		label: "Start Date & Time",
		type: "datetime-local",
	},
};
