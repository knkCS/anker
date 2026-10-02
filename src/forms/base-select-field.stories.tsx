import type { Meta, StoryObj } from "@storybook/react";
import { FormProvider, useForm } from "react-hook-form";
import type { BaseOption } from "../atoms/select/types";
import { BaseSelectField } from "./base-select-field";

const roles: BaseOption[] = [
	{ id: "admin", label: "Admin" },
	{ id: "editor", label: "Editor" },
	{ id: "viewer", label: "Viewer" },
];

const meta = {
	title: "Forms/BaseSelectField",
	component: BaseSelectField,
	parameters: {
		docs: {
			description: {
				component:
					"The select for a form whose options are already in hand. The form value is the option's `id` (an array of ids with `isMulti`, `null` when cleared). Options from a server: `LookupSelectField`.",
			},
		},
	},
	decorators: [
		(Story) => {
			const methods = useForm({
				defaultValues: { role: "editor", tags: ["admin"] },
			});
			return (
				<FormProvider {...methods}>
					<Story />
				</FormProvider>
			);
		},
	],
} satisfies Meta<typeof BaseSelectField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		name: "role",
		label: "Role",
		placeholder: "Select a role…",
		helperText: "What this person may do",
		options: roles,
	},
};

export const Multi: Story = {
	args: {
		name: "tags",
		label: "Roles",
		options: roles,
		isMulti: true,
	},
};

export const NotClearable: Story = {
	args: {
		name: "role",
		label: "Role",
		options: roles,
		isClearable: false,
		required: true,
	},
};

export const Grouped: Story = {
	args: {
		name: "role",
		label: "Role",
		options: [
			{ label: "Staff", options: roles.slice(0, 2) },
			{ label: "Guests", options: roles.slice(2) },
		],
	},
};

export const Disabled: Story = {
	args: {
		name: "role",
		label: "Role",
		options: roles,
		disabled: true,
	},
};
