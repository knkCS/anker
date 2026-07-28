// Pins CLAUDE.md's "## Peer Dependencies" list to package.json's
// `peerDependencies`. Guards #174: the list still advertised React >= 18 long
// after 4.0.0 raised the floor to >= 19, so an agent reading CLAUDE.md would
// have treated React 18 as a supported target — the exact failure 4.0.0 closed.
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Resolved from this file, not from `process.cwd()`, so the suite reads the
// same docs however vitest was invoked. Note the paths are built with
// `dirname`/`resolve`: Vite statically rewrites the literal
// `new URL("…", import.meta.url)` asset pattern into an http://localhost/@fs/
// URL, which `fileURLToPath` then rejects.
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const pkg = JSON.parse(
	readFileSync(join(repoRoot, "package.json"), "utf8"),
) as {
	peerDependencies: Record<string, string>;
	peerDependenciesMeta?: Record<string, { optional?: boolean }>;
};

type DocumentedPeer = { range: string; qualifier: string | undefined };

// `- <name> <range>` with an optional ` (<qualifier>)` tail. The range is
// pinned to range syntax rather than "anything up to a bracket" so a bullet
// that grows unbracketed prose fails to parse instead of parsing wrongly.
const ENTRY = /^- (\S+) ((?:[\^~<>=]|\d)[\d.xX\s|<>=^~*-]*?)(?:\s+\((.+)\))?$/;

/**
 * Reads the bullet list under CLAUDE.md's "## Peer Dependencies" heading, e.g.
 * `- react-grid-layout ^2.2.3 (optional — required only for the Dashboard …)`.
 * Returns the parsed entries alongside any bullet it could not parse, so a
 * reshaped list reports itself rather than going silently unchecked.
 */
function readDocumentedPeers(): {
	peers: Map<string, DocumentedPeer>;
	unparsed: string[];
} {
	const lines = readFileSync(join(repoRoot, "CLAUDE.md"), "utf8").split("\n");
	const heading = lines.findIndex((line) =>
		/^## Peer Dependencies$/i.test(line),
	);
	if (heading === -1) {
		throw new Error("CLAUDE.md has no '## Peer Dependencies' section");
	}
	// The section runs to the next h2, or to the end of the file if it is last.
	const rest = lines.slice(heading + 1);
	const nextHeading = rest.findIndex((line) => line.startsWith("## "));
	const body = nextHeading === -1 ? rest : rest.slice(0, nextHeading);

	const peers = new Map<string, DocumentedPeer>();
	const unparsed: string[] = [];
	for (const line of body) {
		if (!line.startsWith("- ")) continue;
		const entry = line.match(ENTRY);
		if (!entry) {
			unparsed.push(line);
			continue;
		}
		// Tolerate `**react**` / `` `react` `` if the list ever gains markup.
		const name = entry[1].replace(/[`*]/g, "");
		peers.set(name, { range: entry[2], qualifier: entry[3] });
	}
	return { peers, unparsed };
}

// Ranges are written with a space in prose (`>= 19`) and without in JSON
// (`>=19`); only the constraint itself is being compared.
const normalizeRange = (range: string) => range.replace(/\s+/g, "");

describe("CLAUDE.md peer dependency list", () => {
	const { peers: documented, unparsed } = readDocumentedPeers();

	it("parses every bullet under the heading", () => {
		expect(unparsed).toEqual([]);
	});

	it("documents exactly the peers package.json declares", () => {
		expect([...documented.keys()].sort()).toEqual(
			Object.keys(pkg.peerDependencies).sort(),
		);
	});

	it.each(
		Object.entries(pkg.peerDependencies),
	)("documents %s as %s", (name, range) => {
		const entry = documented.get(name);
		expect(normalizeRange(entry?.range ?? "")).toBe(normalizeRange(range));

		// Optional peers lead their qualifier with "optional"; required ones
		// may carry a qualifier of their own, but must not claim optionality.
		const claimsOptional =
			entry?.qualifier?.toLowerCase().startsWith("optional") ?? false;
		expect(claimsOptional).toBe(
			pkg.peerDependenciesMeta?.[name]?.optional === true,
		);
	});
});
