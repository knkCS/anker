import type { Meta, StoryObj } from "@storybook/react";
import { FormProvider, useForm } from "react-hook-form";
import { IconPickerField } from "./icon-picker-field";

const meta = {
	title: "Forms/IconPickerField",
	component: IconPickerField,
	parameters: {
		docs: {
			description: {
				component:
					'A form-bound `IconPicker`. The form value is the lucide name as a plain string (`"file-text"`), `null` when cleared — the shape a text field holding an icon name already stored.',
			},
		},
	},
	decorators: [
		(Story) => {
			const methods = useForm({
				defaultValues: { icon: "file-text", empty: null },
			});
			return (
				<FormProvider {...methods}>
					<Story />
				</FormProvider>
			);
		},
	],
} satisfies Meta<typeof IconPickerField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		name: "icon",
		label: "Icon",
		helperText: "Shown next to the blueprint in lists and the sidebar",
	},
};

export const Empty: Story = {
	args: {
		name: "empty",
		label: "Icon",
		required: true,
	},
};

export const Disabled: Story = {
	args: {
		name: "icon",
		label: "Icon",
		disabled: true,
	},
};
