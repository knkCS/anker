import { describe, expect, it } from "vitest";
import { buildGridLayout, moveActive } from "./grid-layout";

const names = (n: number, prefix = "i") =>
	Array.from({ length: n }, (_, i) => `${prefix}${i}`);

describe("buildGridLayout", () => {
	it("chunks one untitled section into rows of `columns` cells", () => {
		const layout = buildGridLayout([{ key: "all", names: names(7) }], 3);
		expect(layout.rows.map((r) => r.kind)).toEqual(["icons", "icons", "icons"]);
		expect(
			layout.rows.map((r) =>
				r.kind === "icons" ? r.cells.map((c) => c.index) : null,
			),
		).toEqual([[0, 1, 2], [3, 4, 5], [6]]);
		expect(layout.cells.map((c) => c.name)).toEqual(names(7));
	});

	it("gives a titled section a header row and numbers cells across sections", () => {
		const layout = buildGridLayout(
			[
				{ key: "recent", title: "Recently used", names: ["a", "b"] },
				{ key: "all", title: "All icons", names: ["a", "c", "d"] },
			],
			2,
		);
		expect(layout.rows).toMatchObject([
			{ kind: "header", title: "Recently used" },
			{
				kind: "icons",
				cells: [
					{ name: "a", index: 0 },
					{ name: "b", index: 1 },
				],
			},
			{ kind: "header", title: "All icons" },
			{
				kind: "icons",
				cells: [
					{ name: "a", index: 2 },
					{ name: "c", index: 3 },
				],
			},
			{ kind: "icons", cells: [{ name: "d", index: 4 }] },
		]);
		// An icon may appear twice (recent + all); cell keys stay unique.
		const keys = layout.cells.map((c) => c.key);
		expect(new Set(keys).size).toBe(keys.length);
	});

	it("drops an empty section, header and all", () => {
		const layout = buildGridLayout(
			[
				{ key: "recent", title: "Recently used", names: [] },
				{ key: "all", names: ["a"] },
			],
			4,
		);
		expect(layout.rows).toHaveLength(1);
	});

	it("records each cell's row index for scroll-into-view", () => {
		const layout = buildGridLayout(
			[
				{ key: "recent", title: "R", names: ["a"] },
				{ key: "all", title: "A", names: ["b", "c"] },
			],
			1,
		);
		expect(layout.cells.map((c) => c.row)).toEqual([1, 3, 4]);
	});
});

describe("moveActive", () => {
	// Two sections over a 3-wide grid:
	//   header
	//   0 1
	//   header
	//   2 3 4
	//   5 6 7
	//   8
	const layout = buildGridLayout(
		[
			{ key: "recent", title: "R", names: names(2, "r") },
			{ key: "all", title: "A", names: names(7) },
		],
		3,
	);

	it("moves along the reading order with Left/Right, clamped at the ends", () => {
		expect(moveActive(layout, 1, "ArrowRight")).toBe(2);
		expect(moveActive(layout, 2, "ArrowLeft")).toBe(1);
		expect(moveActive(layout, 0, "ArrowLeft")).toBe(0);
		expect(moveActive(layout, 8, "ArrowRight")).toBe(8);
	});

	it("moves to the same column of the next icon row with Down, skipping headers", () => {
		expect(moveActive(layout, 0, "ArrowDown")).toBe(2);
		expect(moveActive(layout, 1, "ArrowDown")).toBe(3);
		expect(moveActive(layout, 4, "ArrowDown")).toBe(7);
	});

	it("clamps to the last cell of a shorter row", () => {
		expect(moveActive(layout, 7, "ArrowDown")).toBe(8);
		expect(moveActive(layout, 4, "ArrowUp")).toBe(1);
	});

	it("stays put at the first and last rows", () => {
		expect(moveActive(layout, 1, "ArrowUp")).toBe(1);
		expect(moveActive(layout, 8, "ArrowDown")).toBe(8);
	});

	it("jumps to the first and last cell with Home/End", () => {
		expect(moveActive(layout, 5, "Home")).toBe(0);
		expect(moveActive(layout, 5, "End")).toBe(8);
	});

	it("starts from the first cell when nothing is active", () => {
		expect(moveActive(layout, -1, "ArrowDown")).toBe(0);
		expect(moveActive(layout, -1, "ArrowRight")).toBe(0);
	});

	it("returns -1 for an empty grid", () => {
		expect(moveActive(buildGridLayout([], 3), -1, "ArrowDown")).toBe(-1);
	});

	it("returns null for a key it does not handle", () => {
		expect(moveActive(layout, 3, "a")).toBeNull();
	});
});
