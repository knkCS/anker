// buildDiffRows — one file's hunks as a flat list of rows: a hunk header, a
// line, or a fold standing in for a run of unchanged lines.
//
// A flat list is the seam the DiffView tickets plug into: line-anchored
// comments (#331) are one more row kind, right after the line they belong
// to, and virtualisation (#332) renders a window of the same list — comment
// rows included, so a virtualised list keeps them. Pure: no React.
import type { DiffComment, DiffFile, DiffHunk, DiffLine } from "./types";

export type DiffRow =
	| { type: "hunk"; key: string; hunk: DiffHunk }
	| { type: "line"; key: string; line: DiffLine }
	| {
			type: "fold";
			key: string;
			/** The unchanged lines the fold hides, in order. */
			lines: DiffLine[];
			/** The keys those lines' rows get once expanded. */
			lineKeys: string[];
	  }
	| {
			type: "comments";
			key: string;
			/** The line the comments are anchored to: the row before this one. */
			line: DiffLine;
			comments: readonly DiffComment[];
	  };

export interface BuildDiffRowsOptions {
	/**
	 * Unchanged lines kept next to each change; a longer run of unchanged
	 * lines is folded. `Infinity` folds nothing. @default 3
	 */
	contextLines?: number;
	/** Row keys of the folded lines the reader expanded (a fold's `lineKeys`). */
	expanded?: ReadonlySet<string>;
	/**
	 * Comments by the line they are anchored to (`anchorComments`). Each
	 * gets a row after its line, and a commented line is never folded: it
	 * keeps `contextLines` unchanged lines around it, like a change.
	 */
	comments?: ReadonlyMap<DiffLine, readonly DiffComment[]>;
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
	const { contextLines = 3, expanded, comments } = options;
	const keep = Math.max(0, contextLines);
	const rows: DiffRow[] = [];
	// A changed or commented line stays visible; runs of the others fold.
	const pinned = (line: DiffLine) =>
		line.kind !== "context" || (comments?.has(line) ?? false);
	const pushLine = (key: string, line: DiffLine) => {
		rows.push({ type: "line", key, line });
		const anchored = comments?.get(line);
		if (anchored?.length) {
			rows.push({
				type: "comments",
				key: `${key}:c`,
				line,
				comments: anchored,
			});
		}
	};

	file.hunks.forEach((hunk, h) => {
		rows.push({ type: "hunk", key: `h${h}`, hunk });
		const { lines } = hunk;
		let i = 0;
		while (i < lines.length) {
			if (pinned(lines[i])) {
				pushLine(`h${h}:${i}`, lines[i]);
				i++;
				continue;
			}
			let end = i;
			while (end < lines.length && !pinned(lines[end])) end++;
			const leading = i === 0;
			const trailing = end === lines.length;
			// Keep `keep` lines on each side that touches a change.
			const hideFrom = leading ? i : i + keep;
			const hideTo = trailing && !leading ? end : end - keep;
			const foldable = Number.isFinite(hideTo - hideFrom);
			// Lines the reader expanded stay shown; every stretch of the
			// others long enough folds. Keyed by line, an expansion survives
			// a comment that later splits the run.
			const hidden = (j: number) =>
				foldable && j >= hideFrom && j < hideTo && !expanded?.has(`h${h}:${j}`);
			let j = i;
			while (j < end) {
				let stop = j;
				while (stop < end && hidden(stop)) stop++;
				if (stop - j >= MIN_FOLD) {
					const lineKeys: string[] = [];
					for (let k = j; k < stop; k++) lineKeys.push(`h${h}:${k}`);
					rows.push({
						type: "fold",
						key: `h${h}:fold${j}`,
						lines: lines.slice(j, stop),
						lineKeys,
					});
					j = stop;
					continue;
				}
				pushLine(`h${h}:${j}`, lines[j]);
				j++;
			}
			i = end;
		}
	});

	return rows;
}
