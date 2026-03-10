import type { Meta, StoryObj } from "@storybook/react";
import { FormProvider, useForm } from "react-hook-form";
import { SwitchField } from "./switch-field";

const meta = {
	title: "Forms/SwitchField",
	component: SwitchField,
	decorators: [
		(Story) => {
			const methods = useForm({
				defaultValues: { notifications: false },
			});
			return (
				<FormProvider {...methods}>
					<Story />
				</FormProvider>
			);
		},
	],
} satisfies Meta<typeof SwitchField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		name: "notifications",
		label: "Enable Notifications",
	},
};

export const WithHelperText: Story = {
	args: {
		name: "notifications",
		label: "Enable Notifications",
		helperText: "You will receive email notifications",
	},
};

export const Disabled: Story = {
	args: {
		name: "notifications",
		label: "Enable Notifications",
		disabled: true,
	},
};
