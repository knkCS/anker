import type { SystemConfig } from "@chakra-ui/react";

/**
 * A theme preset provides optional overrides for token layers.
 * Each field maps to a section of the Chakra theme config.
 * Undefined fields inherit from the base Anker theme.
 */
export interface ThemePreset {
	/** Human-readable preset name (e.g., "vibrant", "editorial") */
	name: string;

	/** Override raw color tokens */
	colors?: SystemConfig["theme"] extends infer T
		? T extends { tokens?: { colors?: infer C } }
			? C
			: never
		: never;

	/** Override semantic tokens (shadows, colors, opacity) */
	semanticTokens?: SystemConfig["theme"] extends infer T
		? T extends { semanticTokens?: infer S }
			? S
			: never
		: never;

	/** Override text style presets */
	textStyles?: Record<
		string,
		{
			fontSize?: string;
			lineHeight?: string;
			letterSpacing?: string;
			fontWeight?: string;
			textTransform?: string;
		}
	>;

	/** Override font families */
	fonts?: { heading?: string; body?: string };

	/** Override border radii */
	radii?: Record<string, string>;

	/** Override duration tokens */
	durations?: Record<string, { value: string }>;

	/** Override easing tokens */
	easings?: Record<string, { value: string }>;
}
