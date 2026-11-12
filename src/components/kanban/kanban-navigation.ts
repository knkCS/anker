// Where the arrow keys take focus on a Kanban board. Pure: the board hands
// in how many cards each column holds and where focus is, and gets back
// where focus goes. The board owns the DOM side (roving tabindex, focusing
// the element); this module owns only the movement rule.

/** A card's place on the board: column index, then card index within it. */
export interface KanbanPosition {
	column: number;
	index: number;
}

export type KanbanDirection = "ltr" | "rtl";

/**
 * The position `key` moves focus to from `from`, or `null` when the key is not
 * a navigation key (the caller then leaves the event alone).
 *
 * - ArrowUp / ArrowDown move within the column and stop at its ends.
 * - Home / End jump to the column's first / last card.
 * - ArrowLeft / ArrowRight move to the nearest column that has cards, keeping
 *   the row when that column is long enough and taking its last card when
 *   not. Flipped in a right-to-left board. At the board's edge focus stays.
 */
export function nextPosition(
	counts: readonly number[],
	from: KanbanPosition,
	key: string,
	direction: KanbanDirection = "ltr",
): KanbanPosition | null {
	const last = Math.max(0, (counts[from.column] ?? 0) - 1);
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
			const step = forward ? 1 : -1;
			for (let c = from.column + step; c >= 0 && c < counts.length; c += step) {
				const count = counts[c] ?? 0;
				if (count > 0) {
					return { column: c, index: Math.min(from.index, count - 1) };
				}
			}
			return from;
		}
		default:
			return null;
	}
}
