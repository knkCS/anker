import type { Meta, StoryObj } from "@storybook/react";
import { CountCell } from "./count-cell";

const meta = {
	title: "Components/DataTable/Cells/CountCell",
	component: CountCell,
	args: {
		singular: "item",
		plural: "items",
	},
} satisfies Meta<typeof CountCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		value: ["apple", "banana", "cherry"],
	},
};

export const ObjectCount: Story = {
	args: {
		value: { name: "Alice", age: 30, role: "admin" },
		singular: "field",
		plural: "fields",
	},
};

export const SingleItem: Story = {
	args: {
		value: ["only-one"],
	},
};

export const NumericValue: Story = {
	args: {
		value: 42,
		singular: "record",
		plural: "records",
	},
};

export const NullValue: Story = {
	args: {
		value: null,
	},
};
