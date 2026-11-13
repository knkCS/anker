// parseUnifiedDiff — unified diff text (`git diff`, `diff -u`) to plain data.
//
// A small line-by-line state machine. Inside a hunk, lines are read by the
// counts in its `@@` header, so a removed line that reads `--- foo` or an
// added `+++ bar` stays content instead of starting a new file. Outside a
// hunk, `diff --git`, a `---` / `+++` pair or a bare `@@` starts a file;
// anything else before the first file (a commit message, a diffstat) is
// ignored. Pure: no React, no DOM.
import type { DiffChangeType, DiffFile, DiffHunk, DiffLine } from "./types";

const HUNK_HEADER = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@ ?(.*)$/;
const DEV_NULL = "/dev/null";

interface Draft {
	oldPath: string | null;
	newPath: string | null;
	gitOld: string | null;
	gitNew: string | null;
	added: boolean;
	deleted: boolean;
	renamed: boolean;
	binary: boolean;
	/** The file's `---` / `+++` pair was read. */
	headerRead: boolean;
	hunks: DiffHunk[];
}

const emptyDraft = (): Draft => ({
	oldPath: null,
	newPath: null,
	gitOld: null,
	gitNew: null,
	added: false,
	deleted: false,
	renamed: false,
	binary: false,
	headerRead: false,
	hunks: [],
});

/** Parse unified diff text into one entry per file. */
export function parseUnifiedDiff(text: string): DiffFile[] {
	const drafts: Draft[] = [];
	let file: Draft | null = null;
	let hunk: DiffHunk | null = null;
	let oldLeft = 0;
	let newLeft = 0;
	let oldNo = 0;
	let newNo = 0;
	// Inside a `GIT binary patch` payload, until the next file.
	let inBinaryPatch = false;

	const startFile = (): Draft => {
		const next = emptyDraft();
		drafts.push(next);
		file = next;
		hunk = null;
		inBinaryPatch = false;
		return next;
	};

	const rows = text.split(/\r?\n/);
	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];

		if (hunk && (oldLeft > 0 || newLeft > 0)) {
			const lines: DiffLine[] = (hunk as DiffHunk).lines;
			const sign = row[0];
			if (sign === "\\") {
				const last = lines[lines.length - 1];
				if (last) last.noNewlineAtEnd = true;
				continue;
			}
			if (sign === "+") {
				lines.push(line("added", row.slice(1), null, newNo++));
				newLeft--;
				continue;
			}
			if (sign === "-") {
				lines.push(line("removed", row.slice(1), oldNo++, null));
				oldLeft--;
				continue;
			}
			if (sign === " " || row === "") {
				lines.push(line("context", row.slice(1), oldNo++, newNo++));
				oldLeft--;
				newLeft--;
				continue;
			}
			// A malformed hunk (counts too high): fall through and read the row
			// as a header.
			hunk = null;
		}

		// A marker after a hunk's last line still belongs to that line.
		if (row.startsWith("\\") && hunk) {
			const lines: DiffLine[] = (hunk as DiffHunk).lines;
			const last = lines[lines.length - 1];
			if (last) last.noNewlineAtEnd = true;
			continue;
		}

		if (row.startsWith("diff --git ")) {
			const current = startFile();
			const paths = splitGitPaths(row.slice("diff --git ".length));
			if (paths) {
				current.gitOld = paths[0];
				current.gitNew = paths[1];
			}
			continue;
		}

		if (inBinaryPatch) continue;

		const header = HUNK_HEADER.exec(row);
		if (header) {
			const current: Draft = file ?? startFile();
			const next: DiffHunk = {
				oldStart: Number(header[1]),
				oldLines: header[2] == null ? 1 : Number(header[2]),
				newStart: Number(header[3]),
				newLines: header[4] == null ? 1 : Number(header[4]),
				header: row,
				heading: header[5].trim(),
				lines: [],
			};
			current.hunks.push(next);
			hunk = next;
			oldLeft = next.oldLines;
			newLeft = next.newLines;
			oldNo = next.oldStart;
			newNo = next.newStart;
			continue;
		}

		if (row.startsWith("--- ") && rows[i + 1]?.startsWith("+++ ")) {
			// A `---` line opens a new file unless it belongs to the
			// `diff --git` header just read.
			const open = file as Draft | null;
			const current: Draft =
				open && open.hunks.length === 0 && !open.headerRead
					? open
					: startFile();
			current.headerRead = true;
			const oldPath = stripPrefix(readPath(row.slice(4)), "a/");
			const newPath = stripPrefix(readPath(rows[i + 1].slice(4)), "b/");
			if (oldPath === DEV_NULL) current.added = true;
			else current.oldPath = oldPath;
			if (newPath === DEV_NULL) current.deleted = true;
			else current.newPath = newPath;
			i++;
			continue;
		}

		if (!file) continue;
		const current = file as Draft;

		if (row.startsWith("new file mode")) current.added = true;
		else if (row.startsWith("deleted file mode")) current.deleted = true;
		else if (row.startsWith("rename from ")) {
			current.renamed = true;
			current.oldPath = readPath(row.slice("rename from ".length));
		} else if (row.startsWith("rename to ")) {
			current.renamed = true;
			current.newPath = readPath(row.slice("rename to ".length));
		} else if (row.startsWith("Binary files ") && row.endsWith(" differ")) {
			current.binary = true;
			const named = /^Binary files (.+) and (.+) differ$/.exec(row);
			if (named) {
				const oldPath = stripPrefix(readPath(named[1]), "a/");
				const newPath = stripPrefix(readPath(named[2]), "b/");
				if (oldPath === DEV_NULL) current.added = true;
				if (newPath === DEV_NULL) current.deleted = true;
			}
		} else if (row === "GIT binary patch") {
			current.binary = true;
			inBinaryPatch = true;
		}
	}

	return finish(drafts);
}

function line(
	kind: DiffLine["kind"],
	content: string,
	oldNumber: number | null,
	newNumber: number | null,
): DiffLine {
	return { kind, content, oldNumber, newNumber, noNewlineAtEnd: false };
}

function finish(drafts: Draft[]): DiffFile[] {
	const seen = new Map<string, number>();
	return drafts.map((draft) => {
		const oldPath = draft.added ? null : (draft.oldPath ?? draft.gitOld);
		const newPath = draft.deleted ? null : (draft.newPath ?? draft.gitNew);
		const path = newPath ?? oldPath ?? "";
		const changeType: DiffChangeType = draft.added
			? "added"
			: draft.deleted
				? "deleted"
				: draft.renamed ||
						(oldPath != null && newPath != null && oldPath !== newPath)
					? "renamed"
					: "modified";
		let additions = 0;
		let deletions = 0;
		for (const hunk of draft.hunks) {
			for (const l of hunk.lines) {
				if (l.kind === "added") additions++;
				else if (l.kind === "removed") deletions++;
			}
		}
		const count = (seen.get(path) ?? 0) + 1;
		seen.set(path, count);
		return {
			key: count === 1 ? path : `${path}#${count}`,
			oldPath,
			newPath,
			path,
			changeType,
			binary: draft.binary,
			additions,
			deletions,
			hunks: draft.hunks,
		};
	});
}

/** A path as written in a header: quoted (C-style escapes) or bare, minus a tab-separated timestamp. */
function readPath(raw: string): string {
	const text = raw.trim();
	if (text.startsWith('"')) {
		const end = closingQuote(text, 0);
		return unquote(text.slice(0, end + 1));
	}
	const tab = text.indexOf("\t");
	return tab === -1 ? text : text.slice(0, tab);
}

function stripPrefix(path: string, prefix: string): string {
	return path.startsWith(prefix) ? path.slice(prefix.length) : path;
}

/**
 * The two paths of a `diff --git a/X b/Y` line. Paths with spaces are
 * ambiguous there; when the two halves name the same file (the usual case)
 * the split is exact, otherwise the first ` b/` wins. `rename from` / `---`
 * lines, read later, override these.
 */
function splitGitPaths(rest: string): [string, string] | null {
	if (rest.startsWith('"')) {
		const end = closingQuote(rest, 0);
		const first = unquote(rest.slice(0, end + 1));
		const second = readPath(rest.slice(end + 1));
		return [stripPrefix(first, "a/"), stripPrefix(second, "b/")];
	}
	const half = (rest.length - 1) / 2;
	if (Number.isInteger(half) && rest[half] === " ") {
		const a = rest.slice(0, half);
		const b = rest.slice(half + 1);
		if (a.startsWith("a/") && b.startsWith("b/") && a.slice(2) === b.slice(2)) {
			return [a.slice(2), b.slice(2)];
		}
	}
	const split = rest.indexOf(" b/");
	if (!rest.startsWith("a/") || split === -1) return null;
	return [rest.slice(2, split), readPath(rest.slice(split + 3))];
}

function closingQuote(text: string, open: number): number {
	for (let i = open + 1; i < text.length; i++) {
		if (text[i] === "\\") i++;
		else if (text[i] === '"') return i;
	}
	return text.length - 1;
}

const ESCAPES: Record<string, string> = {
	n: "\n",
	t: "\t",
	'"': '"',
	"\\": "\\",
};

/** Git's C-style quoting: `"a/with \"quote\".txt"` → `a/with "quote".txt`. */
function unquote(quoted: string): string {
	const body = quoted.slice(1, -1);
	const bytes: number[] = [];
	const encoder = new TextEncoder();
	for (let i = 0; i < body.length; i++) {
		const c = body[i];
		if (c !== "\\") {
			// A whole code point, so a surrogate pair encodes as one character.
			const point = String.fromCodePoint(body.codePointAt(i) ?? 0);
			bytes.push(...encoder.encode(point));
			i += point.length - 1;
			continue;
		}
		const next = body[i + 1];
		const octal = /^[0-7]{3}/.exec(body.slice(i + 1));
		if (octal) {
			bytes.push(Number.parseInt(octal[0], 8));
			i += 3;
		} else {
			bytes.push(...encoder.encode(ESCAPES[next] ?? next));
			i++;
		}
	}
	return new TextDecoder().decode(new Uint8Array(bytes));
}
