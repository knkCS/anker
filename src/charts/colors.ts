// How a chart turns a series into a colour: the CSS variable of a semantic
// token, never a hex and never a raw step — so the colour follows dark mode
// and a theme change without the chart knowing.
import {
	CHART_SERIES_PALETTE_SIZE,
	CHART_SERIES_TOKENS,
} from "../theme/tokens/chart-palette";
import type { ChartTone } from "./types";

export { CHART_SERIES_PALETTE_SIZE };

/** Every tone a series can take, in the order the docs list them. */
export const CHART_TONES: readonly ChartTone[] = [
	"accent",
	"success",
	"warning",
	"danger",
	"info",
	"neutral",
];

/**
 * The token each tone paints with. The status tones use their palette's `fg`
 * step — the one pinned for AA on `bg-surface` in both modes — because a
 * chart line sits on the surface like text does; `solid` is a fill for text
 * to sit on and fades into a dark surface.
 */
const TONE_TOKENS: Record<ChartTone, string> = {
	accent: "accent",
	success: "success.fg",
	warning: "warning.fg",
	danger: "danger.fg",
	info: "info.fg",
	neutral: "subtle",
};

/** The CSS variable of an anker colour token: `success.fg` → `var(--chakra-colors-success-fg)`. */
export function tokenColor(token: string): string {
	return `var(--chakra-colors-${token.replace(/\./g, "-")})`;
}

/**
 * The colour of palette slot `index` (0-based). Past the palette's end the
 * series is painted neutral — a seventh hue would be indistinguishable — and
 * the chart should fold the rest into an "Other" series instead.
 */
export function chartSeriesColor(index: number): string {
	const token = CHART_SERIES_TOKENS[index];
	return tokenColor(token ?? TONE_TOKENS.neutral);
}

/** The colour of a tone. */
export function chartToneColor(tone: ChartTone): string {
	return tokenColor(TONE_TOKENS[tone]);
}

/** The colour of the series at `index`: its tone if it has one, else its slot. */
export function resolveSeriesColor(
	series: { tone?: ChartTone },
	index: number,
): string {
	return series.tone ? chartToneColor(series.tone) : chartSeriesColor(index);
}
