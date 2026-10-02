/** A run of icons in the grid, optionally under a heading. */
export interface GridSection {
	key: string;
	title?: string;
	names: readonly string[];
}

export interface GridCell {
	/** The icon's lucide name. An icon may sit in two sections. */
	name: string;
	/** Unique across the grid — the option's id and React key. */
	key: string;
	/** Position in reading order across every section; the active index. */
	index: number;
	/** The virtual row the cell sits in. */
	row: number;
	/** Its column within that row. */
	col: number;
}

export type GridRow =
	| { kind: "header"; key: string; title: string }
	| { kind: "icons"; key: string; cells: GridCell[] };

export interface GridLayout {
	rows: GridRow[];
	/** Every cell in reading order — `cells[i].index === i`. */
	cells: GridCell[];
}

/**
 * Lays sections out as the virtual list's rows: a header row per titled,
 * non-empty section, then its icons in rows of `columns`. Each cell knows
 * its row, so keyboard movement and scroll-into-view need no DOM.
 */
export function buildGridLayout(
	sections: readonly GridSection[],
	columns: number,
): GridLayout {
	const rows: GridRow[] = [];
	const cells: GridCell[] = [];
	for (const section of sections) {
		if (section.names.length === 0) continue;
		if (section.title) {
			rows.push({
				kind: "header",
				key: `${section.key}:header`,
				title: section.title,
			});
		}
		for (let start = 0; start < section.names.length; start += columns) {
			const row = rows.length;
			const rowCells = section.names
				.slice(start, start + columns)
				.map((name, col) => {
					const cell: GridCell = {
						name,
						key: `${section.key}:${name}`,
						index: cells.length + col,
						row,
						col,
					};
					return cell;
				});
			cells.push(...rowCells);
			rows.push({
				kind: "icons",
				key: `${section.key}:${start}`,
				cells: rowCells,
			});
		}
	}
	return { rows, cells };
}

function iconRowFrom(
	layout: GridLayout,
	from: number,
	step: 1 | -1,
): GridCell[] | null {
	for (let r = from + step; r >= 0 && r < layout.rows.length; r += step) {
		const row = layout.rows[r];
		if (row.kind === "icons") return row.cells;
	}
	return null;
}

/**
 * The active index after a navigation key, or null when the key is not one
 * the grid handles (so the caller lets it through). Left/Right walk the
 * reading order; Up/Down keep the column, clamped to a shorter row, and skip
 * headers; Home/End jump to the ends. With nothing active (-1), any move
 * lands on the first cell; an empty grid stays at -1.
 */
export function moveActive(
	layout: GridLayout,
	active: number,
	key: string,
): number | null {
	const last = layout.cells.length - 1;
	const handled = [
		"ArrowLeft",
		"ArrowRight",
		"ArrowUp",
		"ArrowDown",
		"Home",
		"End",
	];
	if (!handled.includes(key)) return null;
	if (last < 0) return -1;
	const current = layout.cells[active];
	if (!current) return 0;

	switch (key) {
		case "ArrowLeft":
			return Math.max(0, active - 1);
		case "ArrowRight":
			return Math.min(last, active + 1);
		case "Home":
			return 0;
		case "End":
			return last;
		default: {
			const target = iconRowFrom(
				layout,
				current.row,
				key === "ArrowDown" ? 1 : -1,
			);
			if (!target) return active;
			return target[Math.min(current.col, target.length - 1)].index;
		}
	}
}
