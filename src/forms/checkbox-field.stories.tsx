import { Stack } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { FormProvider, useForm } from "react-hook-form";
import { CheckboxField } from "./checkbox-field";

const meta = {
	title: "Forms/CheckboxField",
	component: CheckboxField,
	decorators: [
		(Story) => {
			const methods = useForm({
				defaultValues: { agree: false, fruits: [] as string[] },
			});
			return (
				<FormProvider {...methods}>
					<Story />
				</FormProvider>
			);
		},
	],
} satisfies Meta<typeof CheckboxField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		name: "agree",
		label: "I agree to the terms and conditions",
	},
};

export const ArrayMode: Story = {
	render() {
		return (
			<Stack gap="2">
				<CheckboxField name="fruits" value="apple" label="Apple" />
				<CheckboxField name="fruits" value="banana" label="Banana" />
				<CheckboxField name="fruits" value="cherry" label="Cherry" />
			</Stack>
		);
	},
};
