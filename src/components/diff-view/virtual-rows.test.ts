import { describe, expect, it } from "vitest";
import { anchorComments } from "./diff-comments";
import { buildDiffRows } from "./diff-rows";
import { parseUnifiedDiff } from "./parse-unified-diff";
import {
	estimateRowSize,
	lineNumberDigits,
	shouldVirtualize,
	widestLine,
	windowWithGaps,
	withKeptRows,
} from "./virtual-rows";

function fileWith(body: string[], header: string) {
	const [file] = parseUnifiedDiff(
		["--- a/x", "+++ b/x", header, ...body].join("\n"),
	);
	return file;
}

const added = (count: number) =>
	fileWith(
		Array.from({ length: count }, (_, i) => `+line ${i + 1}`),
		`@@ -0,0 +1,${count} @@`,
	);

describe("shouldVirtualize", () => {
	it("virtualises a file with more rows than the threshold, never a binary one", () => {
		expect(shouldVirtualize(added(10), 11, 11)).toBe(false);
		expect(shouldVirtualize(added(10), 11, 10)).toBe(true);
		expect(shouldVirtualize(added(10), 11, Number.POSITIVE_INFINITY)).toBe(
			false,
		);
		const [binary] = parseUnifiedDiff(
			"diff --git a/a.png b/a.png\nBinary files a/a.png and b/a.png differ",
		);
		expect(shouldVirtualize(binary, 1, 0)).toBe(false);
	});
});

describe("estimateRowSize", () => {
	it("sizes rows by kind and variant", () => {
		const file = added(2);
		const rows = buildDiffRows(file, {
			comments: anchorComments(file, [
				{ id: "a", path: "x", line: 1 },
				{ id: "b", path: "x", line: 1 },
			]).byLine,
		});
		const [hunk, line, comments] = rows;
		expect(estimateRowSize(line, "default")).toBe(21);
		expect(estimateRowSize(line, "compact")).toBe(18);
		expect(estimateRowSize(hunk, "default")).toBe(25);
		expect(estimateRowSize(comments, "default")).toBeGreaterThan(
			estimateRowSize(
				buildDiffRows(file, {
					comments: anchorComments(file, [{ id: "a", path: "x", line: 1 }])
						.byLine,
				})[2],
				"default",
			),
		);
		expect(estimateRowSize(undefined, "default")).toBe(21);
	});
});

describe("lineNumberDigits and widestLine", () => {
	it("counts the digits of the largest line number", () => {
		expect(lineNumberDigits(added(9))).toBe(1);
		expect(lineNumberDigits(added(5000))).toBe(4);
	});

	it("measures the widest line with tabs expanded to the next stop", () => {
		const file = fileWith(["+ab", "+\tx", "+a\tx"], "@@ -0,0 +1,3 @@");
		// The header is the widest line here.
		expect(widestLine(file, 4)).toBe("@@ -0,0 +1,3 @@".length);
		const tabs = fileWith(["+\t\t\tx"], "@@ -0 +1 @@");
		expect(widestLine(tabs, 4)).toBe(13);
		expect(widestLine(tabs, 8)).toBe(25);
		const mixed = fileWith(["+abcdefghij\tx"], "@@ -0 +1 @@");
		expect(widestLine(mixed, 4)).toBe(13);
	});
});

describe("windowWithGaps", () => {
	it("pads above, between and below the drawn rows", () => {
		expect(
			windowWithGaps(
				[
					{ index: 50, start: 1000, end: 1020 },
					{ index: 3, start: 60, end: 80 },
					{ index: 51, start: 1020, end: 1040 },
				],
				5000,
			),
		).toEqual([
			{ type: "gap", key: "gap3", size: 60 },
			{ type: "row", index: 3 },
			{ type: "gap", key: "gap50", size: 920 },
			{ type: "row", index: 50 },
			{ type: "row", index: 51 },
			{ type: "gap", key: "gap-end", size: 3960 },
		]);
	});

	it("needs no spacer when the rows fill the list", () => {
		expect(windowWithGaps([{ index: 0, start: 0, end: 20 }], 20)).toEqual([
			{ type: "row", index: 0 },
		]);
	});
});

describe("withKeptRows", () => {
	const file = added(20);
	const rows = buildDiffRows(file, {
		comments: anchorComments(file, [{ id: "a", path: "x", line: 15 }]).byLine,
	});
	const commentRow = rows.findIndex((r) => r.type === "comments");

	it("adds kept rows to the window, in order, once", () => {
		expect(withKeptRows([0, 1, 2], [undefined], rows)).toEqual([0, 1, 2]);
		expect(withKeptRows([5, 6], [2, 6], rows)).toEqual([2, 5, 6]);
		expect(withKeptRows([5, 6], [-1, 999], rows)).toEqual([5, 6]);
	});

	it("keeps a comment row's line with it", () => {
		expect(withKeptRows([0, 1], [commentRow], rows)).toEqual([
			0,
			1,
			commentRow - 1,
			commentRow,
		]);
	});
});
