import { Input } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ControlledFormField } from "./controlled-form-field";

const meta = {
	title: "Forms/ControlledFormField",
	component: ControlledFormField,
} satisfies Meta<typeof ControlledFormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		name: "example",
		label: "Controlled Field",
		helperText: "This field does not use React Hook Form",
		children: <Input />,
	},
};

export const WithError: Story = {
	args: {
		name: "example",
		label: "Field with Error",
		errorMessage: "This field is required",
		children: <Input />,
	},
};

export const Interactive: Story = {
	render() {
		const [value, setValue] = useState("");
		const error = value.length === 0 ? "Required" : undefined;
		return (
			<ControlledFormField
				name="demo"
				label="Interactive Field"
				errorMessage={error}
			>
				<Input
					value={value}
					onChange={(e) => setValue(e.target.value)}
					placeholder="Type something..."
				/>
			</ControlledFormField>
		);
	},
};
