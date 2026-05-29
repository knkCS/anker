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

	it("default (no provider) returns clean state and no-op setter", () => {
		const { result } = renderHook(() => useTabDirty());
		expect(result.current.isTabDirty("editor")).toBe(false);
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
