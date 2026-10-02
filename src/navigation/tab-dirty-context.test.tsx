import { act, render, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TabDirtyProvider, useTabDirty } from "./tab-dirty-context";

describe("TabDirtyContext", () => {
	it("starts clean for any key and flips per key independently", () => {
		const { result } = renderHook(() => useTabDirty(), {
			wrapper: ({ children }) => (
				<TabDirtyProvider>{children}</TabDirtyProvider>
			),
		});
		expect(result.current.isTabDirty("editor")).toBe(false);
		expect(result.current.isTabDirty("general")).toBe(false);

		act(() => result.current.setTabDirty("editor", true));
		expect(result.current.isTabDirty("editor")).toBe(true);
		expect(result.current.isTabDirty("general")).toBe(false);

		act(() => result.current.setTabDirty("general", true));
		expect(result.current.isTabDirty("editor")).toBe(true);
		expect(result.current.isTabDirty("general")).toBe(true);

		act(() => result.current.setTabDirty("editor", false));
		expect(result.current.isTabDirty("editor")).toBe(false);
		expect(result.current.isTabDirty("general")).toBe(true);
	});

	it("lists the dirty tabs in the order they became dirty, for one header Save", () => {
		const { result } = renderHook(() => useTabDirty(), {
			wrapper: ({ children }) => (
				<TabDirtyProvider>{children}</TabDirtyProvider>
			),
		});
		expect(result.current.dirtyTabs).toEqual([]);

		act(() => result.current.setTabDirty("schema", true));
		act(() => result.current.setTabDirty("general", true));
		expect(result.current.dirtyTabs).toEqual(["schema", "general"]);

		// Re-marking a dirty tab does not reorder it.
		act(() => result.current.setTabDirty("schema", true));
		expect(result.current.dirtyTabs).toEqual(["schema", "general"]);

		act(() => result.current.setTabDirty("schema", false));
		expect(result.current.dirtyTabs).toEqual(["general"]);

		// A tab that turns dirty again goes to the end.
		act(() => result.current.setTabDirty("schema", true));
		expect(result.current.dirtyTabs).toEqual(["general", "schema"]);
	});

	it("keeps the dirtyTabs reference stable while nothing changes", () => {
		const { result } = renderHook(() => useTabDirty(), {
			wrapper: ({ children }) => (
				<TabDirtyProvider>{children}</TabDirtyProvider>
			),
		});
		act(() => result.current.setTabDirty("general", true));
		const before = result.current.dirtyTabs;
		act(() => result.current.setTabDirty("general", true));
		act(() => result.current.setTabDirty("other", false));
		expect(result.current.dirtyTabs).toBe(before);
	});

	it("default (no provider) returns clean state and no-op setter", () => {
		const { result } = renderHook(() => useTabDirty());
		expect(result.current.isTabDirty("editor")).toBe(false);
		expect(result.current.dirtyTabs).toEqual([]);
		expect(() => result.current.setTabDirty("editor", true)).not.toThrow();
	});

	it("renders children", () => {
		const { getByText } = render(
			<TabDirtyProvider>
				<span>hello</span>
			</TabDirtyProvider>,
		);
		expect(getByText("hello")).toBeTruthy();
	});
});
