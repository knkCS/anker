import type { WidgetDefinition, WidgetInstance } from "./types";

export function resolveWidgetSettings(
	def: WidgetDefinition | undefined,
	instance: WidgetInstance,
): Record<string, unknown> {
	return { ...(def?.defaultSettings ?? {}), ...(instance.settings ?? {}) };
}
