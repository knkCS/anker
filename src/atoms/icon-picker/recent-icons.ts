/** The recently-used row's storage key when the consumer names none. */
export const DEFAULT_RECENT_STORAGE_KEY = "anker:icon-picker:recent";

/** The picked icon first, de-duplicated, capped at `max`. */
export function pushRecent(
	list: readonly string[],
	name: string,
	max: number,
): string[] {
	return [name, ...list.filter((n) => n !== name)].slice(0, Math.max(0, max));
}

/**
 * The stored list, or `[]`. Storage is a convenience here: a private window,
 * blocked site data or someone else's value under the key all read as empty
 * rather than throwing into render.
 */
export function readRecent(key: string): string[] {
	try {
		const raw = globalThis.localStorage?.getItem(key);
		if (!raw) return [];
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((n): n is string => typeof n === "string");
	} catch {
		return [];
	}
}

/** Stores the list; a storage failure only costs the row its memory. */
export function writeRecent(key: string, list: readonly string[]): void {
	try {
		globalThis.localStorage?.setItem(key, JSON.stringify(list));
	} catch {
		// Nothing to do — the picker works without the recent row.
	}
}
