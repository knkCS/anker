import type { WidgetDefinition } from "./types";

export interface WidgetRegistry {
	get(type: string): WidgetDefinition | undefined;
	getAll(): WidgetDefinition[];
	getCatalog(grantedPermissions?: string[], ctx?: unknown): WidgetDefinition[];
}

export function isWidgetAvailable(
	def: WidgetDefinition,
	grantedPermissions?: string[],
	ctx?: unknown,
): boolean {
	const granted = grantedPermissions ?? [];
	const hasPerms =
		!def.requiredPermissions?.length ||
		def.requiredPermissions.every((t) => granted.includes(t));
	const predicateOk = def.isAvailable ? def.isAvailable(ctx) !== false : true;
	return hasPerms && predicateOk;
}

export function createWidgetRegistry(
	definitions: WidgetDefinition[],
): WidgetRegistry {
	const byType = new Map<string, WidgetDefinition>();
	for (const def of definitions) byType.set(def.type, def);
	return {
		get: (type) => byType.get(type),
		getAll: () => Array.from(byType.values()),
		getCatalog: (grantedPermissions, ctx) =>
			Array.from(byType.values()).filter((d) =>
				isWidgetAvailable(d, grantedPermissions, ctx),
			),
	};
}
