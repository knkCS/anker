// The one place anker touches lucide's icon set by name. Everything here is
// lazy: the name list is lucide-react's own `dynamicIconImports` map, each
// icon is a separate dynamic import, and the tag/category data and the alias
// table are generated modules loaded only when something asks for them.
import type { LucideIcon } from "lucide-react";
// With the extension: lucide-react has no `exports` map, so Node's ESM
// resolver (a consumer's test runner, SSR) finds the file only by its full
// name. Bundlers resolve it either way.
import dynamicIconImports from "lucide-react/dynamicIconImports.js";
import type { IconEntry } from "./types";

type IconImporter = () => Promise<{ default: LucideIcon }>;

const importers = dynamicIconImports as unknown as Readonly<
	Record<string, IconImporter>
>;

/** Every icon lucide-react can load, by lucide name (`"file-text"`). */
export const ICON_NAMES: readonly string[] = Object.keys(importers);

/** Whether `name` is a current lucide icon name. */
export function isIconName(name: string): boolean {
	return Object.hasOwn(importers, name);
}

// Resolved components (or null for "no such icon"), shared by every
// DynamicIcon so a list of a hundred rows imports each icon once and a
// re-mounted row renders its icon on the first frame.
const cache = new Map<string, LucideIcon | null>();
const pending = new Map<string, Promise<LucideIcon | null>>();

/** The icon if it has already loaded; `undefined` if not yet known. */
export function getLoadedIcon(name: string): LucideIcon | null | undefined {
	return cache.get(name);
}

let aliasesPromise: Promise<Readonly<Record<string, string>>> | null = null;

/**
 * The current name for a lucide name: itself, or — for a name lucide has
 * since renamed (`alert-triangle` → `triangle-alert`) — its successor. null
 * when it is neither. The alias table loads only on a miss.
 */
export async function resolveIconName(name: string): Promise<string | null> {
	if (isIconName(name)) return name;
	if (!name) return null;
	aliasesPromise ??= import("./lucide-aliases.generated").then(
		(m) => m.default,
	);
	try {
		const target = (await aliasesPromise)[name];
		return target && isIconName(target) ? target : null;
	} catch {
		aliasesPromise = null;
		return null;
	}
}

/**
 * Loads one icon by lucide name (or former name). Resolves to null for a
 * name lucide does not know or a chunk that fails to load — the caller shows
 * its fallback either way.
 */
export function loadIcon(name: string): Promise<LucideIcon | null> {
	const cached = cache.get(name);
	if (cached !== undefined) return Promise.resolve(cached);
	let promise = pending.get(name);
	if (!promise) {
		promise = resolveIconName(name)
			.then((resolved) =>
				resolved ? importers[resolved]().then((m) => m.default) : null,
			)
			.then(
				(icon) => {
					cache.set(name, icon);
					return icon;
				},
				() => {
					// A failed chunk is not "unknown": leave it uncached so a later
					// mount retries, but render the fallback for now.
					return null;
				},
			)
			.finally(() => pending.delete(name));
		pending.set(name, promise);
	}
	return promise;
}

export interface IconCatalog {
	entries: IconEntry[];
	categories: ReadonlyArray<{ id: string; title: string }>;
}

let catalogPromise: Promise<IconCatalog> | null = null;

/**
 * lucide's tags and categories for every loadable icon, generated from the
 * lucide release that matches the installed lucide-react. Loaded on first
 * call (the picker calls it when it opens) and kept.
 */
export function loadIconCatalog(): Promise<IconCatalog> {
	catalogPromise ??= import("./lucide-metadata.generated").then(
		({ default: metadata }) => {
			const byName = new Map(metadata.icons.map((icon) => [icon[0], icon]));
			return {
				// The name list stays lucide-react's own: an icon the data file
				// lacks is still pickable, it just has no tags.
				entries: ICON_NAMES.map((name) => {
					const icon = byName.get(name);
					return {
						name,
						tags: icon?.[1] ?? [],
						categories: icon?.[2] ?? [],
					};
				}),
				categories: metadata.categories.map(([id, title]) => ({ id, title })),
			};
		},
		(error) => {
			catalogPromise = null;
			throw error;
		},
	);
	return catalogPromise;
}

/** The name list as bare entries — what search runs on before the catalog loads. */
export const BARE_ENTRIES: readonly IconEntry[] = ICON_NAMES.map((name) => ({
	name,
	tags: [],
	categories: [],
}));
