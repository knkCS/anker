// src/components/context-rail/context-rail.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import {
	ArrowRight,
	Copy,
	Download,
	GitBranch,
	History,
	Info,
	Monitor,
	ScanSearch,
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
import { useState } from "react";
import { Button } from "../../atoms/button";
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

/**
 * Opt-in resizable width — the workflow editor's settings: 360px default,
 * 320px minimum, at most half the space the rail shares with the main
 * column. Drag the leading edge, double-click it to reset, or focus it and
 * use ←/→. The width is remembered under `${storageKey}:width`.
 */
export const Resizable: Story = {
	render: () => {
		if (typeof window !== "undefined") {
			localStorage.setItem("storybook.rail.resizable", "false");
		}
		return (
			<RailColumn>
				<ContextRail
					storageKey="storybook.rail.resizable"
					resizable={{
						defaultWidth: 360,
						minWidth: 320,
						maxWidth: (space) => space / 2,
					}}
				>
					<ContextRail.Header eyebrow="Workflow" title="Redaktionsablauf" />
					<ContextRail.Section
						id="actions"
						icon={<Zap size={14} />}
						label="Aktionen"
					>
						<ContextRail.IconButton
							label="Prüfen"
							icon={<ShieldCheck size={14} />}
							onClick={() => {}}
						/>
						<ContextRail.IconButton
							label="Löschen"
							icon={<X size={14} />}
							onClick={() => {}}
							tone="outline-red"
						/>
					</ContextRail.Section>
					<ContextRail.Section
						id="about"
						icon={<Info size={14} />}
						label="Über"
					>
						<p style={{ fontSize: 13, color: "var(--chakra-colors-muted)" }}>
							Drag the rail's leading edge to give this column more room.
						</p>
					</ContextRail.Section>
				</ContextRail>
			</RailColumn>
		);
	},
};

const STEPS = ["Entwurf", "Prüfung", "Freigabe"];

const SelectionOpensRail = () => {
	const [selected, setSelected] = useState<string | null>(null);
	return (
		<Flex bg="bg-canvas" minH="100vh">
			<Flex flex="1" direction="column" align="flex-start" gap="2" p="6">
				{STEPS.map((step) => (
					<Button
						key={step}
						size="sm"
						variant={selected === step ? "solid" : "outline"}
						aria-pressed={selected === step}
						onClick={() => setSelected(step)}
					>
						{step}
					</Button>
				))}
				<Button size="sm" variant="ghost" onClick={() => setSelected(null)}>
					Deselect
				</Button>
			</Flex>
			<Box bg="bg-surface" borderLeftWidth="1px" borderColor="border">
				<ContextRail storageKey="storybook.rail.expand-on" expandOn={selected}>
					<ContextRail.Header
						eyebrow="Step"
						title={selected ?? "Nothing selected"}
					/>
					<ContextRail.Section
						id="step-form"
						icon={<Info size={14} />}
						label="Settings"
					>
						<p style={{ fontSize: 13, color: "var(--chakra-colors-muted)" }}>
							Selecting a step opens the rail; collapse it and it stays
							collapsed until you select another step.
						</p>
					</ContextRail.Section>
				</ContextRail>
			</Box>
		</Flex>
	);
};

/**
 * `expandOn` — the selected item opens the rail. The rail starts collapsed;
 * selecting a step expands it (stored under `storageKey`) without moving
 * focus. Deselecting does nothing; a collapse holds until the next change.
 */
export const ExpandOnSelection: Story = {
	render: () => {
		if (typeof window !== "undefined") {
			localStorage.setItem("storybook.rail.expand-on", "true");
		}
		return <SelectionOpensRail />;
	},
};

const TabbedRail = () => {
	const [tab, setTab] = useState("branch");
	const [inspectRequest, setInspectRequest] = useState(0);
	const [fieldFocused, setFieldFocused] = useState(false);
	const inspect = () => {
		setTab("field");
		setInspectRequest((n) => n + 1);
	};
	return (
		<Flex bg="bg-canvas" minH="100vh">
			<Flex flex="1" direction="column" align="flex-start" gap="2" p="6">
				<Button
					size="sm"
					variant="outline"
					aria-pressed={fieldFocused}
					onClick={() => setFieldFocused((f) => !f)}
				>
					{fieldFocused ? "Blur the field" : "Focus a field"}
				</Button>
				<Button size="sm" variant="outline" onClick={inspect}>
					Inspect (selects “Field” and expands)
				</Button>
			</Flex>
			<Box bg="bg-surface" borderLeftWidth="1px" borderColor="border">
				<ContextRail
					storageKey="storybook.rail.tabs"
					expandOn={inspectRequest || undefined}
				>
					<ContextRail.Header eyebrow="Branch" title="Spring release" />
					<ContextRail.Tabs label="Rail" value={tab} onValueChange={setTab}>
						<ContextRail.Tab
							value="branch"
							label="Branch"
							icon={<GitBranch size={14} />}
							indicator={{ kind: "badge", count: 2, label: "2 blockers" }}
						>
							<ContextRail.Section
								id="actions"
								icon={<Zap size={14} />}
								label="Actions"
							>
								<ContextRail.IconButton
									label="Publish"
									icon={<Upload size={14} />}
									tone="primary"
								/>
								<ContextRail.IconButton
									label="Duplicate"
									icon={<Copy size={14} />}
								/>
							</ContextRail.Section>
							<ContextRail.Section
								id="about"
								icon={<Info size={14} />}
								label="About"
							>
								<p
									style={{ fontSize: 13, color: "var(--chakra-colors-muted)" }}
								>
									Two blockers keep this branch from publishing.
								</p>
							</ContextRail.Section>
						</ContextRail.Tab>
						<ContextRail.Tab
							value="field"
							label="Field"
							icon={<ScanSearch size={14} />}
							indicator={
								fieldFocused
									? { kind: "dot", label: "A field has focus" }
									: undefined
							}
						>
							<ContextRail.Section
								id="inspector"
								icon={<ScanSearch size={14} />}
								label="Content · Rich Text"
							>
								<p
									style={{ fontSize: 13, color: "var(--chakra-colors-muted)" }}
								>
									The focused field's inspector.
								</p>
							</ContextRail.Section>
						</ContextRail.Tab>
					</ContextRail.Tabs>
				</ContextRail>
			</Box>
		</Flex>
	);
};

/**
 * `ContextRail.Tabs` — the rail split into tabs under the header. The tab is
 * the caller's state (`value`, `onValueChange`). A badge counts, a dot flags.
 * Collapse the rail: each tab becomes an icon button that expands the rail on
 * that tab. "Inspect" sets the tab and bumps `expandOn` together.
 */
export const Tabs: Story = {
	render: () => <TabbedRail />,
};
