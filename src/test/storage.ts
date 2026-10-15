// Test helpers: put a broken `localStorage` in place for one test, the way a
// browser with blocked storage or a non-browser global would present it.
// These do not replace storage for the suite — every test that uses one
// restores jsdom's own on the way out.

type StorageShape =
	| "absent"
	| "throws-on-access"
	| "throws-on-write"
	| "no-methods";

/**
 * Replaces `window.localStorage` with the given broken shape and returns a
 * function that puts jsdom's back. A "throws-on-write" storage still reads
 * (an empty store), as a full quota does.
 */
export function breakLocalStorage(shape: StorageShape): () => void {
	const original = Object.getOwnPropertyDescriptor(window, "localStorage");
	const denied = () =>
		new DOMException("The operation is insecure.", "SecurityError");
	let descriptor: PropertyDescriptor;
	switch (shape) {
		case "absent":
			descriptor = { value: undefined };
			break;
		case "throws-on-access":
			descriptor = {
				get() {
					throw denied();
				},
			};
			break;
		case "throws-on-write":
			descriptor = {
				value: {
					length: 0,
					clear() {},
					getItem: () => null,
					key: () => null,
					removeItem() {},
					setItem() {
						throw new DOMException("Quota exceeded", "QuotaExceededError");
					},
				} satisfies Storage,
			};
			break;
		case "no-methods":
			descriptor = { value: {} };
			break;
	}
	Object.defineProperty(window, "localStorage", {
		configurable: true,
		...descriptor,
	});
	return () => {
		if (original) Object.defineProperty(window, "localStorage", original);
	};
}

export const BROKEN_STORAGE_SHAPES = [
	"absent",
	"throws-on-access",
	"throws-on-write",
	"no-methods",
] as const satisfies readonly StorageShape[];
