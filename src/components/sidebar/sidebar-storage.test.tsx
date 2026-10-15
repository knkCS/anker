// src/components/sidebar/sidebar-storage.test.tsx
//
// The Sidebar remembers whether it is collapsed under `storageKey`. Storage
// is a convenience: when it is missing, blocked or broken the sidebar still
// renders and toggles, and remembers its state in memory for the session.
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BROKEN_STORAGE_SHAPES, breakLocalStorage } from "../../test/storage";
import { Sidebar } from "./sidebar";

let restore: (() => void) | undefined;
let keySeq = 0;
// Every test its own key: a value held in memory for the session must not
// become the next test's starting state.
const nextKey = () => `test.sidebar.storage.${++keySeq}`;

function renderSidebar(storageKey: string) {
	return render(
		<ChakraProvider value={defaultSystem}>
			<Sidebar storageKey={storageKey}>
				<Sidebar.Body>body</Sidebar.Body>
			</Sidebar>
		</ChakraProvider>,
	);
}

const collapsedState = () =>
	screen.getByTestId("sidebar").getAttribute("data-collapsed");

beforeEach(() => {
	Object.defineProperty(window, "innerWidth", {
		configurable: true,
		value: 1600,
	});
	window.localStorage.clear();
});

afterEach(() => {
	cleanup();
	restore?.();
	restore = undefined;
});

describe("Sidebar with working storage", () => {
	it("starts from the stored value", () => {
		const key = nextKey();
		window.localStorage.setItem(key, "true");
		renderSidebar(key);
		expect(collapsedState()).toBe("true");
	});

	it("stores each toggle and starts from it on the next mount", () => {
		const key = nextKey();
		renderSidebar(key);
		expect(collapsedState()).toBe("false");
		fireEvent.click(screen.getByTestId("sidebar-toggle"));
		expect(window.localStorage.getItem(key)).toBe("true");
		cleanup();
		renderSidebar(key);
		expect(collapsedState()).toBe("true");
	});
});

describe.each(BROKEN_STORAGE_SHAPES)("Sidebar when storage is %s", (shape) => {
	it("renders with its default and toggles both ways", () => {
		restore = breakLocalStorage(shape);
		const key = nextKey();
		renderSidebar(key);
		expect(collapsedState()).toBe("false");
		fireEvent.click(screen.getByTestId("sidebar-toggle"));
		expect(collapsedState()).toBe("true");
		fireEvent.click(screen.getByTestId("sidebar-toggle"));
		expect(collapsedState()).toBe("false");
	});

	it("remembers the toggled state in memory for the session", () => {
		restore = breakLocalStorage(shape);
		const key = nextKey();
		renderSidebar(key);
		fireEvent.click(screen.getByTestId("sidebar-toggle"));
		cleanup();
		renderSidebar(key);
		expect(collapsedState()).toBe("true");
	});
});
