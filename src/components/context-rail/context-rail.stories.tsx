// src/components/context-rail/context-rail.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import {
	ArrowRight,
	Copy,
	Download,
	History,
	Info,
	Monitor,
	Shield,
	ShieldCheck,
	ShieldOff,
	Upload,
	UserCheck,
	UserMinus,
	UserPlus,
	X,
	Zap,
} from "lucide-react";
import { Box, Flex } from "../../primitives/layout";
import { ContextRail } from "./context-rail";

/**
 * In real consumers `<ContextRail>` is rendered inside `<AppShell>`'s
 * rail column, which provides the surface background and the left
 * divider against the main column. In isolation (storybook) we wrap
 * the rail in an equivalent column so the visual matches what
 * consumers will see in production.
 */
const RailColumn = ({ children }: { children: React.ReactNode }) => (
	<Flex bg="bg-canvas" minH="100vh">
		<Box flex="1" />
		<Box bg="bg-surface" borderLeftWidth="1px" borderColor="border">
			{children}
		</Box>
	</Flex>
);

const meta = {
	title: "Components/ContextRail",
	component: ContextRail,
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ContextRail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<RailColumn>
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
		</RailColumn>
	),
};

export const CollapsedByDefault: Story = {
	render: () => {
		if (typeof window !== "undefined") {
			localStorage.setItem("storybook.rail.collapsed", "true");
		}
		return (
			<RailColumn>
				<ContextRail storageKey="storybook.rail.collapsed">
					<ContextRail.Header eyebrow="User" title="Jana Schmid" />
				</ContextRail>
			</RailColumn>
		);
	},
};

export const AtomsExpanded: Story = {
	render: () => (
		<RailColumn>
			<ContextRail>
				<ContextRail.Header eyebrow="WORKSPACE" title="Overview" />
				<ContextRail.Section id="users" label="Users">
					<ContextRail.ValueTile value={100} label="Total users" />
					<ContextRail.ValueTile value={100} label="Active users" muted />
				</ContextRail.Section>
				<ContextRail.StatusIcon
					tone="amber"
					icon={<Shield size={14} />}
					label="2FA: 0 of 100 enabled"
				/>
				<ContextRail.Divider />
				<ContextRail.Section id="actions" label="Quick actions">
					<ContextRail.IconButton
						label="Invite user"
						icon={<UserPlus size={14} />}
						onClick={() => {}}
					/>
					<ContextRail.IconButton
						label="Import CSV"
						icon={<Upload size={14} />}
						onClick={() => {}}
					/>
					<ContextRail.IconButton
						label="Export all"
						icon={<Download size={14} />}
						onClick={() => {}}
					/>
				</ContextRail.Section>
			</ContextRail>
		</RailColumn>
	),
};

export const AtomsCollapsed: Story = {
	render: () => (
		<div style={{ width: 1000 }}>
			<RailColumn>
				<ContextRail>
					<ContextRail.Header eyebrow="WORKSPACE" title="Overview" />
					<ContextRail.Section id="users" label="Users">
						<ContextRail.ValueTile value={100} label="Total users" />
						<ContextRail.ValueTile value={100} label="Active users" muted />
					</ContextRail.Section>
					<ContextRail.StatusIcon
						tone="amber"
						icon={<Shield size={14} />}
						label="2FA: 0 of 100 enabled"
					/>
					<ContextRail.Divider />
					<ContextRail.Section id="actions" label="Quick actions">
						<ContextRail.IconButton
							label="Invite user"
							icon={<UserPlus size={14} />}
							onClick={() => {}}
						/>
						<ContextRail.IconButton
							label="Import CSV"
							icon={<Upload size={14} />}
							onClick={() => {}}
						/>
						<ContextRail.IconButton
							label="Export all"
							icon={<Download size={14} />}
							onClick={() => {}}
						/>
					</ContextRail.Section>
				</ContextRail>
			</RailColumn>
		</div>
	),
};

export const AvatarAndFooter: Story = {
	render: () => (
		<RailColumn>
			<ContextRail>
				<ContextRail.Header eyebrow="USER" title="Jana Schmid" />
				<ContextRail.Avatar initials="JS" label="Jana Schmid · jana@knk.de" />
				<ContextRail.StatusIcon
					tone="green"
					icon={<Shield size={14} />}
					label="2FA: Active"
				/>
				<ContextRail.ValueTile value={3} label="Sessions" />
				<ContextRail.Footer>
					<ContextRail.IconButton
						label="Open detail"
						icon={<ArrowRight size={14} />}
						onClick={() => {}}
						tone="primary"
					/>
					<ContextRail.IconButton
						label="Close preview"
						icon={<X size={14} />}
						onClick={() => {}}
						tone="ghost"
					/>
				</ContextRail.Footer>
			</ContextRail>
		</RailColumn>
	),
};

/** §4.1 Overview/stats — generic template for workspace overview rails */
export const PatternOverviewStats: Story = {
	render: () => (
		<RailColumn>
			<ContextRail storageKey="story-pattern-overview">
				<ContextRail.Header eyebrow="WORKSPACE" title="Overview" />
				<ContextRail.Section id="users" label="Users">
					<Flex direction="row" gap="2" flexWrap="wrap">
						<ContextRail.ValueTile value={1284} label="Total" />
						<ContextRail.ValueTile value={1108} label="Active" muted />
					</Flex>
					<Flex direction="row" gap="2" flexWrap="wrap" mt="2">
						<ContextRail.ValueTile value={12} label="Invited" muted />
						<ContextRail.ValueTile value={2} label="Suspended" muted />
					</Flex>
				</ContextRail.Section>
				<ContextRail.StatusIcon
					tone="amber"
					icon={<Shield size={14} />}
					label="2FA: 856 of 1284 enabled"
				/>
				<ContextRail.Divider />
				<ContextRail.IconButton
					label="Invite user"
					icon={<UserPlus size={14} />}
					onClick={() => {}}
				/>
				<ContextRail.IconButton
					label="Import CSV"
					icon={<Upload size={14} />}
					onClick={() => {}}
				/>
				<ContextRail.IconButton
					label="Export all"
					icon={<Download size={14} />}
					onClick={() => {}}
				/>
			</ContextRail>
		</RailColumn>
	),
};

/** §4.3 Bulk-selection — generic template for multi-select action rails */
export const PatternBulkSelection: Story = {
	render: () => (
		<RailColumn>
			<ContextRail storageKey="story-pattern-bulk">
				<ContextRail.Header eyebrow="3 selected" title="Bulk actions" />
				<ContextRail.ValueTile value={3} keepWhenEmpty label="3 selected" />
				<ContextRail.Divider />
				<ContextRail.ValueTile value={2} label="Active" muted />
				<ContextRail.ValueTile value={1} label="Invited" muted />
				<ContextRail.ValueTile value={0} label="Suspended" muted />
				<ContextRail.Divider />
				<ContextRail.IconButton
					label="Deactivate"
					icon={<UserMinus size={14} />}
					onClick={() => {}}
				/>
				<ContextRail.IconButton
					label="Reactivate"
					icon={<UserCheck size={14} />}
					onClick={() => {}}
				/>
				<ContextRail.IconButton
					label="Reset MFA"
					icon={<ShieldOff size={14} />}
					onClick={() => {}}
				/>
			</ContextRail>
		</RailColumn>
	),
};

/** §4.2 Detail-context — generic template for single-entity context rails */
export const PatternDetailContext: Story = {
	render: () => (
		<RailColumn>
			<ContextRail storageKey="story-pattern-detail">
				<ContextRail.Header eyebrow="User" title="Jana Schmid" />
				<ContextRail.Avatar initials="JS" label="Jana Schmid · jana@knk.de" />
				<ContextRail.StatusIcon
					tone="green"
					icon={<Shield size={14} />}
					label="2FA: Active"
				/>
				<ContextRail.ValueTile value={3} label="Sessions" muted />
				<ContextRail.Divider />
				<ContextRail.IconButton
					label="Copy ID"
					icon={<Copy size={14} />}
					onClick={() => {}}
				/>
				<ContextRail.Footer>
					<ContextRail.IconButton
						label="Open detail"
						icon={<ArrowRight size={14} />}
						onClick={() => {}}
						tone="primary"
					/>
					<ContextRail.IconButton
						label="Close preview"
						icon={<X size={14} />}
						onClick={() => {}}
						tone="ghost"
					/>
				</ContextRail.Footer>
			</ContextRail>
		</RailColumn>
	),
};
