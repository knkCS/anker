// src/templates/settings-page-template.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../components/card";
import { Sidebar } from "../components/sidebar/sidebar";
import { Box } from "../primitives/layout";
import { Tabs } from "../primitives/tabs";
import { Text } from "../primitives/typography";
import { AppShell } from "./app-shell";
import { SettingsPageTemplate } from "./settings-page-template";

// Lightweight stand-in for a real DataTable — renders a bordered surface
// that fills its container edge-to-edge so you can see the flush layout.
const FakeDataTable = () => (
	<Box borderTopWidth="1px" borderColor="border" bg="bg-canvas" px="8" py="6">
		<Text color="muted">[ DataTable renders flush — no outer padding ]</Text>
	</Box>
);

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

/**
 * BodyPaddingNone — shows the `bodyPadding="none"` escape hatch.
 *
 * Use this when a settings tab embeds a full-width DataTable that must
 * render flush to the page edges. Tabs that still need padding (form Cards)
 * wrap their own content in `<Box px="8" py="6">` — the template no longer
 * owns the inset.
 */
export const BodyPaddingNone: Story = {
	render: () => (
		<AppShell sidebar={<SampleSidebar />}>
			<SettingsPageTemplate
				breadcrumbs={[{ label: "Organization" }, { label: "Settings" }]}
				title="Organization settings"
				subtitle="Manage members, billing, and integrations."
				bodyPadding="none"
				maxBodyWidth="full"
				tabs={
					<Tabs.Root defaultValue="members" variant="line">
						<Box px="8">
							<Tabs.List>
								<Tabs.Trigger value="general">General</Tabs.Trigger>
								<Tabs.Trigger value="members">Members</Tabs.Trigger>
							</Tabs.List>
						</Box>
					</Tabs.Root>
				}
			>
				{/* "general" tab — this is the padded tab (owns its own inset) */}
				<Tabs.Content value="general">
					<Box px="8" py="6">
						<Card title="Organization name">
							<Text color="muted">[ form fields go here ]</Text>
						</Card>
					</Box>
				</Tabs.Content>
				{/* "members" tab — flush DataTable, no wrapper padding needed */}
				<Tabs.Content value="members">
					<FakeDataTable />
				</Tabs.Content>
			</SettingsPageTemplate>
		</AppShell>
	),
};
