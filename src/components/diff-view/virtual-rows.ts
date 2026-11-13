// The arithmetic behind a virtualised file body (#332): when a file is large
// enough to virtualise, what each row is estimated to measure before it is
// drawn, how wide the line numbers and the code must be so columns do not
// jump as rows come and go, and where the spacers go between the drawn
// rows. Pure: no React, no DOM.
import type { DiffRow } from "./diff-rows";
import type { DiffFile } from "./types";

/** Rows a file shows with nothing folded: its hunk headers and lines. */
export function fileRowCount(file: DiffFile): number {
	let count = 0;
	for (const hunk of file.hunks) count += 1 + hunk.lines.length;
	return count;
}

/**
 * Whether a file renders in a virtualised pane. Decided on the file alone —
 * not on folds or comments — so expanding a fold never swaps the body out
 * from under the reader.
 */
export function shouldVirtualize(file: DiffFile, threshold: number): boolean {
	return !file.binary && fileRowCount(file) > threshold;
}

/** Pixels per code line: the `sm` (default) or `xs` (compact) size at 1.5. */
const LINE_PX = { default: 21, compact: 18 } as const;

/**
 * A row's height before it is measured. Close enough that the scrollbar is
 * right from the start; every drawn row is measured and corrects it.
 */
export function estimateRowSize(
	row: DiffRow | undefined,
	variant: keyof typeof LINE_PX,
): number {
	const line = LINE_PX[variant];
	switch (row?.type) {
		case "hunk":
			return line + 4;
		case "fold":
			return 44;
		case "comments":
			return 24 + row.comments.length * 72;
		default:
			return line;
	}
}

/** Digits of the file's largest line number, on either side. */
export function lineNumberDigits(file: DiffFile): number {
	let max = 0;
	for (const hunk of file.hunks) {
		for (const line of hunk.lines) {
			max = Math.max(max, line.oldNumber ?? 0, line.newNumber ?? 0);
		}
	}
	return String(Math.max(1, max)).length;
}

/** The widest line of the file in monospace columns, a tab `tabSize` wide. */
export function widestLine(file: DiffFile, tabSize: number): number {
	let widest = 0;
	for (const hunk of file.hunks) {
		widest = Math.max(widest, hunk.header.length);
		for (const line of hunk.lines) {
			let width = 0;
			for (const char of line.content) {
				width = char === "\t" ? width + tabSize - (width % tabSize) : width + 1;
			}
			widest = Math.max(widest, width);
		}
	}
	return widest;
}

/** A drawn row's place, as the virtualiser reports it. */
export interface PlacedRow {
	index: number;
	start: number;
	end: number;
}

export type WindowEntry =
	| { type: "row"; index: number }
	| { type: "gap"; key: string; size: number };

/**
 * The drawn rows in order with a spacer wherever the rows skip ahead — at
 * the top, between a kept row (the focused one) and the window, and at the
 * bottom — so the table is as tall as all its rows.
 */
export function windowWithGaps(
	placed: readonly PlacedRow[],
	totalSize: number,
): WindowEntry[] {
	const entries: WindowEntry[] = [];
	let end = 0;
	for (const row of [...placed].sort((a, b) => a.index - b.index)) {
		if (row.start > end) {
			entries.push({
				type: "gap",
				key: `gap${row.index}`,
				size: row.start - end,
			});
		}
		entries.push({ type: "row", index: row.index });
		end = Math.max(end, row.end);
	}
	if (totalSize > end) {
		entries.push({ type: "gap", key: "gap-end", size: totalSize - end });
	}
	return entries;
}

/**
 * The rows to draw: the virtualiser's window plus rows kept outside it — the
 * row holding focus, a row about to receive it — each with the line before
 * a comment row, so a comment never shows without its line.
 */
export function withKeptRows(
	window: readonly number[],
	kept: readonly (number | undefined)[],
	rows: readonly DiffRow[],
): number[] {
	const extra: number[] = [];
	for (const index of kept) {
		if (index == null || index < 0 || index >= rows.length) continue;
		extra.push(index);
		if (rows[index].type === "comments" && index > 0) extra.push(index - 1);
	}
	if (extra.length === 0) return [...window];
	return [...new Set([...window, ...extra])].sort((a, b) => a - b);
}
