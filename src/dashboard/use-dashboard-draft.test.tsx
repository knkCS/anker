import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { WidgetDefinition, WidgetInstance } from "./types";
import { useDashboardDraft } from "./use-dashboard-draft";

const widgets: WidgetInstance[] = [
	{ id: "a", type: "x", settings: {}, layout: { x: 0, y: 0, w: 2, h: 2 } },
];
const def = {
	type: "y",
	name: "Y",
	minSize: { w: 1, h: 1 },
	defaultSize: { w: 3, h: 2 },
	defaultSettings: { foo: 1 },
	Component: () => null,
} as WidgetDefinition;
const genId = () => "new";

describe("useDashboardDraft", () => {
	it("returns saved widgets and is not dirty in view mode", () => {
		const { result } = renderHook(() =>
			useDashboardDraft({ widgets, mode: "view", generateId: genId }),
		);
		expect(result.current.items).toEqual(widgets);
		expect(result.current.isDirty).toBe(false);
	});

	it("adds a widget to the draft in edit mode and marks dirty", () => {
		const { result } = renderHook(() =>
			useDashboardDraft({ widgets, mode: "edit", generateId: genId }),
		);
		act(() => result.current.addWidget(def));
		expect(result.current.items).toHaveLength(2);
		expect(result.current.items[1]).toMatchObject({
			id: "new",
			type: "y",
			settings: { foo: 1 },
		});
		expect(result.current.isDirty).toBe(true);
	});

	it("removes a widget from the draft", () => {
		const { result } = renderHook(() =>
			useDashboardDraft({ widgets, mode: "edit", generateId: genId }),
		);
		act(() => result.current.removeWidget("a"));
		expect(result.current.items).toHaveLength(0);
		expect(result.current.isDirty).toBe(true);
	});

	it("discards the draft when leaving edit mode", () => {
		const { result, rerender } = renderHook(
			({ mode }: { mode: "view" | "edit" }) =>
				useDashboardDraft({ widgets, mode, generateId: genId }),
			{ initialProps: { mode: "edit" } },
		);
		act(() => result.current.removeWidget("a"));
		expect(result.current.items).toHaveLength(0);
		rerender({ mode: "view" });
		expect(result.current.items).toEqual(widgets);
		expect(result.current.isDirty).toBe(false);
	});

	it("updateSettings replaces an instance's settings", () => {
		const { result } = renderHook(() =>
			useDashboardDraft({ widgets, mode: "edit", generateId: genId }),
		);
		act(() => result.current.updateSettings("a", { hello: "world" }));
		expect(result.current.getDraft()[0].settings).toEqual({ hello: "world" });
	});

	it("seeds a cloned (not identical) draft when mounted in edit mode", () => {
		const { result } = renderHook(() =>
			useDashboardDraft({ widgets, mode: "edit", generateId: genId }),
		);
		expect(result.current.items).toEqual(widgets);
		expect(result.current.items).not.toBe(widgets); // cloned, not the caller's array
		expect(result.current.isDirty).toBe(false);
	});

	it("reverts an effect-seeded, mutated draft when leaving edit mode (clone path)", () => {
		const { result, rerender } = renderHook(
			({ mode }: { mode: "view" | "edit" }) =>
				useDashboardDraft({ widgets, mode, generateId: genId }),
			{ initialProps: { mode: "view" } },
		);
		rerender({ mode: "edit" }); // effect seeds the clone
		act(() => result.current.updateSettings("a", { changed: true }));
		expect(result.current.getDraft()[0].settings).toEqual({ changed: true });
		rerender({ mode: "view" });
		expect(result.current.items).toEqual(widgets);
		expect(result.current.isDirty).toBe(false);
	});

	it("fires onDraftChange on each mutation", () => {
		const onDraftChange = vi.fn();
		const { result } = renderHook(() =>
			useDashboardDraft({
				widgets,
				mode: "edit",
				generateId: genId,
				onDraftChange,
			}),
		);
		act(() => result.current.removeWidget("a"));
		expect(onDraftChange).toHaveBeenCalledTimes(1);
		expect(onDraftChange.mock.calls[0][0]).toHaveLength(0);
	});

	it("updateLayouts updates the matched instance's layout", () => {
		const { result } = renderHook(() =>
			useDashboardDraft({ widgets, mode: "edit", generateId: genId }),
		);
		act(() =>
			result.current.updateLayouts([{ i: "a", x: 5, y: 6, w: 3, h: 4 }]),
		);
		expect(result.current.getDraft()[0].layout).toEqual({
			x: 5,
			y: 6,
			w: 3,
			h: 4,
		});
	});

	it("never mutates the caller's widgets when the draft changes", () => {
		const original = structuredClone(widgets);
		const { result } = renderHook(() =>
			useDashboardDraft({ widgets, mode: "edit", generateId: genId }),
		);
		act(() => result.current.updateSettings("a", { changed: true }));
		act(() =>
			result.current.updateLayouts([{ i: "a", x: 9, y: 9, w: 9, h: 9 }]),
		);
		expect(widgets).toEqual(original); // caller's array + items untouched
	});
});
