import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "../../primitives/badge";
import {
	DataList,
	DataListItem,
	DataListItemLabel,
	DataListItemValue,
} from "./data-list";

const meta = {
	title: "Atoms/DataList",
	component: DataList,
} satisfies Meta<typeof DataList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		items: [
			{ label: "Name", value: "Max Mustermann" },
			{ label: "Email", value: "max@knk.de" },
			{ label: "Role", value: "Administrator" },
			{ label: "Status", value: "Active" },
		],
	},
};

export const Composed: Story = {
	render() {
		return (
			<DataList>
				<DataListItem>
					<DataListItemLabel>Status</DataListItemLabel>
					<DataListItemValue>
						<Badge colorPalette="green">Active</Badge>
					</DataListItemValue>
				</DataListItem>
				<DataListItem>
					<DataListItemLabel>Created</DataListItemLabel>
					<DataListItemValue>2024-01-15</DataListItemValue>
				</DataListItem>
				<DataListItem>
					<DataListItemLabel>Last Login</DataListItemLabel>
					<DataListItemValue>2 hours ago</DataListItemValue>
				</DataListItem>
			</DataList>
		);
	},
};

export const Horizontal: Story = {
	args: {
		orientation: "horizontal",
		items: [
			{ label: "Users", value: "1,234" },
			{ label: "Revenue", value: "$45,678" },
			{ label: "Growth", value: "+12.5%" },
		],
	},
};
