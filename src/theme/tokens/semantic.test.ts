import { describe, expect, it } from "vitest";
import system from "../index";

/**
 * Regression test for the bare-string token bug.
 *
 * Pre-1.3, semantic tokens were declared as `{ value: { base: "gray.50" } }`.
 * Chakra v3 stored the literal `"gray.50"` into the emitted CSS variable —
 * `--chakra-colors-bg-canvas: gray.50` — which is invalid CSS, so consumers
 * fell back to `transparent` (for bg) and `currentColor` (for borders).
 *
 * Wrapping the reference in `{colors.X}` makes Chakra resolve the path and
 * emit a `var(--chakra-colors-X)` reference. We assert the tokenMap value
 * for each top-level semantic token starts with `var(` so the bug can't
 * regress silently.
 */

const SEMANTIC_TOKENS = [
	"bg-canvas",
	"bg-surface",
	"bg-subtle",
	"bg-muted",
	"default",
	"inverted",
	"emphasized",
	"muted",
	"subtle",
	"border",
	"border-muted",
	"accent",
	"success",
	"error",
	"bg-accent",
	"bg-accent-subtle",
	"bg-accent-muted",
];

describe("semantic tokens", () => {
	// biome-ignore lint/suspicious/noExplicitAny: probing Chakra v3 internals
	const tm = (system as any).tokens.tokenMap as Map<string, { value: string }>;

	for (const name of SEMANTIC_TOKENS) {
		it(`colors.${name} resolves to a var() reference (not a bare scale string)`, () => {
			const entry = tm.get(`colors.${name}`);
			expect(entry, `colors.${name} should be registered`).toBeDefined();
			// A correctly-braced reference resolves to `var(--chakra-colors-X)`.
			// A bare string like "gray.50" remains the literal "gray.50" — invalid CSS.
			expect(entry?.value, `colors.${name} resolves to a CSS var`).toMatch(
				/^var\(/,
			);
		});
	}
});
