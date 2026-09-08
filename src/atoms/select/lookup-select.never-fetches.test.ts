// Pins anker#200's charter clause to the two things that could break it: a
// transport reaching into the component, and a new package arriving to carry
// one. LookupSelect owns async *orchestration* — debounce, cancellation, stale
// guarding, paging — and calls Consumer-supplied functions to do the actual
// talking. The moment it opens a connection of its own it has a backend, and
// anker does not have a backend. See docs/adr/0002-atoms-may-orchestrate-async.md.
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Resolved from this file rather than `process.cwd()`, so the suite reads the
// same source however vitest was invoked. Built with `dirname`/`resolve` rather
// than `new URL(…, import.meta.url)`, which Vite rewrites into an /@fs/ URL
// that `fileURLToPath` then rejects.
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");

const source = readFileSync(join(here, "lookup-select.tsx"), "utf8");

const pkg = JSON.parse(
	readFileSync(join(repoRoot, "package.json"), "utf8"),
) as {
	dependencies: Record<string, string>;
	peerDependencies: Record<string, string>;
};

describe("LookupSelect never fetches (#200)", () => {
	it("finds the source it is meant to be guarding", () => {
		// Without this the whole suite passes vacuously if the file is renamed.
		expect(source).toContain("export const LookupSelect");
	});

	it("opens no transport of its own", () => {
		const transports = [
			/\bfetch\s*\(/,
			/XMLHttpRequest/,
			/\bWebSocket\b/,
			/\bEventSource\b/,
			/navigator\.sendBeacon/,
			/\bimport\s*\(/,
		];

		expect(
			transports.filter((pattern) => pattern.test(source)).map(String),
		).toEqual([]);
	});

	it("names no endpoint and no credential", () => {
		const endpoints = [
			/https?:\/\//,
			/\bAuthorization\b/,
			/\bBearer\b/,
			/\bapiKey\b/i,
			/\/api\//,
		];

		expect(
			endpoints.filter((pattern) => pattern.test(source)).map(String),
		).toEqual([]);
	});

	it("imports nothing beyond React, the select vendor, lodash.debounce and anker itself", () => {
		const allowed = new Set([
			"react",
			"chakra-react-select",
			"lodash.debounce",
		]);

		const foreign = Array.from(
			source.matchAll(/from\s+"([^"]+)"/g),
			(m) => m[1],
		)
			.filter((module) => !module.startsWith("."))
			.filter((module) => !allowed.has(module));

		expect(foreign).toEqual([]);
	});

	it("adds no HTTP client to anker's own dependencies", () => {
		const declared = [
			...Object.keys(pkg.dependencies),
			...Object.keys(pkg.peerDependencies),
		];

		// Name-shaped rather than a fixed blocklist: axios, ky, got,
		// node-fetch, cross-fetch, superagent and swr all carry a transport,
		// and so will the next one.
		const clients =
			/^(axios|ky|got|superagent|swr|node-fetch|cross-fetch|isomorphic-fetch|@tanstack\/react-query|graphql-request)$/;

		expect(declared.filter((name) => clients.test(name))).toEqual([]);
	});
});
