// src/templates/settings-page-template.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../components/card";
import { Sidebar } from "../components/sidebar/sidebar";
import { Box } from "../primitives/layout";
import { Tabs } from "../primitives/tabs";
import { Text } from "../primitives/typography";
import { AppShell } from "./app-shell";
import { SettingsPageTemplate } from "./settings-page-template";

const meta = {
	title: "Templates/SettingsPageTemplate",
	component: SettingsPageTemplate,
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SettingsPageTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

const SampleSidebar = () => (
	<Sidebar>
		<Sidebar.Header>
			<Sidebar.Logo wordmark="Odon" />
		</Sidebar.Header>
		<Sidebar.Body>
			<Sidebar.Section label="Personal">
				<Sidebar.Item active>Settings</Sidebar.Item>
			</Sidebar.Section>
		</Sidebar.Body>
	</Sidebar>
);

export const Default: Story = {
	render: () => (
		<AppShell sidebar={<SampleSidebar />}>
			<SettingsPageTemplate
				breadcrumbs={[{ label: "Personal" }, { label: "Settings" }]}
				title="Personal settings"
				subtitle="Manage your profile, password, and security preferences."
				tabs={
					<Tabs.Root defaultValue="profile" variant="line">
						<Box px="8">
							<Tabs.List>
								<Tabs.Trigger value="profile">Profile</Tabs.Trigger>
								<Tabs.Trigger value="password">Password</Tabs.Trigger>
								<Tabs.Trigger value="mfa">Two-factor auth</Tabs.Trigger>
							</Tabs.List>
						</Box>
					</Tabs.Root>
				}
			>
				<Card title="Profile">
					<Text color="muted">[ form fields go here ]</Text>
				</Card>
			</SettingsPageTemplate>
		</AppShell>
	),
};
