import type { Meta, StoryObj } from "@storybook/react";
import { FormProvider, useForm } from "react-hook-form";
import { RadioGroupField } from "./radio-group-field";

const meta = {
	title: "Forms/RadioGroupField",
	component: RadioGroupField,
	decorators: [
		(Story) => {
			const methods = useForm({
				defaultValues: { color: "red" },
			});
			return (
				<FormProvider {...methods}>
					<Story />
				</FormProvider>
			);
		},
	],
} satisfies Meta<typeof RadioGroupField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		name: "color",
		label: "Favorite Color",
		options: [
			{ label: "Red", value: "red" },
			{ label: "Blue", value: "blue" },
			{ label: "Green", value: "green" },
		],
	},
};

export const Vertical: Story = {
	args: {
		name: "color",
		label: "Favorite Color",
		options: [
			{ label: "Red", value: "red" },
			{ label: "Blue", value: "blue" },
			{ label: "Green", value: "green" },
		],
		stackProps: { direction: "column" },
	},
};
