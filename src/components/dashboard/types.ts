import type React from "react";

export type DashboardMode = "view" | "edit";

export interface WidgetSettingField {
	key: string;
	label: string;
	type: "number" | "boolean" | "select" | "text";
	options?: Array<{ label: string; value: unknown }>;
	defaultValue?: unknown;
}

export interface WidgetRenderProps<TSettings = Record<string, unknown>> {
	id: string;
	settings: TSettings;
	mode: DashboardMode;
}

export interface WidgetConfigEditorProps<TSettings = Record<string, unknown>> {
	settings: TSettings;
	onChange: (next: TSettings) => void;
}

export interface WidgetSize {
	w: number;
	h: number;
}

export interface WidgetDefinition<TSettings = Record<string, unknown>> {
	type: string;
	name: string;
	description?: string;
	icon?: React.ReactNode;
	category?: string;
	minSize: WidgetSize;
	defaultSize: WidgetSize;
	maxSize?: WidgetSize;
	defaultSettings?: TSettings;
	settingsSchema?: WidgetSettingField[];
	requiredPermissions?: string[];
	isAvailable?: (ctx: unknown) => boolean;
	Component: React.FC<WidgetRenderProps<TSettings>>;
	ConfigEditor?: React.FC<WidgetConfigEditorProps<TSettings>>;
}

export interface WidgetLayout {
	x: number;
	y: number;
	w: number;
	h: number;
}

export interface WidgetInstance {
	id: string;
	type: string;
	settings: Record<string, unknown>;
	layout: WidgetLayout;
}

export interface GridConfig {
	cols?: number;
	rowHeight?: number;
	margin?: [number, number];
	containerPadding?: [number, number];
}
