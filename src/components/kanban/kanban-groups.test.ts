import { describe, expect, it } from "vitest";
import { columnTone, resolveGroups } from "./kanban-groups";

const COLUMNS = ["a", "b", "c", "d", "e"];

describe("resolveGroups", () => {
	it("without groups there is no group row", () => {
		expect(resolveGroups(COLUMNS, undefined).segments).toBeNull();
		expect(resolveGroups(COLUMNS, []).segments).toBeNull();
	});

	it("places groups over their runs, columns outside them standing alone", () => {
		const { segments, groupOf, problems } = resolveGroups(COLUMNS, [
			{ id: "g1", title: "One", columnIds: ["b", "c"] },
			{ id: "g2", title: "Two", columnIds: ["e"] },
		]);
		expect(problems).toEqual([]);
		expect(
			segments?.map((s) =>
				s.kind === "group"
					? `${s.placed.group.id}:${s.placed.start}-${s.placed.end}`
					: s.index,
			),
		).toEqual([0, "g1:1-3", 3, "g2:4-5"]);
		expect(groupOf.map((g) => g?.group.id)).toEqual([
			undefined,
			"g1",
			"g1",
			undefined,
			"g2",
		]);
	});

	it("takes a group's columns in any order as long as they are consecutive", () => {
		const { segments, problems } = resolveGroups(COLUMNS, [
			{ id: "g", title: "G", columnIds: ["c", "a", "b"] },
		]);
		expect(problems).toEqual([]);
		expect(segments?.[0]).toMatchObject({
			kind: "group",
			placed: { start: 0, end: 3 },
		});
	});

	it.each([
		[
			"non-consecutive columns",
			[{ id: "g", title: "G", columnIds: ["a", "c"] }],
			/not consecutive/,
		],
		[
			"an unknown column",
			[{ id: "g", title: "G", columnIds: ["a", "zz"] }],
			/unknown column\(s\) "zz"/,
		],
		["no column", [{ id: "g", title: "G", columnIds: [] }], /names no column/],
		[
			"a column twice",
			[{ id: "g", title: "G", columnIds: ["a", "a"] }],
			/a column twice/,
		],
	])("ignores a group naming %s, with the reason", (_, groups, reason) => {
		const { segments, problems } = resolveGroups(COLUMNS, groups);
		expect(segments).toBeNull();
		expect(problems).toHaveLength(1);
		expect(problems[0]).toMatch(/Kanban group "g"/);
		expect(problems[0]).toMatch(reason);
	});

	it("ignores a group overlapping an earlier one, or repeating its id", () => {
		const { segments, problems } = resolveGroups(COLUMNS, [
			{ id: "g1", title: "One", columnIds: ["a", "b"] },
			{ id: "g2", title: "Two", columnIds: ["b", "c"] },
			{ id: "g1", title: "Again", columnIds: ["d"] },
		]);
		expect(problems).toHaveLength(2);
		expect(problems[0]).toMatch(/"g2".*"b" that another group holds/);
		expect(problems[1]).toMatch(/"g1" repeats/);
		expect(segments?.map((s) => s.kind)).toEqual([
			"group",
			"column",
			"column",
			"column",
		]);
	});
});

describe("columnTone", () => {
	const group = {
		id: "g",
		title: "G",
		columnIds: ["a"],
		tone: "info" as const,
	};

	it("is the column's own tone, else its group's", () => {
		expect(columnTone("success", undefined, group)).toBe("success");
		expect(columnTone(undefined, undefined, group)).toBe("info");
		expect(columnTone(undefined, undefined, undefined)).toBeUndefined();
	});

	it("is warning for a highlighted column with no tone of its own or its group's", () => {
		expect(columnTone(undefined, "highlight", undefined)).toBe("warning");
		expect(columnTone(undefined, "highlight", group)).toBe("info");
	});
});
