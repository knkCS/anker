// src/templates/app-shell.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Building2, Plus, Users } from "lucide-react";
import { Button } from "../atoms/button";
import { ContextRail } from "../components/context-rail/context-rail";
import { PageHeader } from "../components/page-header";
import { Sidebar } from "../components/sidebar/sidebar";
import { Box } from "../primitives/layout";
import { Heading, Text } from "../primitives/typography";
import {
	AppShell,
	usePageActions,
	usePageHeader,
	usePageRail,
} from "./app-shell";

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

// Demonstrates descendant-driven rail content with no `rail` prop on AppShell.
// The rail column appears purely because the child called `usePageRail(...)`.
// This is the common shape for solutions where each route owns its own rail
// content and there's no app-wide default.
export const DescendantDrivenRail: Story = {
	render: () => (
		<AppShell sidebar={<SampleSidebar />}>
			<RegisteringChild />
		</AppShell>
	),
};

// Demonstrates the full header-band + rail layout: the header spans both the
// main and rail columns (row 1), while the rail begins below it (row 2). The
// header and rail are both registered by a descendant component via hooks
// rather than passed as static props, which is the recommended pattern for
// route-level pages.
function HeaderAndRailDemo() {
	usePageHeader(
		<PageHeader
			breadcrumbs={[{ label: "Identity" }, { label: "Users" }]}
			title="Users"
			actions={<Button>Nutzer einladen</Button>}
		/>,
	);
	usePageRail(
		<ContextRail>
			<ContextRail.Header eyebrow="USER" title="Vorschau" />
			<ContextRail.Section id="meta" label="Details">
				<Text fontSize="sm" color="muted">
					Rolle: Admin
				</Text>
				<Text fontSize="sm" color="muted">
					2FA: An
				</Text>
			</ContextRail.Section>
		</ContextRail>,
	);
	return (
		<Box px="8" py="6">
			<Text color="muted">Page body content (table, list, etc.)</Text>
		</Box>
	);
}

export const WithHeaderAndRail: Story = {
	render: () => (
		<AppShell
			sidebar={
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
			}
		>
			<HeaderAndRailDemo />
		</AppShell>
	),
};

// Long-scrolling main content. Use this story to verify that the sidebar and
// rail columns stay sticky at the top of the viewport while the main column
// scrolls underneath them.
export const StickyColumnsWithLongContent: Story = {
	render: () => (
		<AppShell sidebar={<SampleSidebar />} rail={<SampleRail />}>
			<Box px="8" py="6">
				<Heading as="h1" size="lg" mb="2">
					Long page
				</Heading>
				<Text color="muted" mb="6">
					Scroll the main column — the sidebar and rail should stay put.
				</Text>
				{Array.from({ length: 60 }).map((_, i) => (
					<Box
						// biome-ignore lint/suspicious/noArrayIndexKey: static demo content
						key={i}
						py="4"
						borderBottomWidth="1px"
						borderColor="border"
					>
						<Text>
							Row {i + 1} — filler content to force the page to scroll.
						</Text>
					</Box>
				))}
			</Box>
		</AppShell>
	),
};
