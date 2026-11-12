// src/components/context-rail/status-icon.test.tsx
//
// ContextRail.StatusIcon draws its tint from anker's status palettes
// (`colorPalette` + `colorPalette.subtle` / `colorPalette.fg`), so it follows
// the theme in light and dark mode. The legacy tone names are aliases.
//
// The rendering assertions read the CSS text Chakra emitted for the circle's
// generated class (jsdom cannot resolve Chakra's layered stylesheets or CSS
// variables through `getComputedStyle`). The light / dark assertions resolve
// the palette tokens that CSS points at down to hex with the shared
// colour-token helpers.
import { ChakraProvider } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	AA_NON_TEXT,
	AA_TEXT,
	type ColorMode,
	contrastRatio,
	resolveColor,
} from "../../test/color-tokens";
import system from "../../theme";
import { ContextRail } from "./context-rail";

const PALETTE_TONES = {
	success: "success",
	warning: "warning",
	danger: "danger",
	info: "info",
	neutral: "gray",
} as const;

const LEGACY_ALIASES = {
	green: "success",
	amber: "warning",
	red: "danger",
	gray: "neutral",
} as const;

type Tone = keyof typeof PALETTE_TONES | keyof typeof LEGACY_ALIASES;

const MODES: ColorMode[] = ["light", "dark"];
const LAYOUTS = ["expanded", "collapsed"] as const;
type Layout = (typeof LAYOUTS)[number];

function setLayout(layout: Layout) {
	Object.defineProperty(window, "innerWidth", {
		value: layout === "expanded" ? 1600 : 1024,
		configurable: true,
	});
}

/** Render one StatusIcon and return its tinted circle. */
function renderCircle(tone: Tone, layout: Layout): HTMLElement {
	setLayout(layout);
	render(
		<ChakraProvider value={system}>
			<ContextRail>
				<ContextRail.StatusIcon
					tone={tone}
					icon={<span data-testid="ico">i</span>}
					label="MFA: Active"
				/>
			</ContextRail>
		</ChakraProvider>,
	);
	return screen.getByTestId("ico").parentElement as HTMLElement;
}

function rulesFor(element: HTMLElement): string {
	const generated = element.className
		.split(" ")
		.filter((name) => name.startsWith("css-"));
	if (generated.length === 0) {
		throw new Error("element carries no generated class");
	}
	return Array.from(document.querySelectorAll("style"))
		.flatMap((tag) => (tag.textContent ?? "").split("\n"))
		.filter((line) => generated.some((name) => line.includes(`.${name}`)))
		.join("\n");
}

const cssVar = (path: string) =>
	`var(--chakra-colors-${path.replace(/\./g, "-")})`;

describe("ContextRail.StatusIcon — status palette tones", () => {
	beforeEach(() => localStorage.clear());
	afterEach(() => localStorage.clear());

	for (const layout of LAYOUTS) {
		for (const [tone, palette] of Object.entries(PALETTE_TONES)) {
			it(`${tone} (${layout}) tints with the ${palette} palette's subtle / fg tokens`, () => {
				const rules = rulesFor(renderCircle(tone as Tone, layout));
				expect(rules).toContain(
					`--chakra-colors-color-palette-subtle:${cssVar(`${palette}.subtle`)}`,
				);
				expect(rules).toContain(
					`--chakra-colors-color-palette-fg:${cssVar(`${palette}.fg`)}`,
				);
				expect(rules).toContain(
					"background:var(--chakra-colors-color-palette-subtle)",
				);
				expect(rules).toContain("color:var(--chakra-colors-color-palette-fg)");
			});
		}

		for (const [legacy, tone] of Object.entries(LEGACY_ALIASES)) {
			it(`legacy ${legacy} (${layout}) renders identically to ${tone}`, () => {
				const aliased = renderCircle(legacy as Tone, layout);
				const aliasedClass = aliased.className;
				const aliasedRules = rulesFor(aliased);
				document.body.innerHTML = "";
				const canonical = renderCircle(tone as Tone, layout);
				expect(aliasedClass).toBe(canonical.className);
				expect(aliasedRules).toBe(rulesFor(canonical));
			});
		}

		it(`no raw green / yellow / red scale reaches the circle (${layout})`, () => {
			for (const tone of [
				...Object.keys(PALETTE_TONES),
				...Object.keys(LEGACY_ALIASES),
			]) {
				document.body.innerHTML = "";
				const rules = rulesFor(renderCircle(tone as Tone, layout));
				expect(rules, tone).not.toMatch(/colors-(green|yellow|red)-/);
			}
		});
	}

	it("keeps the label in the expanded row and only in the tooltip when collapsed", () => {
		renderCircle("success", "expanded");
		expect(screen.getByText("MFA: Active")).toBeInTheDocument();
		document.body.innerHTML = "";
		renderCircle("success", "collapsed");
		expect(screen.queryByText("MFA: Active")).not.toBeInTheDocument();
		expect(screen.getByLabelText("MFA: Active")).toBeInTheDocument();
	});
});

describe("ContextRail.StatusIcon — tints in light and dark mode", () => {
	for (const [tone, palette] of Object.entries(PALETTE_TONES)) {
		for (const mode of MODES) {
			const c = (name: string) => resolveColor(system, name, mode);

			it(`${tone} ${mode}: the icon stays legible on its tint`, () => {
				// The icon is a glyph, so the non-text minimum applies; anker's
				// status palettes clear the text minimum anyway.
				const ratio = contrastRatio(c(`${palette}.fg`), c(`${palette}.subtle`));
				expect(ratio).toBeGreaterThanOrEqual(
					palette === "gray" ? AA_NON_TEXT : AA_TEXT,
				);
			});

			it(`${tone} ${mode}: the tint follows the colour mode`, () => {
				const other: ColorMode = mode === "light" ? "dark" : "light";
				expect(c(`${palette}.subtle`)).not.toBe(
					resolveColor(system, `${palette}.subtle`, other),
				);
			});
		}
	}
});
