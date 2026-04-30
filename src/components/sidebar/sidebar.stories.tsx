// src/components/sidebar/sidebar.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import {
	Building2,
	ClipboardList,
	KeyRound,
	Users,
	Webhook,
} from "lucide-react";
import { Sidebar } from "./sidebar";

const meta = {
	title: "Components/Sidebar",
	component: Sidebar,
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Sidebar>
			<Sidebar.Header>
				<Sidebar.Logo wordmark="Odon" subtitle="Identity Provider" />
			</Sidebar.Header>
			<Sidebar.Body>
				<Sidebar.Section label="Identity">
					<Sidebar.Item icon={<Users size={16} />} active>
						Users
					</Sidebar.Item>
				</Sidebar.Section>
				<Sidebar.Section label="Access">
					<Sidebar.Item icon={<KeyRound size={16} />}>
						OAuth Clients
					</Sidebar.Item>
					<Sidebar.Item icon={<Webhook size={16} />}>Webhooks</Sidebar.Item>
				</Sidebar.Section>
				<Sidebar.Section label="Organization">
					<Sidebar.Item icon={<Building2 size={16} />}>Settings</Sidebar.Item>
					<Sidebar.Item icon={<ClipboardList size={16} />}>
						Audit Log
					</Sidebar.Item>
				</Sidebar.Section>
			</Sidebar.Body>
			<Sidebar.Footer>
				<Sidebar.UserMenu user={{ name: "Jana Schmid", email: "jana@knk.de" }}>
					<Sidebar.UserMenuItem>Personal Settings</Sidebar.UserMenuItem>
					<Sidebar.UserMenuItem>Sign out</Sidebar.UserMenuItem>
				</Sidebar.UserMenu>
			</Sidebar.Footer>
		</Sidebar>
	),
};
