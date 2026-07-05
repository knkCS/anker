import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Dashboard } from "./dashboard";
import { demoRegistry, statTileWidget } from "./demo-widgets";
import type { DashboardMode, WidgetInstance } from "./types";
import { WidgetCatalog } from "./widget-catalog";
import { WidgetConfigForm } from "./widget-config-form";

const seed: WidgetInstance[] = [
	{
		id: "a",
		type: "demo-stat",
		settings: { label: "Users", value: 128 },
		layout: { x: 0, y: 0, w: 3, h: 2 },
	},
	{
		id: "b",
		type: "demo-notes",
		settings: { text: "Welcome to the dashboard." },
		layout: { x: 3, y: 0, w: 4, h: 3 },
	},
];

const meta = {
	title: "Components/Dashboard",
	component: Dashboard,
} satisfies Meta<typeof Dashboard>;
export default meta;
type Story = StoryObj<typeof meta>;

function Harness({
	initial,
	initialMode = "view",
	permissions,
}: {
	initial: WidgetInstance[];
	initialMode?: DashboardMode;
	permissions?: string[];
}) {
	const [widgets, setWidgets] = useState(initial);
	const [mode, setMode] = useState<DashboardMode>(initialMode);
	return (
		<Dashboard
			registry={demoRegistry}
			widgets={widgets}
			mode={mode}
			grantedPermissions={permissions}
			onModeChange={setMode}
			onCommit={setWidgets}
		/>
	);
}

export const Default: Story = { render: () => <Harness initial={seed} /> };
export const EditMode: Story = {
	render: () => <Harness initial={seed} initialMode="edit" />,
};
export const Empty: Story = { render: () => <Harness initial={[]} /> };
export const UnknownWidget: Story = {
	render: () => (
		<Harness
			initial={[
				{
					id: "x",
					type: "ghost",
					settings: {},
					layout: { x: 0, y: 0, w: 3, h: 2 },
				},
			]}
			initialMode="edit"
		/>
	),
};
export const WithAdminPermission: Story = {
	render: () => (
		<Harness initial={seed} initialMode="edit" permissions={["admin"]} />
	),
};

export const Catalog: StoryObj<typeof WidgetCatalog> = {
	render: () => {
		const [open, setOpen] = useState(true);
		return (
			<WidgetCatalog
				open={open}
				onClose={() => setOpen(false)}
				definitions={demoRegistry.getCatalog()}
				onSelect={() => {}}
			/>
		);
	},
};

export const ConfigForm: StoryObj<typeof WidgetConfigForm> = {
	render: () => {
		const [settings, setSettings] = useState<Record<string, unknown>>({
			label: "Items",
			value: 42,
		});
		return (
			<WidgetConfigForm
				schema={statTileWidget.settingsSchema ?? []}
				settings={settings}
				onChange={setSettings}
			/>
		);
	},
};
