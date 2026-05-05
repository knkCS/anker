// src/templates/dashboard-page-template.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Activity, Users } from "lucide-react";
import { Sidebar } from "../components/sidebar/sidebar";
import { Widget } from "../components/widget";
import { Box, GridItem } from "../primitives/layout";
import { Heading, Text } from "../primitives/typography";
import { AppShell } from "./app-shell";
import { DashboardPageTemplate } from "./dashboard-page-template";

const meta = {
	title: "Templates/DashboardPageTemplate",
	component: DashboardPageTemplate,
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DashboardPageTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

const SampleSidebar = () => (
	<Sidebar>
		<Sidebar.Header>
			<Sidebar.Logo wordmark="Odon" />
		</Sidebar.Header>
		<Sidebar.Body>
			<Sidebar.Section label="Workspace">
				<Sidebar.Item active>Dashboard</Sidebar.Item>
			</Sidebar.Section>
		</Sidebar.Body>
	</Sidebar>
);

export const Default: Story = {
	render: () => (
		<AppShell sidebar={<SampleSidebar />}>
			<DashboardPageTemplate
				title="Dashboard"
				subtitle="Last 30 days · all workspaces"
			>
				<GridItem gridColumn="span 3">
					<Widget heading="Active users" icon={<Users size={16} />}>
						<Heading size="2xl">1,284</Heading>
					</Widget>
				</GridItem>
				<GridItem gridColumn="span 3">
					<Widget heading="Sign-ins (7d)" icon={<Activity size={16} />}>
						<Heading size="2xl">8,210</Heading>
					</Widget>
				</GridItem>
				<GridItem gridColumn="span 3">
					<Widget heading="MFA enrolled" icon={<Users size={16} />}>
						<Heading size="2xl">76%</Heading>
					</Widget>
				</GridItem>
				<GridItem gridColumn="span 3">
					<Widget heading="Failed logins" icon={<Activity size={16} />}>
						<Heading size="2xl">12</Heading>
					</Widget>
				</GridItem>
				<GridItem gridColumn="span 8">
					<Widget heading="Sign-in activity" icon={<Activity size={16} />}>
						<Box h="200px" bg="bg-subtle" borderRadius="md" />
					</Widget>
				</GridItem>
				<GridItem gridColumn="span 4">
					<Widget heading="Recent events" icon={<Activity size={16} />}>
						<Text fontSize="sm" color="muted">
							[ Timeline goes here ]
						</Text>
					</Widget>
				</GridItem>
			</DashboardPageTemplate>
		</AppShell>
	),
};
