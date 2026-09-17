import { describe, expect, it } from "vitest";
import {
	buildReorderAnnouncements,
	type ReorderableRow,
	resolveRowReorder,
	rowPosition,
} from "../row-reorder";

const rows: ReorderableRow[] = [
	{ id: "a", index: 0 },
	{ id: "b", index: 1 },
	{ id: "c", index: 2 },
];

describe("resolveRowReorder", () => {
	it("returns the data indices of the dragged and target rows", () => {
		expect(resolveRowReorder(rows, "a", "c")).toEqual({
			fromIndex: 0,
			toIndex: 2,
		});
		expect(resolveRowReorder(rows, "c", "b")).toEqual({
			fromIndex: 2,
			toIndex: 1,
		});
	});

	it("reports the data index, never the visible position", () => {
		// Visible order c, a, b — each row keeps its index into `data`. Reorder is
		// not meant to be offered alongside sorting, but the contract is still that
		// the indices address `data`, so a consumer never has to translate them.
		const shuffled: ReorderableRow[] = [
			{ id: "c", index: 2 },
			{ id: "a", index: 0 },
			{ id: "b", index: 1 },
		];

		expect(resolveRowReorder(shuffled, "c", "b")).toEqual({
			fromIndex: 2,
			toIndex: 1,
		});
	});

	it("returns null when the row is dropped on itself", () => {
		expect(resolveRowReorder(rows, "b", "b")).toBeNull();
	});

	it("returns null when either row is unknown", () => {
		expect(resolveRowReorder(rows, "a", "zzz")).toBeNull();
		expect(resolveRowReorder(rows, "zzz", "a")).toBeNull();
	});

	it("returns null when there is no drop target", () => {
		expect(resolveRowReorder(rows, "a", null)).toBeNull();
		expect(resolveRowReorder(rows, "a", undefined)).toBeNull();
	});
});

describe("rowPosition", () => {
	it("reports the 1-based visible position", () => {
		expect(rowPosition(rows, "a")).toBe(1);
		expect(rowPosition(rows, "c")).toBe(3);
	});

	it("reports 0 for a row that is not rendered", () => {
		expect(rowPosition(rows, "zzz")).toBe(0);
	});
});

describe("buildReorderAnnouncements", () => {
	const announcements = buildReorderAnnouncements(rows);
	const active = { id: "a" } as never;
	const over = { id: "c" } as never;

	it("announces the picked-up row with its position and the total", () => {
		expect(announcements.onDragStart({ active })).toContain("row 1 of 3");
	});

	it("announces the target position while dragging over another row", () => {
		expect(announcements.onDragOver({ active, over })).toBe(
			"Row 1 moved to position 3 of 3.",
		);
	});

	it("announces the final position on drop", () => {
		expect(announcements.onDragEnd({ active, over })).toBe(
			"Row dropped at position 3 of 3.",
		);
	});

	it("says the row came back when it is dropped where it started", () => {
		expect(announcements.onDragEnd({ active, over: active })).toBe(
			"Row returned to position 1 of 3.",
		);
	});

	it("says nothing about a row that is no longer rendered", () => {
		const gone = { id: "zzz" } as never;

		expect(announcements.onDragStart({ active: gone })).toBeUndefined();
		expect(announcements.onDragOver({ active, over: gone })).toBeUndefined();
		expect(announcements.onDragEnd({ active, over: gone })).toBeUndefined();
		expect(
			announcements.onDragCancel({ active: gone, over: null }),
		).toBeUndefined();
	});

	it("announces a cancelled drag", () => {
		expect(announcements.onDragCancel({ active, over: null })).toBe(
			"Reordering cancelled. Row 1 returned to its original position.",
		);
	});

	it("treats a drop with no target as a cancel", () => {
		expect(announcements.onDragEnd({ active, over: null })).toBe(
			"Reordering cancelled. Row 1 returned to its original position.",
		);
	});
});
