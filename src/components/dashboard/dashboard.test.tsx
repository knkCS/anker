import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import { Dashboard } from "./dashboard";
import { defaultDashboardLabels } from "./labels";
import { createWidgetRegistry } from "./registry";
import type { WidgetDefinition, WidgetInstance } from "./types";

const stat: WidgetDefinition = {
	type: "stat",
	name: "Stat",
	minSize: { w: 1, h: 1 },
	defaultSize: { w: 2, h: 2 },
	Component: ({ settings }) => <span>stat:{String(settings.value ?? 0)}</span>,
};
const note: WidgetDefinition = {
	type: "note",
	name: "Note",
	minSize: { w: 1, h: 1 },
	defaultSize: { w: 2, h: 2 },
	Component: () => <span>note-body</span>,
};
const chart: WidgetDefinition = {
	type: "chart",
	name: "Chart",
	minSize: { w: 1, h: 1 },
	defaultSize: { w: 2, h: 2 },
	Component: () => <span>chart-body</span>,
};
const counter: WidgetDefinition = {
	type: "counter",
	name: "Counter",
	minSize: { w: 1, h: 1 },
	defaultSize: { w: 2, h: 2 },
	settingsSchema: [
		{ key: "label", label: "Label", type: "text", defaultValue: "x" },
	],
	defaultSettings: { label: "x" },
	Component: ({ settings }) => <span>counter:{String(settings.label)}</span>,
};
const registry = createWidgetRegistry([stat, note]);

const seed: WidgetInstance[] = [
	{
		id: "a",
		type: "stat",
		settings: { value: 3 },
		layout: { x: 0, y: 0, w: 2, h: 2 },
	},
	{ id: "b", type: "note", settings: {}, layout: { x: 2, y: 0, w: 2, h: 2 } },
];

const wrap = (ui: React.ReactNode) =>
	render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);

describe("Dashboard", () => {
	it("renders each widget body in view mode", () => {
		wrap(<Dashboard registry={registry} widgets={seed} />);
		expect(screen.getByText("stat:3")).toBeInTheDocument();
		expect(screen.getByText("note-body")).toBeInTheDocument();
	});

	it("renders the empty state when there are no widgets", () => {
		wrap(<Dashboard registry={registry} widgets={[]} />);
		expect(
			screen.getByText(defaultDashboardLabels.emptyHeader),
		).toBeInTheDocument();
	});

	it("renders an unknown-widget placeholder without crashing", () => {
		wrap(
			<Dashboard
				registry={registry}
				widgets={[
					{
						id: "x",
						type: "ghost",
						settings: {},
						layout: { x: 0, y: 0, w: 2, h: 2 },
					},
				]}
			/>,
		);
		expect(
			screen.getByText(defaultDashboardLabels.unknownWidget),
		).toBeInTheDocument();
	});

	it("commits the edited draft on Save", () => {
		const onCommit = vi.fn();
		const onModeChange = vi.fn();
		wrap(
			<Dashboard
				registry={registry}
				widgets={seed}
				mode="edit"
				onCommit={onCommit}
				onModeChange={onModeChange}
			/>,
		);
		fireEvent.click(
			screen.getAllByLabelText(defaultDashboardLabels.removeWidget)[0],
		);
		fireEvent.click(screen.getByText(defaultDashboardLabels.save));
		expect(onCommit).toHaveBeenCalledTimes(1);
		expect(onCommit.mock.calls[0][0]).toHaveLength(1);
		expect(onModeChange).toHaveBeenCalledWith("view");
	});

	it("does not wire layout changes in view mode (no draft mutation on mount)", () => {
		const onDraftChange = vi.fn();
		wrap(
			<Dashboard
				registry={registry}
				widgets={seed}
				mode="view"
				onDraftChange={onDraftChange}
			/>,
		);
		expect(onDraftChange).not.toHaveBeenCalled();
	});

	it("adds a widget from the catalog and commits the larger draft", async () => {
		const onCommit = vi.fn();
		const reg3 = createWidgetRegistry([stat, note, chart]);
		wrap(
			<Dashboard
				registry={reg3}
				widgets={seed}
				mode="edit"
				onCommit={onCommit}
				onModeChange={() => {}}
			/>,
		);
		expect(screen.queryByText("chart-body")).toBeNull();
		fireEvent.click(screen.getByText(defaultDashboardLabels.addWidget)); // open catalog
		// Chakra Drawer uses Zag.js which dispatches state transitions via
		// queueMicrotask, so the portal content is not synchronously in the DOM
		// after fireEvent. Use findByLabelText (async) to await the mount.
		fireEvent.click(await screen.findByLabelText("Chart")); // pick Chart from the catalog
		expect(screen.getByText("chart-body")).toBeInTheDocument(); // added to draft, rendered
		fireEvent.click(screen.getByText(defaultDashboardLabels.save));
		expect(onCommit).toHaveBeenCalledTimes(1);
		expect(onCommit.mock.calls[0][0]).toHaveLength(3);
	});

	it("hides the body of a saved instance the user lacks permission for", () => {
		const adminDef: WidgetDefinition = {
			type: "admin",
			name: "Admin",
			minSize: { w: 1, h: 1 },
			defaultSize: { w: 2, h: 2 },
			requiredPermissions: ["admin"],
			Component: () => <span>secret-admin-body</span>,
		};
		const reg = createWidgetRegistry([adminDef]);
		const w = [
			{
				id: "a",
				type: "admin",
				settings: {},
				layout: { x: 0, y: 0, w: 2, h: 2 },
			},
		];
		const { unmount } = wrap(
			<Dashboard registry={reg} widgets={w} grantedPermissions={[]} />,
		);
		expect(screen.queryByText("secret-admin-body")).toBeNull();
		expect(
			screen.getByText(defaultDashboardLabels.noAccessWidget),
		).toBeInTheDocument();
		unmount();
		wrap(
			<Dashboard registry={reg} widgets={w} grantedPermissions={["admin"]} />,
		);
		expect(screen.getByText("secret-admin-body")).toBeInTheDocument();
	});

	it("persists only changed settings (overrides) from the config drawer", () => {
		const onCommit = vi.fn();
		const multi: WidgetDefinition = {
			type: "multi",
			name: "Multi",
			minSize: { w: 1, h: 1 },
			defaultSize: { w: 2, h: 2 },
			settingsSchema: [
				{ key: "a", label: "A", type: "text", defaultValue: "da" },
				{ key: "b", label: "B", type: "text", defaultValue: "db" },
			],
			defaultSettings: { a: "da", b: "db" },
			Component: () => <span>multi-body</span>,
		};
		const reg = createWidgetRegistry([multi]);
		const w = [
			{
				id: "m",
				type: "multi",
				settings: {},
				layout: { x: 0, y: 0, w: 2, h: 2 },
			},
		];
		wrap(
			<Dashboard
				registry={reg}
				widgets={w}
				mode="edit"
				onCommit={onCommit}
				onModeChange={() => {}}
			/>,
		);
		fireEvent.click(
			screen.getByLabelText(defaultDashboardLabels.configureWidget),
		);
		fireEvent.change(screen.getByLabelText("A"), {
			target: { value: "changed" },
		});
		const dialog = screen.getByRole("dialog");
		fireEvent.click(within(dialog).getByText(defaultDashboardLabels.save));
		fireEvent.click(screen.getByText(defaultDashboardLabels.save)); // toolbar save
		expect(onCommit.mock.calls[0][0][0].settings).toEqual({ a: "changed" });
	});

	it("applies config-drawer changes to the draft on save", () => {
		const onCommit = vi.fn();
		const reg = createWidgetRegistry([counter]);
		const widgets = [
			{
				id: "c",
				type: "counter",
				settings: { label: "old" },
				layout: { x: 0, y: 0, w: 2, h: 2 },
			},
		];
		wrap(
			<Dashboard
				registry={reg}
				widgets={widgets}
				mode="edit"
				onCommit={onCommit}
				onModeChange={() => {}}
			/>,
		);
		expect(screen.getByText("counter:old")).toBeInTheDocument();
		fireEvent.click(
			screen.getByLabelText(defaultDashboardLabels.configureWidget),
		); // open config drawer
		fireEvent.change(screen.getByLabelText("Label"), {
			target: { value: "new" },
		});
		const dialog = screen.getByRole("dialog"); // the config drawer
		fireEvent.click(within(dialog).getByText(defaultDashboardLabels.save)); // drawer Save -> updateSettings + close
		expect(screen.getByText("counter:new")).toBeInTheDocument();
		fireEvent.click(screen.getByText(defaultDashboardLabels.save)); // toolbar Save (drawer closed -> only one)
		expect(onCommit.mock.calls[0][0][0].settings).toEqual({ label: "new" });
	});
});
