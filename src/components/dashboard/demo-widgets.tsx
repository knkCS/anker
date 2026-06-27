import { FileText, Hash, ShieldCheck } from "lucide-react";
import { Text } from "../../primitives/typography";
import { createWidgetRegistry } from "./registry";
import type { WidgetDefinition } from "./types";

export const statTileWidget: WidgetDefinition = {
	type: "demo-stat",
	name: "Stat tile",
	description: "A single labelled number",
	icon: <Hash size={18} />,
	category: "Metrics",
	minSize: { w: 2, h: 2 },
	defaultSize: { w: 3, h: 2 },
	maxSize: { w: 6, h: 4 },
	defaultSettings: { label: "Items", value: 42 },
	settingsSchema: [
		{ key: "label", label: "Label", type: "text", defaultValue: "Items" },
		{ key: "value", label: "Value", type: "number", defaultValue: 42 },
	],
	Component: ({ settings }) => (
		<>
			<Text fontSize="3xl" fontWeight="bold">
				{String(settings.value)}
			</Text>
			<Text fontSize="sm" color="muted">
				{String(settings.label)}
			</Text>
		</>
	),
};

export const notesWidget: WidgetDefinition = {
	type: "demo-notes",
	name: "Notes",
	description: "A free-text note",
	icon: <FileText size={18} />,
	category: "General",
	minSize: { w: 2, h: 2 },
	defaultSize: { w: 4, h: 3 },
	defaultSettings: { text: "Write something..." },
	settingsSchema: [
		{
			key: "text",
			label: "Text",
			type: "text",
			defaultValue: "Write something...",
		},
	],
	Component: ({ settings }) => (
		<Text fontSize="sm">{String(settings.text)}</Text>
	),
};

export const adminWidget: WidgetDefinition = {
	type: "demo-admin",
	name: "Admin panel",
	description: "Visible only with the 'admin' permission",
	icon: <ShieldCheck size={18} />,
	category: "Admin",
	minSize: { w: 2, h: 2 },
	defaultSize: { w: 3, h: 2 },
	requiredPermissions: ["admin"],
	Component: () => <Text fontSize="sm">Admin only</Text>,
};

export const demoRegistry = createWidgetRegistry([
	statTileWidget,
	notesWidget,
	adminWidget,
]);
