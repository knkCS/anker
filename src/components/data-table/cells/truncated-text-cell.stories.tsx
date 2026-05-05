import type { Meta, StoryObj } from "@storybook/react";
import { TruncatedTextCell } from "./truncated-text-cell";

const meta = {
	title: "Components/DataTable/Cells/TruncatedTextCell",
	component: TruncatedTextCell,
	args: {
		value:
			"A long description that may need to be truncated if it exceeds the limit",
	},
} satisfies Meta<typeof TruncatedTextCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithTruncation: Story = {
	args: {
		value:
			"A long description that may need to be truncated if it exceeds the limit",
		maxLength: 20,
	},
};

export const WithSubText: Story = {
	args: {
		value: "service-account-key",
		subText: "Created 2 days ago",
	},
};

export const TruncationWithSubText: Story = {
	args: {
		value:
			"A long description that may need to be truncated if it exceeds the limit",
		maxLength: 30,
		subText: "Owner: jane@example.com",
	},
};

export const NullValue: Story = {
	args: {
		value: null,
	},
};
