import { describe, expect, it } from "vitest";
import { anchorComments, groupCommentsByFile } from "./diff-comments";
import { parseUnifiedDiff } from "./parse-unified-diff";

const DIFF = [
	"diff --git a/src/app.ts b/src/app.ts",
	"--- a/src/app.ts",
	"+++ b/src/app.ts",
	"@@ -10,3 +10,3 @@",
	" keep",
	"-old",
	"+new",
	" tail",
	"@@ -40,2 +40,3 @@",
	" forty",
	"+added",
	" forty-one",
	"diff --git a/a.ts b/b.ts",
	"similarity index 100%",
	"rename from a.ts",
	"rename to b.ts",
	"diff --git a/src/app.ts b/src/app.ts",
	"--- a/src/app.ts",
	"+++ b/src/app.ts",
	"@@ -1 +1 @@",
	"-x",
	"+y",
].join("\n");

const files = parseUnifiedDiff(DIFF);
const [app, renamed, appAgain] = files;

const ids = (list: readonly { id: string }[] | undefined) =>
	(list ?? []).map((c) => c.id);

describe("groupCommentsByFile", () => {
	it("hands each comment to the file named by key, new path or old path", () => {
		const { byFile, orphans } = groupCommentsByFile(files, [
			{ id: "by-path", path: "src/app.ts" },
			{ id: "by-key", path: "src/app.ts#2" },
			{ id: "by-old-path", path: "a.ts" },
			{ id: "by-new-path", path: "b.ts" },
		]);
		expect(ids(byFile.get(app))).toEqual(["by-path"]);
		expect(ids(byFile.get(appAgain))).toEqual(["by-key"]);
		expect(ids(byFile.get(renamed))).toEqual(["by-old-path", "by-new-path"]);
		expect(orphans).toEqual([]);
	});

	it("keeps comments on files the diff does not contain as orphans", () => {
		const { byFile, orphans } = groupCommentsByFile(files, [
			{ id: "gone", path: "README.md", line: 3 },
		]);
		expect(byFile.size).toBe(0);
		expect(ids(orphans)).toEqual(["gone"]);
	});
});

describe("anchorComments", () => {
	const lineOf = (number: number, side: "old" | "new") =>
		app.hunks
			.flatMap((h) => h.lines)
			.find((l) => (side === "old" ? l.oldNumber : l.newNumber) === number);

	it("anchors to the new side by default and to the old side on request", () => {
		const { byLine, fileLevel } = anchorComments(app, [
			{ id: "new-11", path: "src/app.ts", line: 11 },
			{ id: "old-11", path: "src/app.ts", line: 11, side: "old" },
			{ id: "new-41", path: "src/app.ts", line: 41 },
		]);
		const new11 = lineOf(11, "new");
		const old11 = lineOf(11, "old");
		expect(new11?.kind).toBe("added");
		expect(old11?.kind).toBe("removed");
		expect(ids(byLine.get(new11 as never))).toEqual(["new-11"]);
		expect(ids(byLine.get(old11 as never))).toEqual(["old-11"]);
		expect(ids(byLine.get(lineOf(41, "new") as never))).toEqual(["new-41"]);
		expect(fileLevel).toEqual([]);
	});

	it("sends comments without a line, between hunks or on the wrong side to the file level", () => {
		const { byLine, fileLevel } = anchorComments(app, [
			{ id: "file", path: "src/app.ts" },
			{ id: "null-line", path: "src/app.ts", line: null },
			{ id: "between-hunks", path: "src/app.ts", line: 25 },
			{ id: "past-the-end", path: "src/app.ts", line: 900 },
			// Line 42 exists on the new side only.
			{ id: "old-42", path: "src/app.ts", line: 42, side: "old" },
		]);
		expect(byLine.size).toBe(0);
		expect(ids(fileLevel)).toEqual([
			"file",
			"null-line",
			"between-hunks",
			"past-the-end",
			"old-42",
		]);
	});

	it("sends every comment of a file without hunks to the file level", () => {
		const { fileLevel } = anchorComments(renamed, [
			{ id: "r", path: "b.ts", line: 1 },
		]);
		expect(ids(fileLevel)).toEqual(["r"]);
	});
});
