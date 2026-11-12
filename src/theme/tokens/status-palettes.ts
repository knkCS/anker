/**
 * Status palettes: `success`, `warning`, `danger`, `info`.
 *
 * Chakra v3's `colorPalette` prop does not read a raw scale — it reads a
 * fixed set of per-palette semantic tokens (`colors.<palette>.solid`, `.fg`,
 * …). Without them `colorPalette="warning"` resolves to nothing and the
 * component falls back to gray. This module defines those tokens for anker's
 * four status palettes, on anker's own raw scales (`colors.ts`), in light
 * and dark mode.
 *
 * What each palette means (see `docs/page-patterns.md` §11):
 * - `success` — done, healthy, passed.
 * - `warning` — needs attention soon, degraded, at risk.
 * - `danger`  — failed, error, broken. A *status*, not an action: a
 *   destructive action (delete, revoke) keeps `colorPalette="red"`.
 * - `info`    — neutral notice, in progress, informational.
 *
 * The step choices are pinned for WCAG AA in `status-palettes.test.ts`
 * (`fg` on `subtle`, `contrast` on `solid`, `fg` and `border` on
 * `bg-surface`), so change a step only together with that test.
 */

export const STATUS_PALETTES = [
	"success",
	"warning",
	"danger",
	"info",
] as const;

export type StatusPalette = (typeof STATUS_PALETTES)[number];

/** The per-palette semantic tokens Chakra v3's `colorPalette` reads. */
export const PALETTE_TOKEN_KEYS = [
	"solid",
	"contrast",
	"fg",
	"muted",
	"subtle",
	"emphasized",
	"focusRing",
	"border",
] as const;

type Step = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

/** Light-mode step, dark-mode step. */
type Steps = readonly [light: Step, dark: Step];

type PaletteSteps = Record<(typeof PALETTE_TOKEN_KEYS)[number], Steps>;

// One shape for all four: tinted surfaces at 100/200/300 in light and
// 900/800/700 in dark, fg at 700 / 300, border at 600 / 400, and the
// palette's lightest step (50) as text on `solid`. `solid` (and the focus
// ring that follows it) is 700: the brightest step that carries the tinted
// contrast text at AA for emerald, amber and red alike (red 600 misses it by
// a hair). Only `info` differs in dark mode, mirroring `primary`, whose dark
// solid is 500 so the action colour stays visible on a dark canvas.
const shape = (solid: Steps): PaletteSteps => ({
	solid,
	contrast: [50, 50],
	fg: [700, 300],
	muted: [200, 800],
	subtle: [100, 900],
	emphasized: [300, 700],
	focusRing: solid,
	border: [600, 400],
});

const STEPS: Record<StatusPalette, PaletteSteps> = {
	success: shape([700, 700]),
	warning: shape([700, 700]),
	danger: shape([700, 700]),
	info: shape([700, 500]),
};

function paletteTokens(palette: StatusPalette) {
	const tokens: Record<string, { value: { base: string; _dark: string } }> = {};
	for (const key of PALETTE_TOKEN_KEYS) {
		const [light, dark] = STEPS[palette][key];
		tokens[key] = {
			value: {
				base: `{colors.${palette}.${light}}`,
				_dark: `{colors.${palette}.${dark}}`,
			},
		};
	}
	return tokens;
}

/**
 * The palette semantic tokens of every status palette, keyed by palette —
 * spread into `semanticTokens.colors`.
 */
export const statusPaletteTokens = Object.fromEntries(
	STATUS_PALETTES.map((palette) => [palette, paletteTokens(palette)]),
) as Record<StatusPalette, ReturnType<typeof paletteTokens>>;
