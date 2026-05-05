// src/templates/index-page-template.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "../atoms/button";
import { Sidebar } from "../components/sidebar/sidebar";
import { Toolbar } from "../components/toolbar";
import { Tabs } from "../primitives/tabs";
import { Box } from "../primitives/layout";
import { Heading, Text } from "../primitives/typography";
import { AppShell } from "./app-shell";
import { IndexPageTemplate } from "./index-page-template";

const meta = {
	title: "Templates/IndexPageTemplate",
	component: IndexPageTemplate,
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof IndexPageTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

const SampleSidebar = () => (
	<Sidebar>
		<Sidebar.Header>
			<Sidebar.Logo wordmark="Odon" subtitle="Identity Provider" />
		</Sidebar.Header>
		<Sidebar.Body>
			<Sidebar.Section label="Identity">
				<Sidebar.Item active>Users</Sidebar.Item>
			</Sidebar.Section>
		</Sidebar.Body>
	</Sidebar>
);

const FakeTable = () => (
	<Box px="8" py="6" bg="bg-canvas">
		<Box bg="bg-surface" borderRadius="md" borderWidth="1px" borderColor="border" p="6">
			<Text color="muted">[ DataTable goes here ]</Text>
		</Box>
	</Box>
);

const SearchToolbar = () => {
	const [q, setQ] = useState("");
	return (
		<Toolbar>
			<Toolbar.Search placeholder="Search users…" value={q} onChange={setQ} />
			<Toolbar.Right>
				<Toolbar.Count>42 users</Toolbar.Count>
			</Toolbar.Right>
		</Toolbar>
	);
};

export const Default: Story = {
	render: () => (
		<AppShell sidebar={<SampleSidebar />}>
			<IndexPageTemplate
				breadcrumbs={[{ label: "Identity", to: "#" }, { label: "Users" }]}
				title="Users"
				subtitle="People with access to this workspace."
				actions={
					<Button colorPalette="primary" size="sm">
						<Plus size={14} /> Add user
					</Button>
				}
				toolbar={<SearchToolbar />}
			>
				<FakeTable />
			</IndexPageTemplate>
		</AppShell>
	),
};

export const WithTabs: Story = {
	render: () => (
		<AppShell sidebar={<SampleSidebar />}>
			<IndexPageTemplate
				breadcrumbs={[{ label: "Identity", to: "#" }, { label: "Users" }]}
				title="Users"
				actions={
					<Button colorPalette="primary" size="sm">
						<Plus size={14} /> Add user
					</Button>
				}
				tabs={
					<Tabs.Root defaultValue="active" variant="line">
						<Box px="8">
							<Tabs.List>
								<Tabs.Trigger value="active">Active</Tabs.Trigger>
								<Tabs.Trigger value="invited">Invited</Tabs.Trigger>
								<Tabs.Trigger value="suspended">Suspended</Tabs.Trigger>
							</Tabs.List>
						</Box>
					</Tabs.Root>
				}
				toolbar={<SearchToolbar />}
			>
				<FakeTable />
			</IndexPageTemplate>
		</AppShell>
	),
};

export const NoToolbar: Story = {
	render: () => (
		<AppShell sidebar={<SampleSidebar />}>
			<IndexPageTemplate title="Users (no toolbar)">
				<Box px="8" py="6">
					<Heading size="md" mb="2">
						No toolbar
					</Heading>
					<Text color="muted">
						Some index pages don't need a search/filter toolbar (small
						lists, fixed-set indexes).
					</Text>
				</Box>
			</IndexPageTemplate>
		</AppShell>
	),
};
