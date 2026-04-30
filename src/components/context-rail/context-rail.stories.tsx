// src/components/context-rail/context-rail.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { History, Info, Monitor, ShieldCheck, Zap } from "lucide-react";
import { ContextRail } from "./context-rail";

const meta = {
	title: "Components/ContextRail",
	component: ContextRail,
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ContextRail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<ContextRail>
			<ContextRail.Header eyebrow="User" title="Jana Schmid" />
			<ContextRail.Section
				id="details"
				icon={<Info size={14} />}
				label="Details"
			>
				<p style={{ fontSize: 13, color: "var(--chakra-colors-muted)" }}>
					Role: Admin · 2FA: On · ID: usr_abc123
				</p>
			</ContextRail.Section>
			<ContextRail.Section
				id="security"
				icon={<ShieldCheck size={14} />}
				label="Security"
			>
				<p style={{ fontSize: 13, color: "var(--chakra-colors-muted)" }}>
					Last sign-in: 2 hours ago
				</p>
			</ContextRail.Section>
			<ContextRail.Section
				id="sessions"
				icon={<Monitor size={14} />}
				label="Active Sessions"
			>
				<p style={{ fontSize: 13, color: "var(--chakra-colors-muted)" }}>
					3 devices
				</p>
			</ContextRail.Section>
			<ContextRail.Section
				id="activity"
				icon={<History size={14} />}
				label="Recent Activity"
			>
				<p style={{ fontSize: 13, color: "var(--chakra-colors-muted)" }}>
					Updated profile · 1 day ago
				</p>
			</ContextRail.Section>
			<ContextRail.Section
				id="actions"
				icon={<Zap size={14} />}
				label="Quick Actions"
			>
				<p style={{ fontSize: 13, color: "var(--chakra-colors-muted)" }}>
					Reset password · Suspend
				</p>
			</ContextRail.Section>
			<ContextRail.Footer>
				<button type="button">Open detail →</button>
			</ContextRail.Footer>
		</ContextRail>
	),
};

export const CollapsedByDefault: Story = {
	render: () => {
		if (typeof window !== "undefined") {
			localStorage.setItem("storybook.rail.collapsed", "true");
		}
		return (
			<ContextRail storageKey="storybook.rail.collapsed">
				<ContextRail.Header eyebrow="User" title="Jana Schmid" />
			</ContextRail>
		);
	},
};
