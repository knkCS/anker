// buildDiffRows — one file's hunks as a flat list of rows: a hunk header, a
// line, or a fold standing in for a run of unchanged lines.
//
// A flat list is the seam the later DiffView tickets plug into: line-anchored
// comments (#331) become one more row kind after the line they belong to, and
// virtualisation (#332) renders a window of the same list. Pure: no React.
import type { DiffFile, DiffHunk, DiffLine } from "./types";

export type DiffRow =
	| { type: "hunk"; key: string; hunk: DiffHunk }
	| { type: "line"; key: string; line: DiffLine }
	| {
			type: "fold";
			key: string;
			/** The unchanged lines the fold hides, in order. */
			lines: DiffLine[];
	  };

export interface BuildDiffRowsOptions {
	/**
	 * Unchanged lines kept next to each change; a longer run of unchanged
	 * lines is folded. `Infinity` folds nothing. @default 3
	 */
	contextLines?: number;
	/** Keys of the folds the reader expanded. */
	expanded?: ReadonlySet<string>;
}

/**
 * A fold must hide at least this many lines: a fold row that hides one line
 * takes the same space as the line and only adds a click.
 */
const MIN_FOLD = 2;

export function buildDiffRows(
	file: DiffFile,
	options: BuildDiffRowsOptions = {},
): DiffRow[] {
	const { contextLines = 3, expanded } = options;
	const keep = Math.max(0, contextLines);
	const rows: DiffRow[] = [];

	file.hunks.forEach((hunk, h) => {
		rows.push({ type: "hunk", key: `h${h}`, hunk });
		const { lines } = hunk;
		let i = 0;
		while (i < lines.length) {
			if (lines[i].kind !== "context") {
				rows.push({ type: "line", key: `h${h}:${i}`, line: lines[i] });
				i++;
				continue;
			}
			let end = i;
			while (end < lines.length && lines[end].kind === "context") end++;
			const leading = i === 0;
			const trailing = end === lines.length;
			// Keep `keep` lines on each side that touches a change.
			const hideFrom = leading ? i : i + keep;
			const hideTo = trailing && !leading ? end : end - keep;
			const hidden = hideTo - hideFrom;
			const foldKey = `h${h}:fold${hideFrom}`;
			const fold =
				hidden >= MIN_FOLD &&
				Number.isFinite(hidden) &&
				!expanded?.has(foldKey);
			for (let j = i; j < end; j++) {
				if (fold && j === hideFrom) {
					rows.push({
						type: "fold",
						key: foldKey,
						lines: lines.slice(hideFrom, hideTo),
					});
					j = hideTo - 1;
					continue;
				}
				rows.push({ type: "line", key: `h${h}:${j}`, line: lines[j] });
			}
			i = end;
		}
	});

	return rows;
}
