// Pins CLAUDE.md's "## Peer Dependencies" list to package.json's
// `peerDependencies`. Guards #174: the list still advertised React >= 18 long
// after 4.0.0 raised the floor to >= 19, so an agent reading CLAUDE.md would
// have treated React 18 as a supported target — the exact failure 4.0.0 closed.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Vitest resolves its root from vitest.config.ts, so the suite runs with the
// repo root as cwd (`import.meta.url` is an http:// URL under the jsdom env).
const repoRoot = process.cwd();

const pkg = JSON.parse(
	readFileSync(join(repoRoot, "package.json"), "utf8"),
) as {
	peerDependencies: Record<string, string>;
	peerDependenciesMeta?: Record<string, { optional?: boolean }>;
};

type DocumentedPeer = { range: string; qualifier: string | undefined };

/**
 * Reads the bullet list under CLAUDE.md's "## Peer Dependencies" heading.
 * Each entry is `- <name> <range>` with an optional ` (<qualifier>)` tail,
 * e.g. `- react-grid-layout ^2.2.3 (optional — required only for …)`.
 */
function parseDocumentedPeers(): Map<string, DocumentedPeer> {
	const claudeMd = readFileSync(join(repoRoot, "CLAUDE.md"), "utf8");
	const section = claudeMd.match(/^## Peer Dependencies$([\s\S]*?)^## /m);
	if (!section)
		throw new Error("CLAUDE.md has no '## Peer Dependencies' section");

	const peers = new Map<string, DocumentedPeer>();
	for (const line of section[1].split("\n")) {
		const entry = line.match(/^- (\S+) ([^(]+?)(?:\s+\((.+)\))?$/);
		if (entry) peers.set(entry[1], { range: entry[2], qualifier: entry[3] });
	}
	return peers;
}

// Ranges are written with a space in prose (`>= 19`) and without in JSON
// (`>=19`); only the constraint itself is being compared.
const normalizeRange = (range: string) => range.replace(/\s+/g, "");

const isOptional = (name: string) =>
	pkg.peerDependenciesMeta?.[name]?.optional === true;

describe("CLAUDE.md peer dependency list", () => {
	const documented = parseDocumentedPeers();

	it("documents exactly the peers package.json declares", () => {
		expect([...documented.keys()].sort()).toEqual(
			Object.keys(pkg.peerDependencies).sort(),
		);
	});

	it.each(
		Object.entries(pkg.peerDependencies),
	)("documents %s as %s", (name, range) => {
		expect(normalizeRange(documented.get(name)?.range ?? "")).toBe(
			normalizeRange(range),
		);
	});

	it.each(
		Object.keys(pkg.peerDependencies),
	)("marks %s optional only when it is", (name) => {
		const claimsOptional = /optional/i.test(
			documented.get(name)?.qualifier ?? "",
		);
		expect(claimsOptional).toBe(isOptional(name));
	});
});
