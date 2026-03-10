import type { Meta, StoryObj } from "@storybook/react";
import { FormProvider, useForm } from "react-hook-form";
import { NumberInputField } from "./number-input-field";

const meta = {
	title: "Forms/NumberInputField",
	component: NumberInputField,
	decorators: [
		(Story) => {
			const methods = useForm({
				defaultValues: { quantity: 1 },
			});
			return (
				<FormProvider {...methods}>
					<Story />
				</FormProvider>
			);
		},
	],
} satisfies Meta<typeof NumberInputField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		name: "quantity",
		label: "Quantity",
	},
};

export const WithMinMax: Story = {
	args: {
		name: "quantity",
		label: "Quantity (1-10)",
		min: 1,
		max: 10,
	},
};

export const NoStepper: Story = {
	args: {
		name: "quantity",
		label: "Quantity",
		showStepper: false,
	},
};
