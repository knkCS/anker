import { describe, expect, it } from "vitest";
import { columnWidth, tableMinWidth } from "../column-width";
import { REORDER_COLUMN_WIDTH } from "../row-reorder";

const BUILT_IN = new Map([
	["_reorder", REORDER_COLUMN_WIDTH],
	["_select", 40],
]);

describe("columnWidth", () => {
	it("gives a built-in column its whole width, padding included", () => {
		expect(
			columnWidth({ id: "_reorder", size: REORDER_COLUMN_WIDTH }, BUILT_IN),
		).toBe("52px");
	});

	it("adds the cell's padding to a column's size", () => {
		expect(columnWidth({ id: "name", size: 180 }, BUILT_IN)).toBe(
			"calc(180px + 2 * {spacing.3})",
		);
	});

	it("leaves a column without a size to flex, minSize or not", () => {
		expect(columnWidth({ id: "name" }, BUILT_IN)).toBeUndefined();
		expect(
			columnWidth({ id: "_actions", minSize: 140 }, BUILT_IN),
		).toBeUndefined();
	});
});

describe("tableMinWidth", () => {
	it("is undefined when no column of the consumer's carries a width", () => {
		expect(
			tableMinWidth(
				[
					{ id: "_reorder", size: REORDER_COLUMN_WIDTH },
					{ id: "a" },
					{ id: "b" },
				],
				BUILT_IN,
			),
		).toBeUndefined();
	});

	it("sums the built-in widths, each size or minSize, and every consumer column's padding", () => {
		expect(
			tableMinWidth(
				[
					{ id: "_reorder", size: REORDER_COLUMN_WIDTH },
					{ id: "_select", size: 40 },
					{ id: "a", size: 200 },
					{ id: "b" },
					{ id: "_actions", minSize: 140 },
				],
				BUILT_IN,
			),
		).toBe("calc(432px + 6 * {spacing.3})");
	});
});
