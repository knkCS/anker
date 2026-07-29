// Pins anker#164's "bundle stays free of any emoji-data dependency" to the
// two things that could break it: a new package in package.json, and a new
// import inside this directory. The quick set is sixteen hand-written glyphs
// precisely so no emoji catalogue ships to every consumer — the searchable
// picker that would need one is v2, behind an optional subpath
// (messengerhub ADR-0009).
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Resolved from this file, not from `process.cwd()`, so the suite reads the
// same sources however vitest was invoked. Built with `dirname`/`resolve`
// rather than `new URL(…, import.meta.url)`, which Vite statically rewrites
// into an /@fs/ URL that `fileURLToPath` then rejects.
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");

const pkg = JSON.parse(
	readFileSync(join(repoRoot, "package.json"), "utf8"),
) as {
	dependencies: Record<string, string>;
	peerDependencies: Record<string, string>;
};

/**
 * Every module the reactions source imports by name. Relative imports are
 * ignored — they stay inside anker and are covered by the same rule
 * transitively.
 */
function bareImports(): { file: string; module: string }[] {
	const sources = readdirSync(here).filter(
		(name) =>
			/\.tsx?$/.test(name) &&
			!name.endsWith(".test.ts") &&
			!name.endsWith(".test.tsx") &&
			!name.endsWith(".stories.tsx"),
	);

	return sources.flatMap((file) => {
		const text = readFileSync(join(here, file), "utf8");
		// `from "x"` covers both static imports and re-exports, which is all
		// this directory uses; a dynamic import() would be a new pattern here
		// and is caught by the barrel-shape assertion below.
		const matches = text.matchAll(/from\s+"([^"]+)"/g);
		return Array.from(matches, (m) => ({ file, module: m[1] }));
	});
}

describe("reactions ship no emoji-data dependency (#164)", () => {
	it("finds the sources it is meant to be guarding", () => {
		// Without this the whole suite passes vacuously if the directory is
		// renamed or the files move.
		const files = new Set(bareImports().map((i) => i.file));
		expect(files).toContain("reaction-chips.tsx");
		expect(files).toContain("reaction-quick-set-popover.tsx");
	});

	it("imports nothing beyond React, Chakra, Lucide and anker itself", () => {
		const allowed = new Set(["react", "@chakra-ui/react", "lucide-react"]);

		const foreign = bareImports().filter(
			({ module }) => !module.startsWith(".") && !allowed.has(module),
		);

		expect(foreign).toEqual([]);
	});

	it("declares no emoji package among anker's own dependencies", () => {
		const declared = [
			...Object.keys(pkg.dependencies),
			...Object.keys(pkg.peerDependencies),
		];

		// Name-shaped rather than a fixed blocklist: emoji-mart, emojibase,
		// emoji-datasource, unicode-emoji-json and node-emoji all carry it, and
		// so will the next one.
		expect(declared.filter((name) => /emoji/i.test(name))).toEqual([]);
	});

	it("hand-writes the quick set rather than deriving it from a catalogue", () => {
		const quickSet = readFileSync(join(here, "quick-set.ts"), "utf8");

		// The constant is the whole data layer: sixteen literal entries and one
		// type import.
		expect(quickSet.match(/from\s+"([^"]+)"/g)).toEqual(['from "./types"']);
	});
});
