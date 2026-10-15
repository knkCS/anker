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

// react-grid-layout needs these in jsdom
if (!("ResizeObserver" in globalThis)) {
	(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
}
if (typeof window !== "undefined" && !window.matchMedia) {
	window.matchMedia = ((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener() {},
		removeListener() {},
		addEventListener() {},
		removeEventListener() {},
		dispatchEvent() {
			return false;
		},
	})) as unknown as typeof window.matchMedia;
}
