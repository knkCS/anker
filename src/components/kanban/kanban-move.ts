// Where a dragged Kanban card goes (#327). Pure: the board's arrangement is
// the item keys of each column, in order; a move takes a card out of its
// column and puts it at an index of the target column, where that index
// counts the target column without the card — so it is the index the card
// has once moved, the one `onMove` reports. Loaded only with drag and drop.
import type { KanbanDirection, KanbanPosition } from "./kanban-navigation";

export type Arrangement = readonly (readonly string[])[];

/** Where `key` sits, or `null` when it is not on the board. */
export function locate(
	arrangement: Arrangement,
	key: string,
): KanbanPosition | null {
	for (let column = 0; column < arrangement.length; column++) {
		const index = arrangement[column].indexOf(key);
		if (index >= 0) return { column, index };
	}
	return null;
}

/** The arrangement with `key` moved to `to` (the index clamped to the column). */
export function moveCard(
	arrangement: Arrangement,
	key: string,
	to: KanbanPosition,
): Arrangement {
	const from = locate(arrangement, key);
	if (!from || !arrangement[to.column]) return arrangement;
	const next = arrangement.map((column) => [...column]);
	next[from.column].splice(from.index, 1);
	const target = next[to.column];
	target.splice(Math.max(0, Math.min(to.index, target.length)), 0, key);
	return next;
}

/**
 * Where a picked-up card goes for `key`, or `null` when the key does not move
 * it. Like the arrow keys' focus movement, except that a card may move into
 * an empty column, and below a shorter column's last card.
 */
export function keyboardMoveTarget(
	arrangement: Arrangement,
	cardKey: string,
	key: string,
	direction: KanbanDirection = "ltr",
): KanbanPosition | null {
	const from = locate(arrangement, cardKey);
	if (!from) return null;
	const last = arrangement[from.column].length - 1;
	switch (key) {
		case "ArrowDown":
			return { column: from.column, index: Math.min(from.index + 1, last) };
		case "ArrowUp":
			return { column: from.column, index: Math.max(from.index - 1, 0) };
		case "Home":
			return { column: from.column, index: 0 };
		case "End":
			return { column: from.column, index: last };
		case "ArrowRight":
		case "ArrowLeft": {
			const forward = (key === "ArrowRight") === (direction === "ltr");
			const column = from.column + (forward ? 1 : -1);
			if (column < 0 || column >= arrangement.length) return from;
			return {
				column,
				index: Math.min(from.index, arrangement[column].length),
			};
		}
		default:
			return null;
	}
}

/** What the pointer is over while a card is dragged. */
export type PointerOver =
	| { kind: "card"; key: string; after: boolean }
	| { kind: "column"; column: number };

/**
 * Where a dragged card goes for what the pointer is over:
 * - a card in the same column — that card's place (the two swap order);
 * - a card in another column — before it, or after it once the pointer is
 *   past its middle;
 * - a column (its header, an empty column, below its last card) — the end
 *   of that column, or nowhere new when the card is already in it.
 */
export function pointerTarget(
	arrangement: Arrangement,
	activeKey: string,
	over: PointerOver,
): KanbanPosition | null {
	const from = locate(arrangement, activeKey);
	if (!from) return null;
	if (over.kind === "column") {
		if (over.column === from.column) return from;
		const column = arrangement[over.column];
		return column ? { column: over.column, index: column.length } : null;
	}
	const at = locate(arrangement, over.key);
	if (!at) return null;
	if (at.column === from.column) return at;
	return { column: at.column, index: at.index + (over.after ? 1 : 0) };
}

/** Where the card was in `committed` and is in `preview`; `null` if unmoved. */
export function resolveMove(
	committed: Arrangement,
	preview: Arrangement,
	key: string,
): { from: KanbanPosition; to: KanbanPosition } | null {
	const from = locate(committed, key);
	const to = locate(preview, key);
	if (!from || !to) return null;
	if (from.column === to.column && from.index === to.index) return null;
	return { from, to };
}

/**
 * The preview of a drag in progress, brought in line with the board when the
 * consumer changed it mid-drag: cards no longer on the board are dropped,
 * cards new to it join their column's end. A board whose columns changed
 * ends the preview.
 */
export function reconcile(
	preview: Arrangement,
	committed: Arrangement,
): Arrangement {
	if (preview.length !== committed.length) return committed;
	const present = new Set(committed.flat());
	const shown = new Set(preview.flat());
	let changed = false;
	const next = preview.map((column, c) => {
		const kept = column.filter((key) => present.has(key));
		const added = committed[c].filter((key) => !shown.has(key));
		if (kept.length !== column.length || added.length > 0) changed = true;
		return [...kept, ...added];
	});
	return changed ? next : preview;
}
