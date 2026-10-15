// src/utils/safe-storage.ts
//
// `localStorage` for small remembered UI state (a collapsed sidebar, rail or
// sub-nav) that never throws. Storage can be missing (a non-browser global),
// throw on access (blocked by the browser or privacy settings), throw on write
// (a full quota) or lack working methods (Node 25's global `localStorage`
// without `--localstorage-file`). In every one of those cases the value is
// kept in memory instead, so it still holds for the rest of the session.

const memory = new Map<string, string>();

function usableStorage(): Storage | undefined {
	try {
		const storage = globalThis.localStorage;
		if (
			storage &&
			typeof storage.getItem === "function" &&
			typeof storage.setItem === "function"
		) {
			return storage;
		}
	} catch {
		// Access itself is denied.
	}
	return undefined;
}

/**
 * The value stored under `key`, or `null`. A value that could only be kept
 * in memory wins over storage: it is the newer one.
 */
export function readStoredValue(key: string): string | null {
	const remembered = memory.get(key);
	if (remembered !== undefined) return remembered;
	try {
		return usableStorage()?.getItem(key) ?? null;
	} catch {
		return null;
	}
}

/** Stores `value` under `key`, in memory when storage will not take it. */
export function writeStoredValue(key: string, value: string): void {
	const storage = usableStorage();
	if (storage) {
		try {
			storage.setItem(key, value);
			memory.delete(key);
			return;
		} catch {
			// Fall through to memory.
		}
	}
	memory.set(key, value);
}

/** `true`/`false` as stored under `key`; `undefined` for anything else. */
export function readStoredFlag(key: string): boolean | undefined {
	const stored = readStoredValue(key);
	if (stored === "true") return true;
	if (stored === "false") return false;
	return undefined;
}

/** Stores a flag under `key` as `"true"`/`"false"`. */
export function writeStoredFlag(key: string, value: boolean): void {
	writeStoredValue(key, String(value));
}
