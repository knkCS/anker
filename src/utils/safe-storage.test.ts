import { afterEach, describe, expect, it } from "vitest";
import { BROKEN_STORAGE_SHAPES, breakLocalStorage } from "../test/storage";
import {
	readStoredFlag,
	readStoredValue,
	writeStoredFlag,
	writeStoredValue,
} from "./safe-storage";

let restore: (() => void) | undefined;
let keySeq = 0;
const nextKey = () => `test.safe-storage.${++keySeq}`;

afterEach(() => {
	restore?.();
	restore = undefined;
	window.localStorage.clear();
});

describe("safe storage with working localStorage", () => {
	it("writes through to localStorage and reads it back", () => {
		const key = nextKey();
		writeStoredValue(key, "a");
		expect(window.localStorage.getItem(key)).toBe("a");
		expect(readStoredValue(key)).toBe("a");
	});

	it("reads a flag only when it is literally true or false", () => {
		const key = nextKey();
		expect(readStoredFlag(key)).toBeUndefined();
		window.localStorage.setItem(key, "yes");
		expect(readStoredFlag(key)).toBeUndefined();
		writeStoredFlag(key, false);
		expect(readStoredFlag(key)).toBe(false);
	});

	it("hands a value held in memory back to storage once storage works again", () => {
		const key = nextKey();
		restore = breakLocalStorage("throws-on-write");
		writeStoredValue(key, "memory");
		restore();
		restore = undefined;
		writeStoredValue(key, "storage");
		expect(window.localStorage.getItem(key)).toBe("storage");
		window.localStorage.setItem(key, "changed elsewhere");
		expect(readStoredValue(key)).toBe("changed elsewhere");
	});
});

describe.each(
	BROKEN_STORAGE_SHAPES,
)("safe storage when localStorage is %s", (shape) => {
	it("never throws and keeps the value in memory", () => {
		restore = breakLocalStorage(shape);
		const key = nextKey();
		expect(readStoredValue(key)).toBeNull();
		writeStoredFlag(key, true);
		expect(readStoredFlag(key)).toBe(true);
	});
});
