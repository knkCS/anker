import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import aliases from "./lucide-aliases.generated";
import {
	ICON_NAMES,
	isIconName,
	loadIcon,
	loadIconCatalog,
	resolveIconName,
} from "./lucide-icons";
import metadata from "./lucide-metadata.generated";

describe("generated lucide metadata", () => {
	it("was generated from the installed lucide-react — re-run the script after a bump", () => {
		const installed = JSON.parse(
			readFileSync(
				join(process.cwd(), "node_modules/lucide-react/package.json"),
				"utf8",
			),
		).version;
		expect(metadata.version).toBe(installed);
	});

	it("covers exactly the icons lucide-react can load", () => {
		expect(metadata.icons.map(([name]) => name).sort()).toEqual(
			[...ICON_NAMES].sort(),
		);
	});

	it("carries lucide's tags and categories", () => {
		const banknote = metadata.icons.find(([name]) => name === "banknote");
		expect(banknote?.[1]).toContain("money");
		expect(banknote?.[2]).toContain("money");
		expect(metadata.categories).toContainEqual(["files", "File icons"]);
	});

	it("maps former names to loadable icons, never shadowing a current name", () => {
		expect(aliases["alert-triangle"]).toBe("triangle-alert");
		for (const [from, to] of Object.entries(aliases)) {
			expect(isIconName(from)).toBe(false);
			expect(isIconName(to)).toBe(true);
		}
	});
});

describe("resolveIconName", () => {
	it("keeps a current name, follows a former one, rejects the rest", async () => {
		expect(await resolveIconName("file-text")).toBe("file-text");
		expect(await resolveIconName("alert-triangle")).toBe("triangle-alert");
		expect(await resolveIconName("no-such-icon")).toBeNull();
		expect(await resolveIconName("")).toBeNull();
		// Object prototype keys are not icons.
		expect(await resolveIconName("constructor")).toBeNull();
	});
});

describe("loadIcon", () => {
	it("loads a lucide component by name, and null for an unknown one", async () => {
		const icon = await loadIcon("banknote");
		expect(icon).toBeTruthy();
		expect((icon as { displayName?: string }).displayName).toBe("Banknote");
		expect(await loadIcon("no-such-icon")).toBeNull();
	});
});

describe("loadIconCatalog", () => {
	it("gives every loadable icon an entry, with its tags", async () => {
		const catalog = await loadIconCatalog();
		expect(catalog.entries).toHaveLength(ICON_NAMES.length);
		expect(catalog.entries.find((e) => e.name === "banknote")?.tags).toContain(
			"money",
		);
		expect(catalog.categories.length).toBeGreaterThan(10);
	});
});
