import type { Meta, StoryObj } from "@storybook/react";
import { SearchInput } from "./search-input";

const meta = {
	title: "Forms/SearchInput",
	component: SearchInput,
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		onSearch: (query) => console.log("Search:", query),
		placeholder: "Search...",
	},
};

export const WithCustomDebounce: Story = {
	args: {
		onSearch: (query) => console.log("Search:", query),
		placeholder: "Type to search (500ms debounce)...",
		debounceMs: 500,
	},
};

export const WithMaxWidth: Story = {
	args: {
		onSearch: (query) => console.log("Search:", query),
		maxWidth: "320px",
		placeholder: "Narrow search...",
	},
};
