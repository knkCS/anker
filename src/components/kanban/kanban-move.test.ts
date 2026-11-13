import { describe, expect, it } from "vitest";
import {
	keyboardMoveTarget,
	locate,
	moveCard,
	pointerTarget,
	reconcile,
	resolveMove,
} from "./kanban-move";

// Three columns: a, b, c in the first; none in the second; d, e in the third.
const BOARD = [["a", "b", "c"], [], ["d", "e"]];

describe("locate", () => {
	it("finds a card's column and index", () => {
		expect(locate(BOARD, "e")).toEqual({ column: 2, index: 1 });
		expect(locate(BOARD, "zz")).toBeNull();
	});
});

describe("moveCard", () => {
	it("moves within a column, the card ending at the target index", () => {
		expect(moveCard(BOARD, "a", { column: 0, index: 2 })[0]).toEqual([
			"b",
			"c",
			"a",
		]);
		expect(moveCard(BOARD, "c", { column: 0, index: 0 })[0]).toEqual([
			"c",
			"a",
			"b",
		]);
	});

	it("moves to another column, inserting at the index", () => {
		const moved = moveCard(BOARD, "b", { column: 2, index: 1 });
		expect(moved).toEqual([["a", "c"], [], ["d", "b", "e"]]);
	});

	it("moves into an empty column and clamps the index to its end", () => {
		expect(moveCard(BOARD, "a", { column: 1, index: 5 })[1]).toEqual(["a"]);
	});

	it("leaves the arrangement alone for an unknown card", () => {
		expect(moveCard(BOARD, "zz", { column: 1, index: 0 })).toBe(BOARD);
	});

	it("never mutates its input", () => {
		const before = JSON.stringify(BOARD);
		moveCard(BOARD, "a", { column: 2, index: 0 });
		expect(JSON.stringify(BOARD)).toBe(before);
	});
});

describe("keyboardMoveTarget", () => {
	it("ArrowDown / ArrowUp move one place and stop at the column's ends", () => {
		expect(keyboardMoveTarget(BOARD, "a", "ArrowDown")).toEqual({
			column: 0,
			index: 1,
		});
		expect(keyboardMoveTarget(BOARD, "c", "ArrowDown")).toEqual({
			column: 0,
			index: 2,
		});
		expect(keyboardMoveTarget(BOARD, "a", "ArrowUp")).toEqual({
			column: 0,
			index: 0,
		});
	});

	it("Home / End move to the column's top and bottom", () => {
		expect(keyboardMoveTarget(BOARD, "b", "Home")).toEqual({
			column: 0,
			index: 0,
		});
		expect(keyboardMoveTarget(BOARD, "b", "End")).toEqual({
			column: 0,
			index: 2,
		});
	});

	it("ArrowRight / ArrowLeft move to the next column, empty ones included", () => {
		expect(keyboardMoveTarget(BOARD, "b", "ArrowRight")).toEqual({
			column: 1,
			index: 0,
		});
		expect(keyboardMoveTarget(BOARD, "d", "ArrowLeft")).toEqual({
			column: 1,
			index: 0,
		});
	});

	it("keeps the row in the next column, or takes its end", () => {
		const board = [["a", "b", "c"], ["x", "y", "z"], ["d"]];
		expect(keyboardMoveTarget(board, "b", "ArrowRight")).toEqual({
			column: 1,
			index: 1,
		});
		// The card goes below the last card, not onto it.
		expect(keyboardMoveTarget(board, "c", "ArrowRight")).toEqual({
			column: 1,
			index: 2,
		});
		expect(keyboardMoveTarget(board, "z", "ArrowRight")).toEqual({
			column: 2,
			index: 1,
		});
	});

	it("stays put at the board's edges", () => {
		expect(keyboardMoveTarget(BOARD, "a", "ArrowLeft")).toEqual({
			column: 0,
			index: 0,
		});
		expect(keyboardMoveTarget(BOARD, "e", "ArrowRight")).toEqual({
			column: 2,
			index: 1,
		});
	});

	it("flips ArrowLeft / ArrowRight in a right-to-left board", () => {
		expect(keyboardMoveTarget(BOARD, "d", "ArrowRight", "rtl")).toEqual({
			column: 1,
			index: 0,
		});
	});

	it("returns null for a key that does not move", () => {
		expect(keyboardMoveTarget(BOARD, "a", "x")).toBeNull();
		expect(keyboardMoveTarget(BOARD, "zz", "ArrowDown")).toBeNull();
	});
});

describe("pointerTarget", () => {
	it("over a card in the same column: takes that card's index", () => {
		expect(
			pointerTarget(BOARD, "a", { kind: "card", key: "c", after: false }),
		).toEqual({ column: 0, index: 2 });
	});

	it("over a card in another column: before it, or after it past its middle", () => {
		expect(
			pointerTarget(BOARD, "a", { kind: "card", key: "e", after: false }),
		).toEqual({ column: 2, index: 1 });
		expect(
			pointerTarget(BOARD, "a", { kind: "card", key: "e", after: true }),
		).toEqual({ column: 2, index: 2 });
	});

	it("over a column: the end of it, or where the card already is", () => {
		expect(pointerTarget(BOARD, "a", { kind: "column", column: 1 })).toEqual({
			column: 1,
			index: 0,
		});
		expect(pointerTarget(BOARD, "a", { kind: "column", column: 2 })).toEqual({
			column: 2,
			index: 2,
		});
		expect(pointerTarget(BOARD, "b", { kind: "column", column: 0 })).toEqual({
			column: 0,
			index: 1,
		});
	});

	it("over the dragged card itself: where it is", () => {
		expect(
			pointerTarget(BOARD, "b", { kind: "card", key: "b", after: true }),
		).toEqual({ column: 0, index: 1 });
	});

	it("returns null for an unknown card", () => {
		expect(
			pointerTarget(BOARD, "a", { kind: "card", key: "zz", after: false }),
		).toBeNull();
	});
});

describe("resolveMove", () => {
	it("reports where the card was and where it ends up", () => {
		const preview = moveCard(BOARD, "b", { column: 2, index: 0 });
		expect(resolveMove(BOARD, preview, "b")).toEqual({
			from: { column: 0, index: 1 },
			to: { column: 2, index: 0 },
		});
	});

	it("is null when the card ends where it started", () => {
		expect(resolveMove(BOARD, BOARD, "b")).toBeNull();
	});
});

describe("reconcile", () => {
	it("keeps the preview while the board is unchanged", () => {
		const preview = moveCard(BOARD, "b", { column: 1, index: 0 });
		expect(reconcile(preview, BOARD)).toEqual(preview);
	});

	it("drops cards that left the board and adds the ones that arrived", () => {
		const preview = moveCard(BOARD, "b", { column: 1, index: 0 });
		const committed = [["a", "b", "new"], [], ["e"]];
		expect(reconcile(preview, committed)).toEqual([["a", "new"], ["b"], ["e"]]);
	});

	it("follows the board when a column was added or removed", () => {
		const committed = [
			["a", "b", "c"],
			["d", "e"],
		];
		expect(reconcile(BOARD, committed)).toBe(committed);
	});
});
