// Pins anker#200's charter clause to the three things that could break it: a
// transport reaching into a component, a new package arriving to carry one,
// and an endpoint or credential being named. LookupSelect owns async
// *orchestration* — debounce, cancellation, stale guarding, paging — and calls
// Consumer-supplied functions to do the actual talking. The moment anything
// here opens a connection of its own the library has a backend, and anker does
// not have a backend. See docs/adr/0002-atoms-may-orchestrate-async.md.
//
// The transport scan covers the whole of src/ rather than one file. Scoping it
// to lookup-select.tsx would be bypassed by the first `import { get } from
// "./transport"` — and the charter was never about one component anyway.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Resolved from this file rather than `process.cwd()`, so the suite reads the
// same sources however vitest was invoked. Built with `dirname`/`resolve`
// rather than `new URL(…, import.meta.url)`, which Vite rewrites into an /@fs/
// URL that `fileURLToPath` then rejects.
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const srcRoot = join(repoRoot, "src");

const lookupSelect = readFileSync(join(here, "lookup-select.tsx"), "utf8");

const pkg = JSON.parse(
	readFileSync(join(repoRoot, "package.json"), "utf8"),
) as {
	dependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
};

/** Every shipped source file: no tests, no stories, no docs. */
function shippedSources(dir: string): string[] {
	return readdirSync(dir).flatMap((entry) => {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) return shippedSources(full);
		if (!/\.tsx?$/.test(entry)) return [];
		if (/\.(test|stories)\.tsx?$/.test(entry)) return [];
		return [full];
	});
}

const TRANSPORTS: [string, RegExp][] = [
	["fetch(", /\bfetch\s*\(/],
	["XMLHttpRequest", /\bXMLHttpRequest\b/],
	["WebSocket", /\bWebSocket\b/],
	["EventSource", /\bEventSource\b/],
	["sendBeacon", /\bnavigator\.sendBeacon\b/],
];

describe("anker never fetches (#200)", () => {
	it("finds the sources it is meant to be guarding", () => {
		// Without this the whole suite passes vacuously if files move.
		const files = shippedSources(srcRoot);
		expect(files.length).toBeGreaterThan(100);
		expect(
			files.some((f) => f.endsWith("/atoms/select/lookup-select.tsx")),
		).toBe(true);
		expect(lookupSelect).toContain("export const LookupSelect");
	});

	it("opens no transport anywhere in src/", () => {
		const offenders = shippedSources(srcRoot).flatMap((file) =>
			TRANSPORTS.filter(([, pattern]) =>
				pattern.test(readFileSync(file, "utf8")),
			).map(([name]) => `${file.slice(repoRoot.length + 1)}: ${name}`),
		);

		expect(offenders).toEqual([]);
	});

	it("names no endpoint and no credential in the select module", () => {
		const suspects: [string, RegExp][] = [
			["absolute URL", /https?:\/\//],
			["Authorization", /\bAuthorization\b/],
			["Bearer", /\bBearer\b/],
			["apiKey", /\bapi[_-]?key\b/i],
			["/api/ path", /\/api\//],
		];

		const offenders = shippedSources(here).flatMap((file) =>
			suspects
				.filter(([, pattern]) => pattern.test(readFileSync(file, "utf8")))
				.map(([name]) => `${file.slice(repoRoot.length + 1)}: ${name}`),
		);

		expect(offenders).toEqual([]);
	});

	it("lets LookupSelect import nothing but React, the select vendor, lodash.debounce and anker itself", () => {
		const allowed = new Set([
			"react",
			"chakra-react-select",
			"lodash.debounce",
		]);

		// Covers `import … from "x"`, `export … from "x"` and both quote styles.
		const specifiers = Array.from(
			lookupSelect.matchAll(/from\s+["']([^"']+)["']/g),
			(match) => match[1],
		);

		expect(specifiers.length).toBeGreaterThan(0);
		expect(
			specifiers
				.filter((module) => !module.startsWith("."))
				.filter((module) => !allowed.has(module)),
		).toEqual([]);
	});

	it("reaches for no module at run time", () => {
		// A dynamic import or a require is how a transport arrives without
		// showing up in the static import list above.
		expect(/\bimport\s*\(/.test(lookupSelect)).toBe(false);
		expect(/\brequire\s*\(/.test(lookupSelect)).toBe(false);
	});

	it("adds no HTTP client to anker's own dependencies", () => {
		const declared = [
			...Object.keys(pkg.dependencies ?? {}),
			...Object.keys(pkg.peerDependencies ?? {}),
		];

		expect(declared.length).toBeGreaterThan(0);
		// Name-shaped rather than a fixed blocklist: axios, ky, got,
		// node-fetch, cross-fetch, superagent and swr all carry a transport,
		// and so will the next one.
		const clients =
			/^(axios|ky|got|superagent|swr|node-fetch|cross-fetch|isomorphic-fetch|@tanstack\/react-query|graphql-request|urql|@apollo\/client)$/;

		expect(declared.filter((name) => clients.test(name))).toEqual([]);
	});
});
