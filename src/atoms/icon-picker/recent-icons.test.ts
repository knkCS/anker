import { afterEach, describe, expect, it } from "vitest";
import { BROKEN_STORAGE_SHAPES, breakLocalStorage } from "../../test/storage";
import { pushRecent, readRecent, writeRecent } from "./recent-icons";

const KEY = "test:recent-icons";

let restore: (() => void) | undefined;

afterEach(() => {
	restore?.();
	restore = undefined;
	localStorage.clear();
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

	it.each(
		BROKEN_STORAGE_SHAPES,
	)("survives storage that is %s and remembers the list for the session", (shape) => {
		restore = breakLocalStorage(shape);
		// Its own key: the list stays in memory for the session.
		const key = `${KEY}:${shape}`;
		expect(readRecent(key)).toEqual([]);
		expect(() => writeRecent(key, ["a"])).not.toThrow();
		expect(readRecent(key)).toEqual(["a"]);
	});
});
