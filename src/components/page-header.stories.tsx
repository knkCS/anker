// src/components/page-header.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Upload, UserPlus } from "lucide-react";
import { Button } from "../atoms/button";
import { PageHeader } from "./page-header";

const meta = {
	title: "Components/PageHeader",
	component: PageHeader,
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		breadcrumbs: [{ label: "Identity" }, { label: "Users" }],
		title: "Users",
	},
};

export const WithSubtitle: Story = {
	args: {
		breadcrumbs: [{ label: "Identity" }, { label: "Users" }],
		title: "Users",
		subtitle: "Manage workspace members and roles.",
	},
};

export const WithActions: Story = {
	args: {
		breadcrumbs: [{ label: "Identity" }, { label: "Users" }],
		title: "Users",
		actions: (
			<>
				<Button variant="outline" size="sm">
					<Upload size={14} /> Import CSV
				</Button>
				<Button variant="solid" colorPalette="primary" size="sm">
					<UserPlus size={14} /> Invite user
				</Button>
			</>
		),
	},
};

export const NoBreadcrumbs: Story = {
	args: {
		title: "Settings",
	},
};

export const WithEyebrow: Story = {
	args: {
		eyebrow: "BETA",
		breadcrumbs: [{ label: "Identity" }, { label: "Users" }],
		title: "Users",
	},
};
