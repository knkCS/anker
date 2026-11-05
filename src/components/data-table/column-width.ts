// How wide DataTable's columns are, and so how narrow the table may get (#271).
//
// The table is `table-layout: fixed` at `width: 100%`: the header row decides
// every column's width, and the cells below are exactly that wide whatever
// they hold. Without widths the container's width is shared out equally — a
// wide table is squeezed into its card and fixed-width content spills into the
// next column. So a column may carry a width, and the table is never narrower
// than the sum of its columns; in a narrower container it scrolls sideways
// inside DataTable's `overflowX` box rather than compressing.
//
// Pure on purpose: the arithmetic is answered and tested here, the layout it
// produces is measured in a real browser (`data-table-layout.browser.test.tsx`).

import { TABLE_CELL_PADDING_X } from "../../theme/recipes/table";

/** The parts of a TanStack column definition a width is read from. */
export interface ColumnWidthSource {
	id: string;
	/** The width of the column's CONTENT in px; the column adds the cell's padding. */
	size?: number;
	/** A column without `size`: at least this much content width, and the table's remainder. */
	minSize?: number;
}

/** A spacing token reference to the cell padding, resolved by Chakra in a style value. */
const PADDING = `{spacing.${TABLE_CELL_PADDING_X}}`;

/** `px` content width plus `paddedColumns` columns' padding on both sides. */
function widthOf(px: number, paddedColumns: number): string {
	return paddedColumns === 0
		? `${px}px`
		: `calc(${px}px + ${2 * paddedColumns} * ${PADDING})`;
}

/**
 * The CSS width a column's header and cells get, or `undefined` for one that
 * flexes.
 *
 * `builtIn` maps DataTable's own columns (drag handle, selection checkbox) to
 * their WHOLE width, padding included — one constant each, so the drag-handle
 * column's width is corrected in one place. A consumer column's `size` is its
 * content's width, and the cell's padding is added here, so a consumer never
 * needs to know it. A column with only `minSize` gets no width: it takes what
 * the table has over, all of it, so a table wider than its columns gives the
 * room to that column rather than spreading it across the sized ones.
 */
export function columnWidth(
	column: ColumnWidthSource,
	builtIn: ReadonlyMap<string, number>,
): string | undefined {
	const fixed = builtIn.get(column.id);
	if (fixed !== undefined) return `${fixed}px`;
	if (column.size !== undefined) return widthOf(column.size, 1);
	return undefined;
}

/**
 * The table's minimum width: every column's width summed — the built-in
 * columns', each consumer column's `size` (or `minSize`) and every consumer
 * column's padding — or `undefined` when no consumer column carries a width,
 * which leaves the table exactly as it lays out without one.
 */
export function tableMinWidth(
	columns: readonly ColumnWidthSource[],
	builtIn: ReadonlyMap<string, number>,
): string | undefined {
	const own = columns.filter((c) => !builtIn.has(c.id));
	if (!own.some((c) => c.size !== undefined || c.minSize !== undefined)) {
		return undefined;
	}
	const builtInPx = columns.reduce(
		(sum, c) => sum + (builtIn.get(c.id) ?? 0),
		0,
	);
	const contentPx = own.reduce((sum, c) => sum + (c.size ?? c.minSize ?? 0), 0);
	return widthOf(builtInPx + contentPx, own.length);
}
