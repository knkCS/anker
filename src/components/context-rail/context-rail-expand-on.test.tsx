// src/components/context-rail/context-rail-expand-on.test.tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContextRail, type ContextRailResizable } from "./context-rail";

const KEY = "test.expand-on-rail";

const RESIZABLE: ContextRailResizable = {
	defaultWidth: 360,
	minWidth: 320,
	maxWidth: 600,
};

interface RailProps {
	expandOn?: unknown;
	storageKey?: string;
	resizable?: ContextRailResizable;
}

function ui(props: RailProps) {
	return (
		<ChakraProvider value={defaultSystem}>
			<button type="button" data-testid="canvas-step">
				Step
			</button>
			<ContextRail {...props}>
				<div data-testid="rail-body">step form</div>
			</ContextRail>
		</ChakraProvider>
	);
}

function renderRail(props: RailProps) {
	const result = render(ui(props));
	return { ...result, update: (next: RailProps) => result.rerender(ui(next)) };
}

function collapsedAttr() {
	return screen.getByTestId("context-rail").getAttribute("data-collapsed");
}

describe("ContextRail expandOn", () => {
	beforeEach(() => {
		localStorage.clear();
		// A laptop: below the 1440px breakpoint the rail starts collapsed.
		Object.defineProperty(window, "innerWidth", {
			value: 1024,
			configurable: true,
		});
	});
	afterEach(() => {
		vi.restoreAllMocks();
		localStorage.clear();
	});

	it("does not expand on mount, so a remembered collapse survives a reload", () => {
		localStorage.setItem(KEY, "true");
		renderRail({ expandOn: "step-1", storageKey: KEY });
		expect(collapsedAttr()).toBe("true");
		expect(localStorage.getItem(KEY)).toBe("true");
	});

	it("expands a collapsed rail when the value changes", () => {
		const rail = renderRail({ expandOn: undefined });
		expect(collapsedAttr()).toBe("true");
		rail.update({ expandOn: "step-1" });
		expect(collapsedAttr()).toBe("false");
		expect(screen.getByTestId("rail-body")).toBeInTheDocument();
	});

	it("treats any value but null, undefined and false as an open signal", () => {
		const rail = renderRail({ expandOn: undefined });
		rail.update({ expandOn: 0 });
		expect(collapsedAttr()).toBe("false");
	});

	it("does nothing on a change to null, undefined or false", () => {
		const rail = renderRail({ expandOn: "step-1" });
		rail.update({ expandOn: null });
		expect(collapsedAttr()).toBe("true");
		rail.update({ expandOn: undefined });
		expect(collapsedAttr()).toBe("true");
		rail.update({ expandOn: false });
		expect(collapsedAttr()).toBe("true");
	});

	it("respects the user's collapse until the value changes again", async () => {
		const user = userEvent.setup();
		const rail = renderRail({ expandOn: undefined, storageKey: KEY });
		rail.update({ expandOn: "step-1" });
		expect(collapsedAttr()).toBe("false");

		await user.click(screen.getByTestId("context-rail-toggle"));
		expect(collapsedAttr()).toBe("true");
		rail.update({ expandOn: "step-1" });
		expect(collapsedAttr()).toBe("true");

		rail.update({ expandOn: "step-2" });
		expect(collapsedAttr()).toBe("false");
	});

	it("re-expands after a manual collapse when the value returns from null", async () => {
		const user = userEvent.setup();
		const rail = renderRail({ expandOn: "step-1" });
		rail.update({ expandOn: "step-2" });
		await user.click(screen.getByTestId("context-rail-toggle"));
		rail.update({ expandOn: null });
		expect(collapsedAttr()).toBe("true");
		rail.update({ expandOn: "step-2" });
		expect(collapsedAttr()).toBe("false");
	});

	it("stores the expand under storageKey like a manual expand", () => {
		localStorage.setItem(KEY, "true");
		const rail = renderRail({ expandOn: undefined, storageKey: KEY });
		rail.update({ expandOn: "step-1", storageKey: KEY });
		expect(localStorage.getItem(KEY)).toBe("false");
		rail.unmount();
		renderRail({ storageKey: KEY });
		expect(collapsedAttr()).toBe("false");
	});

	it("still expands when storage throws", () => {
		vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
			throw new Error("blocked");
		});
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new Error("blocked");
		});
		const rail = renderRail({ expandOn: undefined, storageKey: KEY });
		expect(collapsedAttr()).toBe("true");
		rail.update({ expandOn: "step-1", storageKey: KEY });
		expect(collapsedAttr()).toBe("false");
	});

	it("expands a resizable rail to its stored width", () => {
		localStorage.setItem(KEY, "true");
		localStorage.setItem(`${KEY}:width`, "480");
		const props = { storageKey: KEY, resizable: RESIZABLE };
		const rail = renderRail({ ...props, expandOn: undefined });
		rail.update({ ...props, expandOn: "step-1" });
		expect(collapsedAttr()).toBe("false");
		expect(screen.getByTestId("context-rail").style.width).toBe("480px");
		expect(screen.getByRole("separator")).toBeInTheDocument();
	});

	it("leaves focus where the user acted", () => {
		const rail = renderRail({ expandOn: undefined });
		const step = screen.getByTestId("canvas-step");
		step.focus();
		rail.update({ expandOn: "step-1" });
		expect(collapsedAttr()).toBe("false");
		expect(document.activeElement).toBe(step);
	});

	it("leaves an expanded rail expanded and a rail without the prop alone", () => {
		Object.defineProperty(window, "innerWidth", {
			value: 1600,
			configurable: true,
		});
		const rail = renderRail({});
		expect(collapsedAttr()).toBe("false");
		rail.update({ expandOn: "step-1" });
		expect(collapsedAttr()).toBe("false");
	});
});
