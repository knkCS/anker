// The charts stay inside anker's own consumer rules (#328, #329): their sources and
// their stories pass `checkAnkerRules()` — no raw Chakra import, no hex
// colour — because consumers copy the stories, and a chart built from them
// must pass the same check in their `anker-rules.test.ts`.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkAnkerRules } from "../rules";

// Built with `dirname` rather than `new URL(…, import.meta.url)`, which Vite
// rewrites into an /@fs/ URL that `fileURLToPath` rejects.
const here = dirname(fileURLToPath(import.meta.url));

const sources = readdirSync(here)
	.filter((name) => /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name))
	.map((file) => ({ file, text: readFileSync(join(here, file), "utf8") }));

describe("charts and checkAnkerRules", () => {
	it("checks the components and their stories", () => {
		const files = sources.map((s) => s.file);
		expect(files).toContain("line-chart.tsx");
		expect(files).toContain("area-chart.tsx");
		expect(files).toContain("bar-chart.tsx");
		expect(files).toContain("chart-frame.tsx");
		expect(files).toContain("charts.stories.tsx");
		expect(files).toContain("bar-chart.stories.tsx");
	});

	it("passes", () => {
		expect(checkAnkerRules(sources)).toEqual([]);
	});
});
