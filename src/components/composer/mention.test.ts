import { describe, expect, it } from "vitest";
import {
	applyMentionInsertion,
	getActiveMention,
	moveHighlight,
} from "./mention";

describe("getActiveMention", () => {
	it("detects a trigger with a query running up to the caret", () => {
		expect(getActiveMention("hello @ada", 10, "@")).toEqual({
			start: 6,
			query: "ada",
		});
	});

	it("is active with an empty query right after the trigger", () => {
		expect(getActiveMention("@", 1, "@")).toEqual({ start: 0, query: "" });
	});

	it("returns null when there is no trigger before the caret", () => {
		expect(getActiveMention("hello", 5, "@")).toBeNull();
	});

	it("ignores a trigger that is not at a word boundary (emails)", () => {
		expect(getActiveMention("mail ada@example", 16, "@")).toBeNull();
	});

	it("accepts a trigger after a newline", () => {
		expect(getActiveMention("hi\n@ada", 7, "@")).toEqual({
			start: 3,
			query: "ada",
		});
	});

	it("allows spaces inside the query (display-name search)", () => {
		expect(getActiveMention("@jane d", 7, "@")).toEqual({
			start: 0,
			query: "jane d",
		});
	});

	it("deactivates when a newline follows the trigger", () => {
		expect(getActiveMention("@ada\nnext", 9, "@")).toBeNull();
	});

	it("deactivates when the query starts with whitespace", () => {
		expect(getActiveMention("ping @ noon", 11, "@")).toBeNull();
	});

	it("deactivates once the query grows implausibly long", () => {
		const value = `@${"x".repeat(65)}`;
		expect(getActiveMention(value, value.length, "@")).toBeNull();
	});

	it("only sees the mention when the caret is after the trigger", () => {
		expect(getActiveMention("hi @ada", 2, "@")).toBeNull();
	});

	it("uses the nearest trigger before the caret", () => {
		expect(getActiveMention("@ada ping @gra", 14, "@")).toEqual({
			start: 10,
			query: "gra",
		});
	});
});

describe("applyMentionInsertion", () => {
	it("replaces the trigger + query and puts the caret after the insert", () => {
		expect(
			applyMentionInsertion(
				"hi @ad",
				{ start: 3, query: "ad" },
				"@",
				"@Ada Lovelace ",
			),
		).toEqual({ value: "hi @Ada Lovelace ", caretIndex: 17 });
	});

	it("preserves text after the mention token", () => {
		expect(
			applyMentionInsertion(
				"@gr — see thread",
				{ start: 0, query: "gr" },
				"@",
				"@Grace Hopper",
			),
		).toEqual({ value: "@Grace Hopper — see thread", caretIndex: 13 });
	});
});

describe("moveHighlight", () => {
	it("steps through the list", () => {
		expect(moveHighlight(3, 0, 1)).toBe(1);
		expect(moveHighlight(3, 1, -1)).toBe(0);
	});

	it("wraps from the last suggestion to the first and back", () => {
		expect(moveHighlight(3, 2, 1)).toBe(0);
		expect(moveHighlight(3, 0, -1)).toBe(2);
	});

	it("returns -1 for an empty list", () => {
		expect(moveHighlight(0, 0, 1)).toBe(-1);
	});
});
