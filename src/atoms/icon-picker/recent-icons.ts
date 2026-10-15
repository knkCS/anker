import { readStoredValue, writeStoredValue } from "../../utils/safe-storage";

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
 * rather than throwing into render, and a list storage would not take is
 * remembered for the session.
 */
export function readRecent(key: string): string[] {
	try {
		const raw = readStoredValue(key);
		if (!raw) return [];
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((n): n is string => typeof n === "string");
	} catch {
		return [];
	}
}

/** Stores the list — in memory for the session when storage will not take it. */
export function writeRecent(key: string, list: readonly string[]): void {
	writeStoredValue(key, JSON.stringify(list));
}
