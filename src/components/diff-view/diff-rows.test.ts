import { describe, expect, it } from "vitest";
import { anchorComments } from "./diff-comments";
import { buildDiffRows, type DiffRow } from "./diff-rows";
import { parseUnifiedDiff } from "./parse-unified-diff";

const context = (from: number, count: number) =>
	Array.from({ length: count }, (_, i) => ` line ${from + i}`);

function fileWith(body: string[], header = "@@ -1,30 +1,30 @@") {
	const [file] = parseUnifiedDiff(
		["--- a/x", "+++ b/x", header, ...body].join("\n"),
	);
	return file;
}

const shape = (rows: DiffRow[]) =>
	rows.map((row) =>
		row.type === "line"
			? `${row.line.kind[0]}${row.line.newNumber ?? row.line.oldNumber}`
			: row.type === "fold"
				? `fold(${row.lines.length})`
				: row.type === "comments"
					? `comments(${row.comments.map((c) => c.id).join(",")})`
					: "hunk",
	);

describe("buildDiffRows", () => {
	it("starts every hunk with a hunk row and lists its lines", () => {
		const file = fileWith(["-a", "+b"], "@@ -1 +1 @@");
		expect(shape(buildDiffRows(file))).toEqual(["hunk", "r1", "a1"]);
	});

	it("folds a long run of unchanged lines between two changes, keeping 3 on each side", () => {
		// 1 change, 12 context lines, 1 change.
		const file = fileWith(
			["-a", "+a", ...context(2, 12), "-b", "+b"],
			"@@ -1,14 +1,14 @@",
		);
		expect(shape(buildDiffRows(file))).toEqual([
			"hunk",
			"r1",
			"a1",
			"c2",
			"c3",
			"c4",
			"fold(6)",
			"c11",
			"c12",
			"c13",
			"r14",
			"a14",
		]);
	});

	it("folds leading and trailing unchanged lines, keeping the ones next to the change", () => {
		const file = fileWith(
			[...context(1, 8), "-x", "+x", ...context(10, 8)],
			"@@ -1,17 +1,17 @@",
		);
		expect(shape(buildDiffRows(file))).toEqual([
			"hunk",
			"fold(5)",
			"c6",
			"c7",
			"c8",
			"r9",
			"a9",
			"c10",
			"c11",
			"c12",
			"fold(5)",
		]);
	});

	it("does not fold a run that would hide fewer than two lines", () => {
		const file = fileWith(
			["-a", "+a", ...context(2, 7), "-b", "+b"],
			"@@ -1,9 +1,9 @@",
		);
		expect(shape(buildDiffRows(file))).not.toContain("fold(1)");
		expect(shape(buildDiffRows(file))).toHaveLength(1 + 2 + 7 + 2);
	});

	it("shows the folded lines once the fold is expanded", () => {
		const file = fileWith(
			["-a", "+a", ...context(2, 12), "-b", "+b"],
			"@@ -1,14 +1,14 @@",
		);
		const fold = buildDiffRows(file).find((row) => row.type === "fold");
		if (fold?.type !== "fold") throw new Error("no fold");
		const rows = buildDiffRows(file, { expanded: new Set([fold.key]) });
		expect(shape(rows)).not.toContain("fold(6)");
		expect(shape(rows).filter((s) => s.startsWith("c"))).toHaveLength(12);
	});

	it("keeps more context with a larger contextLines and none folded with Infinity", () => {
		const file = fileWith(
			["-a", "+a", ...context(2, 12), "-b", "+b"],
			"@@ -1,14 +1,14 @@",
		);
		expect(shape(buildDiffRows(file, { contextLines: 5 }))).toContain(
			"fold(2)",
		);
		expect(
			buildDiffRows(file, { contextLines: Number.POSITIVE_INFINITY }).some(
				(row) => row.type === "fold",
			),
		).toBe(false);
	});

	it("gives every row a key unique in the file", () => {
		const [file] = parseUnifiedDiff(
			[
				"--- a/x",
				"+++ b/x",
				"@@ -1,9 +1,9 @@",
				...context(1, 9),
				"@@ -40,2 +40,2 @@",
				"-a",
				"+b",
			].join("\n"),
		);
		const keys = buildDiffRows(file).map((row) => row.key);
		expect(new Set(keys).size).toBe(keys.length);
	});

	describe("with comments", () => {
		const comment = (id: string, line: number, side?: "old" | "new") => ({
			id,
			path: "x",
			line,
			side,
		});

		it("puts a comments row right after the line each comment is anchored to", () => {
			const file = fileWith(["-a", "+b", " c"], "@@ -1,2 +1,2 @@");
			const { byLine } = anchorComments(file, [
				comment("on-added", 1),
				comment("on-removed", 1, "old"),
				comment("on-context", 2),
				comment("also-added", 1),
			]);
			expect(shape(buildDiffRows(file, { comments: byLine }))).toEqual([
				"hunk",
				"r1",
				"comments(on-removed)",
				"a1",
				"comments(on-added,also-added)",
				"c2",
				"comments(on-context)",
			]);
		});

		it("never folds a commented line, keeping context around it", () => {
			const file = fileWith(
				["-a", "+a", ...context(2, 20), "-b", "+b"],
				"@@ -1,22 +1,22 @@",
			);
			const { byLine } = anchorComments(file, [comment("mid", 12)]);
			const rows = buildDiffRows(file, { comments: byLine });
			expect(shape(rows)).toEqual([
				"hunk",
				"r1",
				"a1",
				"c2",
				"c3",
				"c4",
				"fold(4)",
				"c9",
				"c10",
				"c11",
				"c12",
				"comments(mid)",
				"c13",
				"c14",
				"c15",
				"fold(3)",
				"c19",
				"c20",
				"c21",
				"r22",
				"a22",
			]);
			const keys = rows.map((row) => row.key);
			expect(new Set(keys).size).toBe(keys.length);
		});
	});
});
