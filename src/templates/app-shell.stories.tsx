// src/templates/app-shell.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Building2, Plus, Users } from "lucide-react";
import { Button } from "../atoms/button";
import { ContextRail } from "../components/context-rail/context-rail";
import { Sidebar } from "../components/sidebar/sidebar";
import { Box } from "../primitives/layout";
import { Heading, Text } from "../primitives/typography";
import { AppShell, usePageActions, usePageRail } from "./app-shell";

const meta = {
	title: "Templates/AppShell",
	component: AppShell,
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

const SampleSidebar = () => (
	<Sidebar>
		<Sidebar.Header>
			<Sidebar.Logo wordmark="Odon" subtitle="Identity Provider" />
		</Sidebar.Header>
		<Sidebar.Body>
			<Sidebar.Section label="Identity">
				<Sidebar.Item icon={<Users size={16} />} active>
					Users
				</Sidebar.Item>
				<Sidebar.Item icon={<Building2 size={16} />}>
					Organizations
				</Sidebar.Item>
			</Sidebar.Section>
		</Sidebar.Body>
	</Sidebar>
);

const SampleRail = () => (
	<ContextRail>
		<ContextRail.Header eyebrow="OVERVIEW" title="Users" />
		<ContextRail.Section id="stats" label="Stats">
			<Text fontSize="sm" color="muted">
				42 total users
			</Text>
		</ContextRail.Section>
	</ContextRail>
);

const RegisteringChild = () => {
	usePageActions(
		<Button colorPalette="primary" size="sm">
			<Plus size={14} /> Add user
		</Button>,
	);
	usePageRail(
		<ContextRail>
			<ContextRail.Header eyebrow="REGISTERED" title="Filtered view" />
			<ContextRail.Section id="filters" label="Active filters">
				<Text fontSize="sm" color="muted">
					Department: Engineering
				</Text>
			</ContextRail.Section>
		</ContextRail>,
	);
	return (
		<Box px="8" py="6">
			<Heading as="h1" size="lg" mb="2">
				Demo page
			</Heading>
			<Text color="muted">
				This child registers page-actions and rail content via the AppShell slot
				store.
			</Text>
		</Box>
	);
};

export const Default: Story = {
	render: () => (
		<AppShell sidebar={<SampleSidebar />} rail={<SampleRail />}>
			<Box px="8" py="6">
				<Heading as="h1" size="lg" mb="2">
					Page content
				</Heading>
				<Text color="muted">
					AppShell renders sidebar | main | rail in a 3-column grid.
				</Text>
			</Box>
		</AppShell>
	),
};

export const NoRail: Story = {
	render: () => (
		<AppShell sidebar={<SampleSidebar />}>
			<Box px="8" py="6">
				<Heading as="h1" size="lg" mb="2">
					No rail variant
				</Heading>
				<Text color="muted">
					When `rail` is omitted (or null), the right column is dropped from the
					grid entirely.
				</Text>
			</Box>
		</AppShell>
	),
};

export const WithSlotRegistration: Story = {
	render: () => (
		<AppShell sidebar={<SampleSidebar />} rail={<SampleRail />}>
			<RegisteringChild />
		</AppShell>
	),
};
