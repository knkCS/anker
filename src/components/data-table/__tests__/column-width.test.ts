import { describe, expect, it } from "vitest";
import { columnWidth, tableMinWidth } from "../column-width";
import { REORDER_HANDLE_SIZE } from "../row-reorder";

const BUILT_IN = new Set(["_reorder", "_select"]);

describe("columnWidth", () => {
	it("adds the cell's padding to a column's size", () => {
		expect(columnWidth({ id: "name", size: 180 })).toBe(
			"calc(180px + 2 * {spacing.3})",
		);
	});

	it("pads a built-in column like any other: the drag handle plus the cell's padding", () => {
		expect(columnWidth({ id: "_reorder", size: REORDER_HANDLE_SIZE })).toBe(
			"calc(44px + 2 * {spacing.3})",
		);
	});

	it("leaves a column without a size to flex, minSize or not", () => {
		expect(columnWidth({ id: "name" })).toBeUndefined();
		expect(columnWidth({ id: "_actions", minSize: 140 })).toBeUndefined();
	});
});

describe("tableMinWidth", () => {
	it("is undefined when no column of the consumer's carries a width", () => {
		expect(
			tableMinWidth(
				[
					{ id: "_reorder", size: REORDER_HANDLE_SIZE },
					{ id: "a" },
					{ id: "b" },
				],
				BUILT_IN,
			),
		).toBeUndefined();
	});

	it("sums every column's size or minSize and every column's padding", () => {
		expect(
			tableMinWidth(
				[
					{ id: "_reorder", size: REORDER_HANDLE_SIZE },
					{ id: "_select", size: 16 },
					{ id: "a", size: 200 },
					{ id: "b" },
					{ id: "_actions", minSize: 140 },
				],
				BUILT_IN,
			),
		).toBe("calc(400px + 10 * {spacing.3})");
	});
});
