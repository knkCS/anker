import { afterEach, describe, expect, it, vi } from "vitest";
import { pushRecent, readRecent, writeRecent } from "./recent-icons";

const KEY = "test:recent-icons";

afterEach(() => {
	localStorage.clear();
	vi.restoreAllMocks();
});

describe("pushRecent", () => {
	it("puts the picked icon first", () => {
		expect(pushRecent(["a", "b"], "c", 5)).toEqual(["c", "a", "b"]);
	});

	it("moves an icon already in the list to the front instead of repeating it", () => {
		expect(pushRecent(["a", "b", "c"], "b", 5)).toEqual(["b", "a", "c"]);
	});

	it("drops the oldest beyond `max`", () => {
		expect(pushRecent(["a", "b", "c"], "d", 3)).toEqual(["d", "a", "b"]);
	});
});

describe("readRecent / writeRecent", () => {
	it("round-trips through localStorage", () => {
		writeRecent(KEY, ["a", "b"]);
		expect(readRecent(KEY)).toEqual(["a", "b"]);
	});

	it("reads nothing for a missing, malformed or foreign value", () => {
		expect(readRecent(KEY)).toEqual([]);
		localStorage.setItem(KEY, "{not json");
		expect(readRecent(KEY)).toEqual([]);
		localStorage.setItem(KEY, JSON.stringify({ a: 1 }));
		expect(readRecent(KEY)).toEqual([]);
		localStorage.setItem(KEY, JSON.stringify(["a", 2, null, "b"]));
		expect(readRecent(KEY)).toEqual(["a", "b"]);
	});

	it("survives storage that throws (private mode, blocked site data)", () => {
		vi.spyOn(localStorage, "getItem").mockImplementation(() => {
			throw new Error("SecurityError");
		});
		vi.spyOn(localStorage, "setItem").mockImplementation(() => {
			throw new Error("QuotaExceededError");
		});
		expect(readRecent(KEY)).toEqual([]);
		expect(() => writeRecent(KEY, ["a"])).not.toThrow();
	});
});
