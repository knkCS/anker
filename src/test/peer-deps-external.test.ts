// Pins tsup's `external` list to package.json's `peerDependencies`.
//
// Guards #743: `@dnd-kit/*` shipped as bundled dependencies, so a project
// using anker and fieldkit together — which fieldkit's Virtual Table makes the
// normal case — loaded two dnd-kit runtimes. Two dnd-kit copies do not share a
// DndContext, so a drag started under one is invisible to the other.
//
// A peer that is missing from `external` is silently inlined into `dist`: the
// build succeeds, the tests pass, and the duplicate only appears in a
// consumer's bundle. This test is the cheap place to catch that.
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Resolved from this file rather than `process.cwd()`, so the suite reads the
// same files however vitest was invoked — see peer-deps-docs.test.ts.
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const pkg = JSON.parse(
	readFileSync(join(repoRoot, "package.json"), "utf8"),
) as {
	peerDependencies: Record<string, string>;
	dependencies: Record<string, string>;
};

/**
 * Reads the string literals of `external: [...]` out of tsup.config.ts.
 *
 * The config is read as text rather than imported: importing it pulls in tsup
 * and evaluates `defineConfig`, which is a lot of machinery for a list of
 * strings, and would make this test fail for reasons that have nothing to do
 * with the list.
 */
function readExternals(): string[] {
	const config = readFileSync(join(repoRoot, "tsup.config.ts"), "utf8");
	const block = config.match(/external:\s*\[([\s\S]*?)\]/);
	if (!block) throw new Error("tsup.config.ts has no `external: [...]` array");
	return [...block[1].matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);
}

describe("tsup external list", () => {
	const externals = readExternals();

	it("parses a non-empty list", () => {
		expect(externals.length).toBeGreaterThan(0);
	});

	it("externalizes every declared peer dependency", () => {
		// A subpath entry (`react-grid-layout/legacy`) covers its own specifier;
		// the bare package name must be listed in its own right.
		const missing = Object.keys(pkg.peerDependencies).filter(
			(peer) => !externals.includes(peer),
		);
		expect(missing).toEqual([]);
	});

	it("declares no package as both a peer and a bundled dependency", () => {
		const both = Object.keys(pkg.peerDependencies).filter(
			(peer) => peer in (pkg.dependencies ?? {}),
		);
		expect(both).toEqual([]);
	});
});
