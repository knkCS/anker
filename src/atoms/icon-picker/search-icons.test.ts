import { describe, expect, it } from "vitest";
import { searchIcons } from "./search-icons";
import type { IconEntry } from "./types";

const entry = (
	name: string,
	tags: string[] = [],
	categories: string[] = [],
): IconEntry => ({ name, tags, categories });

const entries: IconEntry[] = [
	entry("banknote", ["currency", "money", "payment"], ["money"]),
	entry("file", ["document"], ["files"]),
	entry("file-text", ["data", "txt", "pdf", "document"], ["files", "text"]),
	entry("text-cursor", ["select"], ["text"]),
	entry("profile", ["user"], ["account"]),
	entry("triangle-alert", ["warning", "alert-triangle"], ["notifications"]),
];

const names = (query: string, category?: string | null) =>
	searchIcons(entries, { query, category });

describe("searchIcons", () => {
	it("returns every icon, in order, for an empty query and no category", () => {
		expect(names("")).toEqual(entries.map((e) => e.name));
		expect(names("   ")).toEqual(entries.map((e) => e.name));
	});

	it("finds an icon by one of lucide's tags", () => {
		expect(names("money")).toEqual(["banknote"]);
	});

	it("finds an icon by a tag prefix", () => {
		expect(names("curr")).toEqual(["banknote"]);
	});

	it("finds an icon by a former name kept among its tags", () => {
		expect(names("alert-triangle")).toEqual(["triangle-alert"]);
	});

	it("ranks an exact name, then a name prefix, then a name substring, then a tag", () => {
		// "file": exact `file`, prefix `file-text`, substring `profile`;
		// nothing tags "file", so no tag-only hits.
		expect(names("file")).toEqual(["file", "file-text", "profile"]);
		// "text": prefix `text-cursor`, substring `file-text`, tag `txt` doesn't
		// match — order within a rank keeps the input order.
		expect(names("text")).toEqual(["text-cursor", "file-text"]);
		// "document": tags only.
		expect(names("document")).toEqual(["file", "file-text"]);
	});

	it("needs every word to match, and treats spaces like the name's hyphens", () => {
		expect(names("file text")).toEqual(["file-text"]);
		expect(names("file pdf")).toEqual(["file-text"]);
		expect(names("file money")).toEqual([]);
	});

	it("is case-insensitive", () => {
		expect(names("MONEY")).toEqual(["banknote"]);
		expect(names("File-Text")).toEqual(["file-text"]);
	});

	it("filters by category, with and without a query", () => {
		expect(names("", "text")).toEqual(["file-text", "text-cursor"]);
		expect(names("cursor", "text")).toEqual(["text-cursor"]);
		expect(names("money", "text")).toEqual([]);
	});

	it("searches names alone when the metadata has not loaded", () => {
		const bare = entries.map((e) => entry(e.name));
		expect(searchIcons(bare, { query: "money" })).toEqual([]);
		expect(searchIcons(bare, { query: "bank" })).toEqual(["banknote"]);
	});
});
