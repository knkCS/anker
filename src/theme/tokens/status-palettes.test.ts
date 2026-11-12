import { describe, expect, it } from "vitest";
import {
	AA_NON_TEXT,
	AA_TEXT,
	type ColorMode,
	contrastRatio,
	resolveColor,
	semanticConditions,
} from "../../test/color-tokens";
import system from "../index";
import colors from "./colors";
import { PALETTE_TOKEN_KEYS, STATUS_PALETTES } from "./status-palettes";

const MODES: ColorMode[] = ["light", "dark"];

describe("status palettes — tokens Chakra's colorPalette reads", () => {
	for (const palette of STATUS_PALETTES) {
		for (const key of PALETTE_TOKEN_KEYS) {
			it(`${palette}.${key} has light and dark values on anker's ${palette} scale`, () => {
				const conditions = semanticConditions(system, `${palette}.${key}`);
				expect(conditions, `colors.${palette}.${key}`).toBeDefined();
				const scaleRef = new RegExp(`^\\{colors\\.${palette}\\.\\d+\\}$`);
				expect(conditions?.base).toMatch(scaleRef);
				expect(conditions?._dark).toMatch(scaleRef);
			});
		}

		it(`colorPalette="${palette}" maps every palette token to ${palette}'s own`, () => {
			const map = system.tokens.colorPaletteMap.get(palette);
			for (const key of PALETTE_TOKEN_KEYS) {
				const cssKey = key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
				expect(map?.get(`--chakra-colors-color-palette-${cssKey}`)).toBe(
					`var(--chakra-colors-${palette}-${cssKey})`,
				);
			}
		});
	}
});

describe("status palettes — the closed palette stays closed", () => {
	it("defines no colour scale beyond the existing ones", () => {
		expect(Object.keys(colors).sort()).toEqual(
			[
				"brand",
				"danger",
				"gray",
				"info",
				"primary",
				"secondary",
				"success",
				"warning",
			].sort(),
		);
	});

	// The original steps are the hue anchors; added steps must not move them.
	const ANCHORS: Record<string, Record<string, string>> = {
		success: {
			"50": "#ecfdf5",
			"100": "#d1fae5",
			"500": "#10b981",
			"600": "#059669",
			"700": "#047857",
		},
		warning: {
			"50": "#fffbeb",
			"100": "#fef3c7",
			"500": "#f59e0b",
			"600": "#d97706",
			"700": "#b45309",
		},
		danger: {
			"50": "#fef2f2",
			"100": "#fee2e2",
			"500": "#ef4444",
			"600": "#dc2626",
			"700": "#b91c1c",
		},
		info: {
			"50": "#eff6fc",
			"100": "#d9eafa",
			"500": "#2f6fbf",
			"600": "#1c5aa8",
			"700": "#134788",
		},
	};
	for (const palette of STATUS_PALETTES) {
		it(`keeps ${palette}'s original steps unchanged`, () => {
			const scale = colors[palette] as Record<string, { value: string }>;
			for (const [step, hex] of Object.entries(ANCHORS[palette])) {
				expect(scale[step]?.value).toBe(hex);
			}
		});
	}

	it("info stays the primary hue — every info step is the primary step", () => {
		const info = colors.info as Record<string, { value: string }>;
		const primary = colors.primary as Record<string, { value: string }>;
		for (const step of Object.keys(info)) {
			expect(info[step].value).toBe(primary[step].value);
		}
	});
});

describe("status palettes — the flat success token still resolves as before", () => {
	it("colors.success keeps green.600 / green.200", () => {
		expect(semanticConditions(system, "success")).toEqual({
			base: "{colors.green.600}",
			_dark: "{colors.green.200}",
		});
		expect(
			system.tokens.getByName("colors.success")?.extensions.cssVar,
		).toEqual({
			var: "--chakra-colors-success",
			ref: "var(--chakra-colors-success)",
		});
	});

	it("colors.success resolves to the same hex in both modes", () => {
		expect(resolveColor(system, "success", "light")).toBe(
			resolveColor(system, "green.600", "light"),
		);
		expect(resolveColor(system, "success", "dark")).toBe(
			resolveColor(system, "green.200", "dark"),
		);
	});

	it("colors.error is untouched", () => {
		expect(semanticConditions(system, "error")).toEqual({
			base: "{colors.red.600}",
			_dark: "{colors.red.200}",
		});
	});
});

describe("status palettes — WCAG AA contrast", () => {
	for (const palette of STATUS_PALETTES) {
		for (const mode of MODES) {
			const c = (name: string) => resolveColor(system, name, mode);

			it(`${palette} ${mode}: fg text on subtle ≥ ${AA_TEXT}:1`, () => {
				expect(
					contrastRatio(c(`${palette}.fg`), c(`${palette}.subtle`)),
				).toBeGreaterThanOrEqual(AA_TEXT);
			});

			it(`${palette} ${mode}: contrast text on solid ≥ ${AA_TEXT}:1`, () => {
				expect(
					contrastRatio(c(`${palette}.contrast`), c(`${palette}.solid`)),
				).toBeGreaterThanOrEqual(AA_TEXT);
			});

			// The outline variant sets fg text and a border on the surface below.
			it(`${palette} ${mode}: fg text on bg-surface ≥ ${AA_TEXT}:1`, () => {
				expect(
					contrastRatio(c(`${palette}.fg`), c("bg-surface")),
				).toBeGreaterThanOrEqual(AA_TEXT);
			});

			it(`${palette} ${mode}: border on bg-surface ≥ ${AA_NON_TEXT}:1`, () => {
				expect(
					contrastRatio(c(`${palette}.border`), c("bg-surface")),
				).toBeGreaterThanOrEqual(AA_NON_TEXT);
			});
		}
	}
});
