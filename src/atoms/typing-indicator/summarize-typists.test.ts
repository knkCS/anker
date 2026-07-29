import { describe, expect, it } from "vitest";
import { defaultTypingLabel, summarizeTypists } from "./summarize-typists";

describe("summarizeTypists", () => {
	it("names a lone typist", () => {
		expect(summarizeTypists(["Alice"], 2)).toEqual({
			named: ["Alice"],
			overflowCount: 0,
			total: 1,
		});
	});

	it("names everyone while the list fits within maxNames", () => {
		expect(summarizeTypists(["Alice", "Bob"], 2)).toEqual({
			named: ["Alice", "Bob"],
			overflowCount: 0,
			total: 2,
		});
	});

	it("folds the tail into an overflow count past maxNames", () => {
		expect(summarizeTypists(["Alice", "Bob", "Cara", "Dan"], 2)).toEqual({
			named: ["Alice", "Bob"],
			overflowCount: 2,
			total: 4,
		});
	});

	it("keeps maxNames a hard cap, so one over still overflows", () => {
		// A soft cap ("just name the third one, it's shorter") would make the
		// rendered width unpredictable for the consumer that chose the cap.
		expect(summarizeTypists(["Alice", "Bob", "Cara"], 2)).toEqual({
			named: ["Alice", "Bob"],
			overflowCount: 1,
			total: 3,
		});
	});

	it("honours a wider maxNames", () => {
		expect(summarizeTypists(["Alice", "Bob", "Cara"], 3)).toEqual({
			named: ["Alice", "Bob", "Cara"],
			overflowCount: 0,
			total: 3,
		});
	});

	it("returns null when nobody is typing, so callers need no guard", () => {
		expect(summarizeTypists([], 2)).toBeNull();
	});

	it("drops blank names rather than rendering a hole in the sentence", () => {
		expect(summarizeTypists(["Alice", "  ", ""], 2)).toEqual({
			named: ["Alice"],
			overflowCount: 0,
			total: 1,
		});
	});

	it("returns null when every name is blank", () => {
		expect(summarizeTypists(["", "   "], 2)).toBeNull();
	});

	it("trims surrounding whitespace off the names it keeps", () => {
		expect(summarizeTypists([" Alice "], 2)?.named).toEqual(["Alice"]);
	});

	it("clamps maxNames to at least one name", () => {
		// Zero would name nobody and read "3 others are typing" — the cap has to
		// leave the sentence with a subject.
		expect(summarizeTypists(["Alice", "Bob", "Cara"], 0)).toEqual({
			named: ["Alice"],
			overflowCount: 2,
			total: 3,
		});
	});

	it("floors a fractional maxNames", () => {
		expect(summarizeTypists(["Alice", "Bob", "Cara"], 2.7)?.named).toEqual([
			"Alice",
			"Bob",
		]);
	});

	it("never caps when maxNames is infinite", () => {
		expect(
			summarizeTypists(["Alice", "Bob", "Cara"], Number.POSITIVE_INFINITY),
		).toEqual({
			named: ["Alice", "Bob", "Cara"],
			overflowCount: 0,
			total: 3,
		});
	});

	it("does not mutate the caller's array", () => {
		const names = ["Bob", "Alice"];
		summarizeTypists(names, 1);
		expect(names).toEqual(["Bob", "Alice"]);
	});
});

describe("defaultTypingLabel", () => {
	const summarize = (names: string[], maxNames = 2) => {
		const summary = summarizeTypists(names, maxNames);
		if (summary === null) throw new Error("expected a summary");
		return defaultTypingLabel(summary);
	};

	it("uses the singular verb for one typist", () => {
		expect(summarize(["Alice"])).toBe("Alice is typing…");
	});

	it("joins two names with `and`, no comma", () => {
		expect(summarize(["Alice", "Bob"])).toBe("Alice and Bob are typing…");
	});

	it("comma-separates all but the last name", () => {
		expect(summarize(["Alice", "Bob", "Cara"], 3)).toBe(
			"Alice, Bob and Cara are typing…",
		);
	});

	it("reads the overflow as the last item in the list", () => {
		expect(summarize(["Alice", "Bob", "Cara", "Dan"])).toBe(
			"Alice, Bob and 2 others are typing…",
		);
	});

	it("singularises a one-person overflow", () => {
		expect(summarize(["Alice", "Bob", "Cara"])).toBe(
			"Alice, Bob and 1 other are typing…",
		);
	});

	it("stays plural when the overflow is the only thing after one name", () => {
		expect(summarize(["Alice", "Bob", "Cara"], 1)).toBe(
			"Alice and 2 others are typing…",
		);
	});
});
