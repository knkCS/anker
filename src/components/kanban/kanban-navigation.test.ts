import { describe, expect, it } from "vitest";
import { nextPosition } from "./kanban-navigation";

// Three columns: 3 cards, none, 2 cards.
const COUNTS = [3, 0, 2];

describe("nextPosition", () => {
	it("ArrowDown moves to the next card in the column and stops at the last", () => {
		expect(nextPosition(COUNTS, { column: 0, index: 0 }, "ArrowDown")).toEqual({
			column: 0,
			index: 1,
		});
		expect(nextPosition(COUNTS, { column: 0, index: 2 }, "ArrowDown")).toEqual({
			column: 0,
			index: 2,
		});
	});

	it("ArrowUp moves to the previous card and stops at the first", () => {
		expect(nextPosition(COUNTS, { column: 0, index: 2 }, "ArrowUp")).toEqual({
			column: 0,
			index: 1,
		});
		expect(nextPosition(COUNTS, { column: 0, index: 0 }, "ArrowUp")).toEqual({
			column: 0,
			index: 0,
		});
	});

	it("Home and End jump to the first and last card of the column", () => {
		expect(nextPosition(COUNTS, { column: 0, index: 1 }, "Home")).toEqual({
			column: 0,
			index: 0,
		});
		expect(nextPosition(COUNTS, { column: 0, index: 0 }, "End")).toEqual({
			column: 0,
			index: 2,
		});
	});

	it("ArrowRight skips empty columns and keeps the row where it can", () => {
		expect(nextPosition(COUNTS, { column: 0, index: 1 }, "ArrowRight")).toEqual(
			{ column: 2, index: 1 },
		);
		// Row 2 does not exist in a two-card column: the last card is taken.
		expect(nextPosition(COUNTS, { column: 0, index: 2 }, "ArrowRight")).toEqual(
			{ column: 2, index: 1 },
		);
	});

	it("ArrowLeft skips empty columns backwards", () => {
		expect(nextPosition(COUNTS, { column: 2, index: 0 }, "ArrowLeft")).toEqual({
			column: 0,
			index: 0,
		});
	});

	it("stays put at the board's edges", () => {
		expect(nextPosition(COUNTS, { column: 2, index: 1 }, "ArrowRight")).toEqual(
			{ column: 2, index: 1 },
		);
		expect(nextPosition(COUNTS, { column: 0, index: 1 }, "ArrowLeft")).toEqual({
			column: 0,
			index: 1,
		});
	});

	it("flips left and right in a right-to-left board", () => {
		expect(
			nextPosition(COUNTS, { column: 0, index: 0 }, "ArrowLeft", "rtl"),
		).toEqual({ column: 2, index: 0 });
		expect(
			nextPosition(COUNTS, { column: 2, index: 0 }, "ArrowRight", "rtl"),
		).toEqual({ column: 0, index: 0 });
	});

	it("returns null for a key it does not handle", () => {
		expect(nextPosition(COUNTS, { column: 0, index: 0 }, "Enter")).toBeNull();
		expect(nextPosition(COUNTS, { column: 0, index: 0 }, "a")).toBeNull();
	});
});
