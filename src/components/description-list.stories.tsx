import type { Meta, StoryObj } from "@storybook/react";
import { Grid } from "../primitives/layout";
import { DescriptionList } from "./description-list";

const meta = {
	title: "Components/DescriptionList",
	component: DescriptionList,
} satisfies Meta<typeof DescriptionList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
	render: () => (
		<DescriptionList>
			<DescriptionList.Row label="Email">jana@knk.de</DescriptionList.Row>
			<DescriptionList.Row label="ID" mono>
				2P9XmR3sJk
			</DescriptionList.Row>
			<DescriptionList.Row label="Created">
				2026-04-12 09:31
			</DescriptionList.Row>
		</DescriptionList>
	),
};

export const Vertical: Story = {
	render: () => (
		<DescriptionList orientation="vertical">
			<DescriptionList.Row label="Status">Active</DescriptionList.Row>
			<DescriptionList.Row label="Last seen">2 hours ago</DescriptionList.Row>
		</DescriptionList>
	),
};

export const VerticalGrid: Story = {
	render: () => (
		<Grid templateColumns="repeat(3, 1fr)" gap="6">
			<DescriptionList orientation="vertical">
				<DescriptionList.Row label="Status">Active</DescriptionList.Row>
			</DescriptionList>
			<DescriptionList orientation="vertical">
				<DescriptionList.Row label="MFA">Enabled</DescriptionList.Row>
			</DescriptionList>
			<DescriptionList orientation="vertical">
				<DescriptionList.Row label="Last login">
					2 hours ago
				</DescriptionList.Row>
			</DescriptionList>
		</Grid>
	),
};
