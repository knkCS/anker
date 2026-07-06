import { Input, Stack } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { FormProvider, useForm } from "react-hook-form";
import { FormField } from "./form-field";
import { FormMarkersProvider } from "./form-markers";

const meta = {
	title: "Forms/FormField",
	component: FormField,
	decorators: [
		(Story) => {
			const methods = useForm({
				defaultValues: { example: "", other: "" },
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

export const OptionalText: Story = {
	args: {
		name: "example",
		label: "Optional Field",
		optionalText: "(optional)",
		children: (field) => <Input {...field} value={field.value ?? ""} />,
	},
};

/** §10 form-level convention: mostly-required forms mark the optionals
 * instead of showing asterisks — one provider at the form root. */
export const FormLevelConvention: Story = {
	args: {
		name: "example",
		label: "",
		children: () => null,
	},
	render: () => (
		<FormMarkersProvider
			value={{ showRequiredIndicator: false, optionalText: "(optional)" }}
		>
			<Stack gap="5">
				<FormField name="example" label="Required Field" required>
					{(field) => <Input {...field} value={field.value ?? ""} />}
				</FormField>
				<FormField name="other" label="Optional Field">
					{(field) => <Input {...field} value={field.value ?? ""} />}
				</FormField>
			</Stack>
		</FormMarkersProvider>
	),
};
