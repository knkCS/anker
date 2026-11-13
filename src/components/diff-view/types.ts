/**
 * The parsed shape of a unified diff — what `parseUnifiedDiff` returns and
 * what `DiffView` renders. Plain data, so a consumer can parse once, filter
 * or annotate files, and hand the result to `DiffView` as `files`.
 */

import type { ReactNode } from "react";
import type { StatusBadgeTone } from "../../atoms/status-badge";

/** How a file changed. A binary file carries its own `binary` flag. */
export type DiffChangeType = "added" | "modified" | "deleted" | "renamed";

/** One line of a hunk. */
export interface DiffLine {
	kind: "context" | "added" | "removed";
	/** The line's text, without the leading `+`, `-` or space. */
	content: string;
	/** The line number in the old file; `null` for an added line. */
	oldNumber: number | null;
	/** The line number in the new file; `null` for a removed line. */
	newNumber: number | null;
	/** A `\ No newline at end of file` marker followed this line. */
	noNewlineAtEnd: boolean;
}

/** One `@@ … @@` hunk. */
export interface DiffHunk {
	oldStart: number;
	oldLines: number;
	newStart: number;
	newLines: number;
	/** The full header line, e.g. `@@ -10,4 +10,5 @@ function main() {`. */
	header: string;
	/** The text after the second `@@` (often the enclosing function); may be empty. */
	heading: string;
	lines: DiffLine[];
}

/** One file of a diff. */
export interface DiffFile {
	/**
	 * A key unique within the parsed diff: the file's path, suffixed `#2`,
	 * `#3`… when a path appears more than once. Stable for the same text.
	 */
	key: string;
	/** The path before the change; `null` for an added file (or unknown). */
	oldPath: string | null;
	/** The path after the change; `null` for a deleted file (or unknown). */
	newPath: string | null;
	/** The path to show: `newPath`, else `oldPath`, else `""`. */
	path: string;
	changeType: DiffChangeType;
	/** Git reported the file as binary: no hunks to show. */
	binary: boolean;
	/** Number of added lines. */
	additions: number;
	/** Number of removed lines. */
	deletions: number;
	hunks: DiffHunk[];
}

/** The side of a diff a comment's line number counts on. */
export type DiffSide = "new" | "old";

/** What a comment means: one of anker's status tones. */
export type DiffCommentTone = StatusBadgeTone;

/**
 * A comment anchored to a file and, optionally, a line of it — a review
 * finding, a note. `DiffView` renders it under that line, or at the file's
 * top when the line is not in the diff's hunks.
 */
export interface DiffComment {
	/** Unique among the comments passed to one `DiffView`. */
	id: string;
	/**
	 * The file: a `DiffFile`'s `key`, or its new or old path. A comment on a
	 * path the diff does not contain shows after the files.
	 */
	path: string;
	/**
	 * The line number on `side`; without one (`undefined` or `null`), the
	 * comment is on the file.
	 */
	line?: number | null;
	/** The side `line` counts on: the new file or the old one. @default "new" */
	side?: DiffSide;
	/** The author's display name. */
	author?: string;
	/** Avatar slot, e.g. `<Persona hideDetails />`. anker never fetches. */
	avatar?: ReactNode;
	/** The time, formatted by the consumer (or a `<DateTime />`). */
	timestamp?: ReactNode;
	/** What the comment means; paints its edge and its `label`. @default "neutral" */
	tone?: DiffCommentTone;
	/**
	 * A badge in the comment's tone ("Blocking", "Suggestion"). Give one
	 * whenever the tone carries meaning, so it never rests on hue alone.
	 */
	label?: string;
	/** The comment's content. */
	body?: ReactNode;
}
