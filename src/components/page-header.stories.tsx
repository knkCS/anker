// src/components/page-header.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Edit, Upload, UserPlus } from "lucide-react";
import { Button } from "../atoms/button";
import { Avatar } from "../primitives/avatar";
import { Badge } from "../primitives/badge";
import { Flex } from "../primitives/layout";
import { Tabs } from "../primitives/tabs";
import { Text } from "../primitives/typography";
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

export const WithDetailSlots: Story = {
	args: {
		breadcrumbs: [
			{ label: "Identity" },
			{ label: "Users" },
			{ label: "Jan Schmidt" },
		],
		title: "Jan Schmidt",
		avatar: <Avatar name="Jan Schmidt" size="xl" />,
		badges: (
			<>
				<Badge colorPalette="green">Aktiv</Badge>
				<Badge colorPalette="blue">Admin</Badge>
			</>
		),
		meta: (
			<Flex align="center" gap="3" fontSize="sm" color="muted">
				<Text as="span">jan.schmidt@example.com</Text>
				<Text as="span" color="muted">
					·
				</Text>
				<Text as="span">Entwicklung</Text>
				<Text as="span" color="muted">
					·
				</Text>
				<Text as="span" fontFamily="mono" fontSize="xs">
					usr_01HXYZ1234ABCD
				</Text>
			</Flex>
		),
		actions: (
			<>
				<Button variant="outline" size="sm">
					Bearbeiten
				</Button>
				<Button variant="solid" colorPalette="primary" size="sm">
					Zugang sperren
				</Button>
			</>
		),
	},
};

export const WithTabs: Story = {
	args: {
		breadcrumbs: [{ label: "Identity" }, { label: "Users" }],
		title: "Users",
		actions: (
			<>
				<Button variant="outline" size="sm">
					<Upload size={14} /> CSV importieren
				</Button>
				<Button variant="solid" colorPalette="primary" size="sm">
					<UserPlus size={14} /> Nutzer einladen
				</Button>
			</>
		),
		tabs: (
			<Tabs.Root defaultValue="all" variant="line">
				<Tabs.List px="8">
					<Tabs.Trigger value="all">Alle</Tabs.Trigger>
					<Tabs.Trigger value="active">Aktiv</Tabs.Trigger>
					<Tabs.Trigger value="invited">Eingeladen</Tabs.Trigger>
					<Tabs.Trigger value="suspended">Gesperrt</Tabs.Trigger>
				</Tabs.List>
			</Tabs.Root>
		),
	},
};

export const FullBand: Story = {
	args: {
		breadcrumbs: [
			{ label: "Identity" },
			{ label: "Users" },
			{ label: "Maria Müller" },
		],
		title: "Maria Müller",
		avatar: <Avatar name="Maria Müller" size="xl" />,
		badges: <Badge colorPalette="green">Aktiv</Badge>,
		meta: (
			<Flex align="center" gap="2" fontSize="sm" color="muted">
				<Text as="span">maria.mueller@example.com</Text>
			</Flex>
		),
		actions: (
			<Button variant="outline" size="sm">
				<Edit size={14} /> Bearbeiten
			</Button>
		),
		tabs: (
			<Tabs.Root defaultValue="overview" variant="line">
				<Tabs.List px="8">
					<Tabs.Trigger value="overview">Übersicht</Tabs.Trigger>
					<Tabs.Trigger value="apps">Anwendungen</Tabs.Trigger>
					<Tabs.Trigger value="sessions">Sitzungen</Tabs.Trigger>
				</Tabs.List>
			</Tabs.Root>
		),
	},
};
