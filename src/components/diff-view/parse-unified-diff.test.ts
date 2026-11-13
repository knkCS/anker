import { describe, expect, it } from "vitest";
import { parseUnifiedDiff } from "./parse-unified-diff";

const lines = (...rows: string[]) => rows.join("\n");

describe("parseUnifiedDiff", () => {
	it("returns no files for empty or whitespace-only text", () => {
		expect(parseUnifiedDiff("")).toEqual([]);
		expect(parseUnifiedDiff("\n\n  \n")).toEqual([]);
	});

	it("parses a modified file with one hunk, numbering both sides", () => {
		const [file] = parseUnifiedDiff(
			lines(
				"diff --git a/src/app.ts b/src/app.ts",
				"index 3b18e51..a3c5d2f 100644",
				"--- a/src/app.ts",
				"+++ b/src/app.ts",
				"@@ -10,4 +10,5 @@ export function main() {",
				" const a = 1;",
				"-const b = 2;",
				"+const b = 3;",
				"+const c = 4;",
				" return a;",
				" }",
				"",
			),
		);
		expect(file.oldPath).toBe("src/app.ts");
		expect(file.newPath).toBe("src/app.ts");
		expect(file.path).toBe("src/app.ts");
		expect(file.changeType).toBe("modified");
		expect(file.binary).toBe(false);
		expect(file.additions).toBe(2);
		expect(file.deletions).toBe(1);
		expect(file.hunks).toHaveLength(1);
		const [hunk] = file.hunks;
		expect(hunk).toMatchObject({
			oldStart: 10,
			oldLines: 4,
			newStart: 10,
			newLines: 5,
			heading: "export function main() {",
		});
		expect(
			hunk.lines.map((l) => [l.kind, l.oldNumber, l.newNumber, l.content]),
		).toEqual([
			["context", 10, 10, "const a = 1;"],
			["removed", 11, null, "const b = 2;"],
			["added", null, 11, "const b = 3;"],
			["added", null, 12, "const c = 4;"],
			["context", 12, 13, "return a;"],
			["context", 13, 14, "}"],
		]);
	});

	it("keeps the hunk header text and defaults omitted counts to 1", () => {
		const [file] = parseUnifiedDiff(
			lines("--- a/x", "+++ b/x", "@@ -3 +3 @@", "-old", "+new"),
		);
		expect(file.hunks[0]).toMatchObject({
			oldStart: 3,
			oldLines: 1,
			newStart: 3,
			newLines: 1,
			header: "@@ -3 +3 @@",
			heading: "",
		});
	});

	it("parses several files and several hunks per file", () => {
		const files = parseUnifiedDiff(
			lines(
				"diff --git a/a.txt b/a.txt",
				"--- a/a.txt",
				"+++ b/a.txt",
				"@@ -1,2 +1,2 @@",
				"-one",
				"+uno",
				" two",
				"@@ -40,2 +40,3 @@",
				" forty",
				"+forty-one",
				" forty-two",
				"diff --git a/b.txt b/b.txt",
				"--- a/b.txt",
				"+++ b/b.txt",
				"@@ -1 +1 @@",
				"-b",
				"+B",
			),
		);
		expect(files.map((f) => f.path)).toEqual(["a.txt", "b.txt"]);
		expect(files[0].hunks.map((h) => h.newStart)).toEqual([1, 40]);
		expect(files[0].hunks[1].lines[1]).toMatchObject({
			kind: "added",
			newNumber: 41,
		});
		expect(files[1].additions).toBe(1);
	});

	it("marks a new file as added, with no old path", () => {
		const [file] = parseUnifiedDiff(
			lines(
				"diff --git a/docs/new.md b/docs/new.md",
				"new file mode 100644",
				"index 0000000..e69de29",
				"--- /dev/null",
				"+++ b/docs/new.md",
				"@@ -0,0 +1,2 @@",
				"+# New",
				"+text",
			),
		);
		expect(file.changeType).toBe("added");
		expect(file.oldPath).toBeNull();
		expect(file.newPath).toBe("docs/new.md");
		expect(file.hunks[0].lines.map((l) => l.newNumber)).toEqual([1, 2]);
	});

	it("marks a removed file as deleted, keeping its old path as the path", () => {
		const [file] = parseUnifiedDiff(
			lines(
				"diff --git a/old.go b/old.go",
				"deleted file mode 100644",
				"--- a/old.go",
				"+++ /dev/null",
				"@@ -1,2 +0,0 @@",
				"-package old",
				"-",
			),
		);
		expect(file.changeType).toBe("deleted");
		expect(file.newPath).toBeNull();
		expect(file.path).toBe("old.go");
		expect(file.deletions).toBe(2);
	});

	it("parses a pure rename with no hunks", () => {
		const [file] = parseUnifiedDiff(
			lines(
				"diff --git a/src/old name.ts b/src/new name.ts",
				"similarity index 100%",
				"rename from src/old name.ts",
				"rename to src/new name.ts",
			),
		);
		expect(file.changeType).toBe("renamed");
		expect(file.oldPath).toBe("src/old name.ts");
		expect(file.newPath).toBe("src/new name.ts");
		expect(file.path).toBe("src/new name.ts");
		expect(file.hunks).toEqual([]);
	});

	it("parses a rename with changes", () => {
		const [file] = parseUnifiedDiff(
			lines(
				"diff --git a/a.ts b/b.ts",
				"similarity index 90%",
				"rename from a.ts",
				"rename to b.ts",
				"--- a/a.ts",
				"+++ b/b.ts",
				"@@ -1 +1 @@",
				"-x",
				"+y",
			),
		);
		expect(file).toMatchObject({
			changeType: "renamed",
			oldPath: "a.ts",
			newPath: "b.ts",
			additions: 1,
			deletions: 1,
		});
	});

	it("reads paths from the diff --git line when nothing else names them", () => {
		const [file] = parseUnifiedDiff(
			lines(
				"diff --git a/bin/run b/bin/run",
				"old mode 100644",
				"new mode 100755",
			),
		);
		expect(file).toMatchObject({
			path: "bin/run",
			changeType: "modified",
			hunks: [],
		});
	});

	it("marks binary files from the Binary files marker", () => {
		const [added, changed] = parseUnifiedDiff(
			lines(
				"diff --git a/logo.png b/logo.png",
				"new file mode 100644",
				"index 0000000..3f2a1b4",
				"Binary files /dev/null and b/logo.png differ",
				"diff --git a/icon.png b/icon.png",
				"index 1111111..2222222 100644",
				"Binary files a/icon.png and b/icon.png differ",
			),
		);
		expect(added).toMatchObject({
			path: "logo.png",
			binary: true,
			changeType: "added",
			hunks: [],
		});
		expect(changed).toMatchObject({
			path: "icon.png",
			binary: true,
			changeType: "modified",
		});
	});

	it("marks binary files from a GIT binary patch and skips its payload", () => {
		const files = parseUnifiedDiff(
			lines(
				"diff --git a/font.woff b/font.woff",
				"index 1111111..2222222 100644",
				"GIT binary patch",
				"literal 12",
				"Tc${NkVPj)uW@ct)Z<p1SN=",
				"",
				"literal 0",
				"HcmV?d00001",
				"",
				"diff --git a/a.txt b/a.txt",
				"--- a/a.txt",
				"+++ b/a.txt",
				"@@ -1 +1 @@",
				"-a",
				"+b",
			),
		);
		expect(files.map((f) => [f.path, f.binary, f.hunks.length])).toEqual([
			["font.woff", true, 0],
			["a.txt", false, 1],
		]);
	});

	it("attaches no-newline-at-end markers to the line before them", () => {
		const [file] = parseUnifiedDiff(
			lines(
				"--- a/x",
				"+++ b/x",
				"@@ -1,2 +1,2 @@",
				" keep",
				"-last",
				"\\ No newline at end of file",
				"+last",
			),
		);
		const [keep, removed, added] = file.hunks[0].lines;
		expect(keep.noNewlineAtEnd).toBe(false);
		expect(removed).toMatchObject({ kind: "removed", noNewlineAtEnd: true });
		expect(added).toMatchObject({ kind: "added", noNewlineAtEnd: false });
		// The marker is not a line of its own.
		expect(file.hunks[0].lines).toHaveLength(3);
	});

	it("reads hunk lines by count, so content that looks like a header stays content", () => {
		const [file] = parseUnifiedDiff(
			lines(
				"--- a/notes.md",
				"+++ b/notes.md",
				"@@ -1,2 +1,2 @@",
				"--- a heading rule",
				"+++ a plus rule",
				" diff --git is just text here",
			),
		);
		expect(file.hunks[0].lines.map((l) => [l.kind, l.content])).toEqual([
			["removed", "-- a heading rule"],
			["added", "++ a plus rule"],
			["context", "diff --git is just text here"],
		]);
	});

	it("treats an empty line inside a hunk as an empty context line", () => {
		const [file] = parseUnifiedDiff(
			"--- a/x\n+++ b/x\n@@ -1,3 +1,3 @@\n a\n\n-b\n+c\n",
		);
		expect(file.hunks[0].lines.map((l) => [l.kind, l.content])).toEqual([
			["context", "a"],
			["context", ""],
			["removed", "b"],
			["added", "c"],
		]);
	});

	it("accepts CRLF line endings", () => {
		const [file] = parseUnifiedDiff(
			"--- a/x\r\n+++ b/x\r\n@@ -1 +1 @@\r\n-a\r\n+b\r\n",
		);
		expect(file.hunks[0].lines.map((l) => l.content)).toEqual(["a", "b"]);
	});

	it("parses a plain diff -u with timestamps and no diff --git line", () => {
		const [file] = parseUnifiedDiff(
			lines(
				"--- config.yml\t2026-11-01 10:00:00.000000000 +0100",
				"+++ config.yml\t2026-11-02 10:00:00.000000000 +0100",
				"@@ -1 +1 @@",
				"-port: 80",
				"+port: 8080",
			),
		);
		expect(file).toMatchObject({
			path: "config.yml",
			changeType: "modified",
		});
	});

	it("unquotes quoted paths", () => {
		const [file] = parseUnifiedDiff(
			lines(
				'diff --git "a/with \\"quote\\".txt" "b/with \\"quote\\".txt"',
				'--- "a/with \\"quote\\".txt"',
				'+++ "b/with \\"quote\\".txt"',
				"@@ -1 +1 @@",
				"-a",
				"+b",
			),
		);
		expect(file.path).toBe('with "quote".txt');
	});

	it("decodes octal-escaped UTF-8 and keeps unescaped non-ASCII in quoted paths", () => {
		const [file] = parseUnifiedDiff(
			lines(
				'--- "a/caf\\303\\251 \u{1F600}.txt"',
				'+++ "b/caf\\303\\251 \u{1F600}.txt"',
				"@@ -1 +1 @@",
				"-a",
				"+b",
			),
		);
		expect(file.path).toBe("caf\u00e9 \u{1F600}.txt");
	});

	it("parses bare hunks without any file header as one untitled file", () => {
		const [file] = parseUnifiedDiff(lines("@@ -1,2 +1,2 @@", " a", "-b", "+c"));
		expect(file).toMatchObject({
			path: "",
			oldPath: null,
			newPath: null,
			changeType: "modified",
			additions: 1,
			deletions: 1,
		});
	});

	it("ignores preamble text before the first file (commit message, stats)", () => {
		const files = parseUnifiedDiff(
			lines(
				"commit 0123abc",
				"Author: Someone",
				"",
				"    Change the port",
				"",
				"--- a/x",
				"+++ b/x",
				"@@ -1 +1 @@",
				"-a",
				"+b",
			),
		);
		expect(files).toHaveLength(1);
		expect(files[0].path).toBe("x");
	});

	it("gives every file a unique key, also for a path that appears twice", () => {
		const files = parseUnifiedDiff(
			lines(
				"--- a/x",
				"+++ b/x",
				"@@ -1 +1 @@",
				"-a",
				"+b",
				"--- a/x",
				"+++ b/x",
				"@@ -5 +5 @@",
				"-c",
				"+d",
			),
		);
		expect(files.map((f) => f.key)).toEqual(["x", "x#2"]);
	});
});
