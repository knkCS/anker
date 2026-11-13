// DiffView stays inside anker's own consumer rules (#330): its sources and its
// stories pass `checkAnkerRules()` — no raw Chakra import, no hex colour —
// because consumers copy the stories, and a diff built from them must pass
// the same check in their `anker-rules.test.ts`.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkAnkerRules } from "../../rules";

// Built with `dirname` rather than `new URL(…, import.meta.url)`, which Vite
// rewrites into an /@fs/ URL that `fileURLToPath` rejects.
const here = dirname(fileURLToPath(import.meta.url));

const sources = readdirSync(here)
	.filter((name) => /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name))
	.map((file) => ({ file, text: readFileSync(join(here, file), "utf8") }));

describe("DiffView and checkAnkerRules", () => {
	it("checks the component and its stories", () => {
		const files = sources.map((s) => s.file);
		expect(files).toContain("diff-view.tsx");
		expect(files).toContain("parse-unified-diff.ts");
		expect(files).toContain("diff-view.stories.tsx");
	});

	it("passes", () => {
		expect(checkAnkerRules(sources)).toEqual([]);
	});
});
