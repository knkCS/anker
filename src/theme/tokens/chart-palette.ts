/**
 * The chart series palette: `chart.series.1` … `chart.series.6`.
 *
 * An ordered list of semantic colour tokens that `@knkcs/anker/charts` hands
 * to its series in turn, so a consumer never writes a chart colour. Each slot
 * is a semantic token with its own light and dark step — a raw step would not
 * follow dark mode — and both columns are *selected* for their mode's chart
 * surface (`bg-surface`: white / gray.800), not flipped automatically.
 *
 * The order is part of the palette, not decoration: it was chosen so that
 * every pair of neighbouring slots stays apart under protanopia and
 * deuteranopia as well as with full colour vision (OKLab ΔE, the data-viz
 * validator's adjacent-pair gate), and every slot reaches 3:1 against the
 * chart surface in both modes. `chart-palette.test.ts` pins the contrast and
 * the distinctness; change a step only together with that test.
 *
 * Status hues (`success`, `warning`, `danger`) are left out on purpose: a series must
 * never read as a status by accident. A series that *means* a status takes a
 * tone instead (see `CHART_TONES` in `@knkcs/anker/charts`).
 */

/** One slot: the colour step it paints in light mode and in dark mode. */
interface SeriesSlot {
	hue: string;
	light: string;
	dark: string;
}

export const CHART_SERIES_SLOTS: readonly SeriesSlot[] = [
	{ hue: "blue", light: "primary.600", dark: "primary.400" },
	{ hue: "orange", light: "secondary.500", dark: "secondary.500" },
	{ hue: "teal", light: "teal.600", dark: "teal.600" },
	{ hue: "purple", light: "purple.500", dark: "purple.500" },
	{ hue: "pink", light: "pink.600", dark: "pink.500" },
	{ hue: "cyan", light: "cyan.600", dark: "cyan.600" },
];

/** How many series the palette colours before a chart must fold the rest. */
export const CHART_SERIES_PALETTE_SIZE = CHART_SERIES_SLOTS.length;

/** The semantic token names of the palette, in order: `chart.series.1` … */
export const CHART_SERIES_TOKENS: readonly string[] = CHART_SERIES_SLOTS.map(
	(_, i) => `chart.series.${i + 1}`,
);

/** The palette as semantic tokens — spread into `semanticTokens.colors.chart`. */
export const chartSeriesTokens = {
	series: Object.fromEntries(
		CHART_SERIES_SLOTS.map((slot, i) => [
			String(i + 1),
			{
				value: {
					base: `{colors.${slot.light}}`,
					_dark: `{colors.${slot.dark}}`,
				},
			},
		]),
	),
};
