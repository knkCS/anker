import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Box } from "../../primitives/layout";
import { BaseSelect } from "./base-select";
import type { BaseOption } from "./types";

const meta = {
	title: "Atoms/Select",
} satisfies Meta;

export default meta;
type Story = StoryObj;

const options: BaseOption[] = [
	{ id: "1", label: "Option 1" },
	{ id: "2", label: "Option 2" },
	{ id: "3", label: "Option 3", color: "#e53e3e" },
	{ id: "4", label: "Option 4", avatar: "John Doe" },
];

function DefaultDemo() {
	const [value, setValue] = useState<BaseOption | null>(null);
	return (
		<Box maxW="400px">
			<BaseSelect
				value={value}
				onChange={(newValue) => setValue(newValue as BaseOption)}
				options={options}
				placeholder="Select an option..."
			/>
		</Box>
	);
}

export const Default: Story = {
	render: () => <DefaultDemo />,
};

function MultiDemo() {
	const [value, setValue] = useState<BaseOption[]>([]);
	return (
		<Box maxW="400px">
			<BaseSelect
				value={value}
				onChange={(newValue) => setValue(newValue as BaseOption[])}
				options={options}
				isMulti
				placeholder="Select options..."
			/>
		</Box>
	);
}

export const Multi: Story = {
	render: () => <MultiDemo />,
};
