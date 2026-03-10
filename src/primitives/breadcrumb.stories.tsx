import type { Meta, StoryObj } from "@storybook/react";
import {
	BreadcrumbCurrentLink,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbRoot,
} from "./breadcrumb";

const meta = {
	title: "Primitives/Breadcrumb",
	component: BreadcrumbRoot,
} satisfies Meta<typeof BreadcrumbRoot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render() {
		return (
			<BreadcrumbRoot>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink href="#">Home</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbItem>
						<BreadcrumbLink href="#">Settings</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbItem>
						<BreadcrumbCurrentLink>Profile</BreadcrumbCurrentLink>
					</BreadcrumbItem>
				</BreadcrumbList>
			</BreadcrumbRoot>
		);
	},
};

export const WithSeparator: Story = {
	render() {
		return (
			<BreadcrumbRoot separator="/">
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbItem>
						<BreadcrumbLink href="#">Users</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbItem>
						<BreadcrumbCurrentLink>Edit</BreadcrumbCurrentLink>
					</BreadcrumbItem>
				</BreadcrumbList>
			</BreadcrumbRoot>
		);
	},
};
