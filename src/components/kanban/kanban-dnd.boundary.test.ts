// A read-only board loads no drag-and-drop code (#327). dnd-kit is reached
// only through `kanban-dnd.tsx`, and that module only through the dynamic
// `import("./kanban-dnd")` an editable board (`onMove`) makes — so tsup emits
// it as a chunk of its own that the components entry never loads up front.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

const sources = readdirSync(here)
	.filter(
		(name) => /\.tsx?$/.test(name) && !/\.(test|stories)\.tsx?$/.test(name),
	)
	.map((file) => ({ file, text: readFileSync(join(here, file), "utf8") }));

/** Static (value) imports of `specifier`: `import … from "…"`, not `import type`. */
const staticImports = (text: string, specifier: RegExp) =>
	[...text.matchAll(/^import\s+(?!type\b)[^;]*?from\s+["']([^"']+)["']/gms)]
		.map((m) => m[1])
		.filter((s) => specifier.test(s));

describe("Kanban drag-and-drop boundary", () => {
	it("imports dnd-kit only from kanban-dnd.tsx", () => {
		const importers = sources
			.filter((s) => staticImports(s.text, /^@dnd-kit\//).length > 0)
			.map((s) => s.file);
		expect(importers).toEqual(["kanban-dnd.tsx"]);
	});

	it("never imports kanban-dnd.tsx statically", () => {
		const importers = sources
			.filter((s) => staticImports(s.text, /^\.\/kanban-dnd$/).length > 0)
			.map((s) => s.file);
		expect(importers).toEqual([]);
	});

	it("loads kanban-dnd.tsx through a dynamic import in kanban.tsx", () => {
		const board = sources.find((s) => s.file === "kanban.tsx")?.text ?? "";
		expect(board).toMatch(/import\(\s*["']\.\/kanban-dnd["']\s*\)/);
	});
});
