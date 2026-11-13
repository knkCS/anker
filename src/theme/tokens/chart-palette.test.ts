// The chart series palette (#328) is validated against the chart surface in
// both modes: every slot is a semantic token with its own light and dark step,
// reaches 3:1 (WCAG non-text) on `bg-surface`, and differs from its
// neighbours — so two adjacent lines never paint alike.
import { describe, expect, it } from "vitest";
import {
	AA_NON_TEXT,
	type ColorMode,
	contrastRatio,
	resolveColor,
	semanticConditions,
} from "../../test/color-tokens";
import system from "../index";
import {
	CHART_SERIES_PALETTE_SIZE,
	CHART_SERIES_TOKENS,
} from "./chart-palette";

const MODES: ColorMode[] = ["light", "dark"];

/** OKLab of an sRGB hex colour, ×100 so ΔE reads like the data-viz validator. */
function oklab(hex: string): [number, number, number] {
	const lin = [1, 3, 5].map((i) => {
		const v = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
		return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
	});
	const [r, g, b] = lin;
	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
	return [
		100 * (0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s),
		100 * (1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s),
		100 * (0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s),
	];
}

function deltaE(a: string, b: string): number {
	const [l1, a1, b1] = oklab(a);
	const [l2, a2, b2] = oklab(b);
	return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

describe("chart series palette", () => {
	it("is an ordered list of six semantic tokens", () => {
		expect(CHART_SERIES_PALETTE_SIZE).toBe(6);
		expect(CHART_SERIES_TOKENS).toEqual([
			"chart.series.1",
			"chart.series.2",
			"chart.series.3",
			"chart.series.4",
			"chart.series.5",
			"chart.series.6",
		]);
	});

	it.each(
		CHART_SERIES_TOKENS,
	)("%s has a light and a dark step, both colour references", (token) => {
		const conditions = semanticConditions(system, token);
		expect(conditions?.base).toMatch(/^\{colors\.[a-z]+\.\d+\}$/);
		expect(conditions?._dark).toMatch(/^\{colors\.[a-z]+\.\d+\}$/);
	});

	it("is emitted as a CSS variable a chart can paint with", () => {
		expect(system.token.var("colors.chart.series.1")).toBe(
			"var(--chakra-colors-chart-series-1)",
		);
	});

	describe.each(MODES)("in %s mode", (mode) => {
		const surface = resolveColor(system, "bg-surface", mode);
		const paint = CHART_SERIES_TOKENS.map((t) => resolveColor(system, t, mode));

		it.each(
			CHART_SERIES_TOKENS.map((t, i) => [t, i] as const),
		)("%s reaches 3:1 against the chart surface", (_, i) => {
			expect(contrastRatio(paint[i], surface)).toBeGreaterThanOrEqual(
				AA_NON_TEXT,
			);
		});

		it("paints six different colours", () => {
			expect(new Set(paint).size).toBe(CHART_SERIES_PALETTE_SIZE);
		});

		it("keeps neighbouring slots apart (OKLab ΔE ≥ 15)", () => {
			for (let i = 1; i < paint.length; i++) {
				expect(
					deltaE(paint[i - 1], paint[i]),
					`${CHART_SERIES_TOKENS[i - 1]} ↔ ${CHART_SERIES_TOKENS[i]}`,
				).toBeGreaterThanOrEqual(15);
			}
		});

		it("never paints a series in a status colour", () => {
			const status = [
				"success.solid",
				"danger.solid",
				"success.fg",
				"danger.fg",
			].map((t) => resolveColor(system, t, mode));
			for (const p of paint) expect(status).not.toContain(p);
		});
	});
});
