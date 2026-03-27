import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../atoms/button/button";
import { Alert } from "./alert";

const meta = {
	title: "Primitives/Alert",
	component: Alert,
	args: {
		title: "Alert title",
	},
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDescription: Story = {
	args: {
		title: "Heads up!",
		children: "This is an alert with a description.",
	},
};

export const Info: Story = {
	args: {
		status: "info",
		title: "Information",
		children: "A new version is available.",
	},
};

export const Warning: Story = {
	args: {
		status: "warning",
		title: "Warning",
		children: "Your session is about to expire.",
	},
};

export const ErrorStatus: Story = {
	args: {
		status: "error",
		title: "Error",
		children: "Something went wrong.",
	},
};

export const Success: Story = {
	args: {
		status: "success",
		title: "Success",
		children: "Your changes have been saved.",
	},
};

export const WithEndElement: Story = {
	args: {
		title: "Update available",
		children: "A new version is ready to install.",
		endElement: (
			<Button size="sm" variant="outline">
				Update
			</Button>
		),
	},
};
