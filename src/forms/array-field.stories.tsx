import type { Meta, StoryObj } from "@storybook/react";
import { FormProvider, useForm } from "react-hook-form";
import { ArrayField } from "./array-field";

const meta = {
	title: "Forms/ArrayField",
	component: ArrayField,
} satisfies Meta<typeof ArrayField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dynamic: Story = {
	decorators: [
		(Story) => {
			const methods = useForm({
				defaultValues: {
					headers: [
						{ key: "Content-Type", value: "application/json" },
					],
				},
			});
			return (
				<FormProvider {...methods}>
					<Story />
				</FormProvider>
			);
		},
	],
	args: {
		name: "headers",
		label: "HTTP Headers",
		mode: "dynamic",
	},
};

export const Keyed: Story = {
	decorators: [
		(Story) => {
			const methods = useForm({
				defaultValues: {
					settings: { theme: "dark", language: "en" },
				},
			});
			return (
				<FormProvider {...methods}>
					<Story />
				</FormProvider>
			);
		},
	],
	args: {
		name: "settings",
		label: "Settings",
		mode: "keyed",
		keys: [
			{ key: "theme", value: "Theme" },
			{ key: "language", value: "Language" },
		],
	},
};
