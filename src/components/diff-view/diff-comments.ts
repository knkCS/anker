// Where each comment of a DiffView goes (#331): to a file, then to a line of
// it, else to the file level. Pure: no React. Nothing is dropped — a comment
// whose file is not in the diff comes back as an orphan, one whose line is
// not in the hunks (lines between hunks are not in the diff text) as a
// file-level comment.
import type { DiffComment, DiffFile, DiffLine } from "./types";

export interface CommentsByFile {
	/** Each file's comments, in the order given. */
	byFile: Map<DiffFile, DiffComment[]>;
	/** Comments on paths the diff does not contain, in the order given. */
	orphans: DiffComment[];
}

/**
 * Hands each comment to one file: the file whose `key` is the comment's
 * `path`, else the first file whose new (or old) path is.
 */
export function groupCommentsByFile(
	files: readonly DiffFile[],
	comments: readonly DiffComment[],
): CommentsByFile {
	const byFile = new Map<DiffFile, DiffComment[]>();
	const orphans: DiffComment[] = [];
	for (const comment of comments) {
		const file =
			files.find((f) => f.key === comment.path) ??
			files.find(
				(f) => f.newPath === comment.path || f.oldPath === comment.path,
			);
		if (!file) {
			orphans.push(comment);
			continue;
		}
		const list = byFile.get(file);
		if (list) list.push(comment);
		else byFile.set(file, [comment]);
	}
	return { byFile, orphans };
}

export interface AnchoredComments {
	/** Comments under a line of the hunks, keyed by that line. */
	byLine: Map<DiffLine, DiffComment[]>;
	/** Comments without a line, or on a line outside the hunks. */
	fileLevel: DiffComment[];
}

/**
 * Anchors one file's comments to its lines: `side: "new"` (the default)
 * matches a line's new number — a context or an added line — and
 * `side: "old"` its old number — a context or a removed line.
 */
export function anchorComments(
	file: DiffFile,
	comments: readonly DiffComment[],
): AnchoredComments {
	const byLine = new Map<DiffLine, DiffComment[]>();
	const fileLevel: DiffComment[] = [];
	for (const comment of comments) {
		const line =
			comment.line === undefined ? undefined : findLine(file, comment);
		if (!line) {
			fileLevel.push(comment);
			continue;
		}
		const list = byLine.get(line);
		if (list) list.push(comment);
		else byLine.set(line, [comment]);
	}
	return { byLine, fileLevel };
}

function findLine(file: DiffFile, comment: DiffComment): DiffLine | undefined {
	const old = comment.side === "old";
	for (const hunk of file.hunks) {
		for (const line of hunk.lines) {
			if ((old ? line.oldNumber : line.newNumber) === comment.line) {
				return line;
			}
		}
	}
	return undefined;
}
