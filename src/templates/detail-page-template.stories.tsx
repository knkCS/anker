// src/templates/detail-page-template.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../components/card";
import { Sidebar } from "../components/sidebar/sidebar";
import { Box } from "../primitives/layout";
import { Tabs } from "../primitives/tabs";
import { Text } from "../primitives/typography";
import { AppShell } from "./app-shell";
import { DetailPageTemplate } from "./detail-page-template";

const meta = {
	title: "Templates/DetailPageTemplate",
	component: DetailPageTemplate,
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DetailPageTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

const SampleSidebar = () => (
	<Sidebar>
		<Sidebar.Header>
			<Sidebar.Logo wordmark="Odon" />
		</Sidebar.Header>
		<Sidebar.Body>
			<Sidebar.Section label="Identity">
				<Sidebar.Item active>Users</Sidebar.Item>
			</Sidebar.Section>
		</Sidebar.Body>
	</Sidebar>
);

export const Default: Story = {
	render: () => (
		<AppShell sidebar={<SampleSidebar />}>
			<DetailPageTemplate
				breadcrumbs={[
					{ label: "Identity", to: "#" },
					{ label: "Users", to: "#" },
					{ label: "Jana Schmid" },
				]}
				title="Jana Schmid"
				subtitle="jana.schmid@knk.de"
				tabs={
					<Tabs.Root defaultValue="profile" variant="line">
						<Box px="8">
							<Tabs.List>
								<Tabs.Trigger value="profile">Profile</Tabs.Trigger>
								<Tabs.Trigger value="sessions">Sessions</Tabs.Trigger>
								<Tabs.Trigger value="audit">Audit log</Tabs.Trigger>
							</Tabs.List>
						</Box>
					</Tabs.Root>
				}
			>
				{/*
				 * The body is rendered flush against the canvas. Add internal
				 * padding inside `children` if cards/tables need breathing room
				 * — here we wrap in a `<Box px="8" pt="6">`.
				 */}
				<Box px="8" pt="6">
					<Card title="Identity">
						<Text color="muted">
							Identity card content (avatar, persona block, role).
						</Text>
					</Card>
				</Box>
			</DetailPageTemplate>
		</AppShell>
	),
};
