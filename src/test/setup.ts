import "@testing-library/jest-dom/vitest";

// jsdom does not implement ResizeObserver; mock it to prevent unhandled errors
// from Zag's floating-ui popper positioning code in tests.
if (typeof globalThis.ResizeObserver === "undefined") {
	globalThis.ResizeObserver = class ResizeObserver {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
}

// Node 25 exposes a built-in localStorage that requires --localstorage-file to
// work properly, but its API surface differs from the Web Storage spec (e.g.
// no .clear()). Swap in a simple in-memory Map-based implementation so tests
// can call getItem/setItem/removeItem/clear without hitting the Node runtime.
const _storage = new Map<string, string>();
const localStorageMock: Storage = {
	get length() {
		return _storage.size;
	},
	key(index: number) {
		return Array.from(_storage.keys())[index] ?? null;
	},
	getItem(key: string) {
		return _storage.get(key) ?? null;
	},
	setItem(key: string, value: string) {
		_storage.set(key, String(value));
	},
	removeItem(key: string) {
		_storage.delete(key);
	},
	clear() {
		_storage.clear();
	},
};
Object.defineProperty(globalThis, "localStorage", {
	value: localStorageMock,
	writable: true,
	configurable: true,
});
