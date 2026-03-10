import { Box } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { SearchInput } from "./search-input";

const meta = {
	title: "Atoms/SearchInput",
	component: SearchInput,
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		onChange: (term) => console.log("Search:", term),
		placeholder: "Search...",
	},
	render(args) {
		return (
			<Box maxW="400px">
				<SearchInput {...args} />
			</Box>
		);
	},
};

export const WithMaxWidth: Story = {
	args: {
		onChange: (term) => console.log("Search:", term),
		placeholder: "Search items...",
		maxWidth: "300px",
	},
	render(args) {
		return <SearchInput {...args} />;
	},
};
