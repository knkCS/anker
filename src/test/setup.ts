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
