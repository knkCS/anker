import {
	createSystem,
	defaultConfig,
	defineSlotRecipe,
} from "@chakra-ui/react";
import type { ThemePreset } from "./presets/types";
import {
	button,
	card,
	checkbox,
	comment,
	container,
	dialog,
	drawer,
	formLabel,
	input,
	menu,
	modal,
	persona,
	popover,
	prose,
	separator,
	stepper,
	table,
	tabs,
	tag,
	textarea,
	tooltip,
	treeItem,
	tsProperty,
	tsRadioCard,
} from "./recipes";
import {
	colors as baseColors,
	durations as baseDurations,
	easings as baseEasings,
	fonts as baseFonts,
	radii as baseRadii,
	semanticTokens as baseSemanticTokens,
	textStyles as baseTextStyles,
	keyframes,
	space,
	zIndex,
} from "./tokens";

/**
 * Creates an Anker theme system with optional preset overrides.
 * Without a preset (or with the default preset), this produces the
 * same system as the default export from `@knkcs/anker/theme`.
 *
 * @example
 * ```tsx
 * import { createAnkerTheme } from "@knkcs/anker/theme";
 * import type { ThemePreset } from "@knkcs/anker/theme";
 *
 * const myPreset: ThemePreset = { name: "custom", radii: { md: "0" } };
 * <Provider system={createAnkerTheme(myPreset)}>
 * ```
 */
export function createAnkerTheme(preset?: ThemePreset) {
	const fonts = {
		heading: preset?.fonts?.heading ?? baseFonts.heading,
		body: preset?.fonts?.body ?? baseFonts.body,
		mono: preset?.fonts?.mono ?? baseFonts.mono,
	};

	const colors = preset?.colors
		? { ...baseColors, ...preset.colors }
		: baseColors;

	const durations = preset?.durations
		? { ...baseDurations, ...preset.durations }
		: baseDurations;

	const easings = preset?.easings
		? { ...baseEasings, ...preset.easings }
		: baseEasings;

	const radii = preset?.radii ?? baseRadii;

	const textStyles = preset?.textStyles
		? { ...baseTextStyles, ...preset.textStyles }
		: baseTextStyles;

	const semanticTokens = preset?.semanticTokens
		? deepMerge(
				baseSemanticTokens,
				preset.semanticTokens as Partial<typeof baseSemanticTokens>,
			)
		: baseSemanticTokens;

	return createSystem(defaultConfig, {
		globalCss: {
			"@keyframes fadeIn": keyframes.fadeIn,
			"@keyframes fadeOut": keyframes.fadeOut,
			"@keyframes slideUp": keyframes.slideUp,
			"@keyframes slideDown": keyframes.slideDown,
			"@keyframes scaleIn": keyframes.scaleIn,
			body: {
				color: "default",
				bg: { base: "white", _dark: "#000" },
			},
			"*::placeholder": {
				opacity: 1,
				color: "muted",
			},
			"*, *::before, *::after": {
				borderColor: "border",
			},
			"table, td, th": {
				borderColor: "border",
			},
			"html, body": {
				height: "100%",
			},
			"#__next, #root, #app": {
				display: "flex",
				flexDirection: "column",
				minH: "100%",
			},
			"*": {
				_motionReduce: {
					animationDuration: "0.01ms !important",
					animationIterationCount: "1 !important",
					transitionDuration: "0.01ms !important",
					scrollBehavior: "auto !important",
				},
			},
		},

		theme: {
			tokens: {
				colors,
				durations,
				easings,
				fonts: {
					heading: { value: fonts.heading },
					body: { value: fonts.body },
					mono: { value: fonts.mono },
				},
				spacing: Object.fromEntries(
					Object.entries(space).map(([k, v]) => [k, { value: v }]),
				),
				radii: Object.fromEntries(
					Object.entries(radii).map(([k, v]) => [k, { value: v }]),
				),
				zIndex,
			},

			textStyles,
			semanticTokens,

			recipes: {
				button,
				container,
				prose,
				separator,
				formLabel,
				textarea,
				tooltip,
				tsRadioCard,
				tag,
			},

			slotRecipes: {
				card,
				tsProperty,
				treeItem,
				checkbox,
				comment,
				dialog,
				drawer,
				// Field.Root override: v3 defaults to alignItems: flex-start which
				// shrinks children. Restore v2 behavior where children stretch.
				field: defineSlotRecipe({
					slots: ["root"],
					variants: {
						orientation: {
							vertical: {
								root: {
									alignItems: "stretch",
								},
							},
						},
					},
				}),
				input,
				menu,
				modal,
				persona,
				popover,
				stepper,
				table,
				tabs,
			},
		},
	});
}

/** Deep-merge two objects (1 level deep for token groups). */
function deepMerge<T extends Record<string, unknown>>(
	base: T,
	override: Partial<T>,
): T {
	const result = { ...base };
	for (const key of Object.keys(override) as (keyof T)[]) {
		const baseVal = base[key];
		const overrideVal = override[key];
		if (
			baseVal &&
			overrideVal &&
			typeof baseVal === "object" &&
			typeof overrideVal === "object" &&
			!Array.isArray(baseVal)
		) {
			result[key] = { ...baseVal, ...overrideVal } as T[keyof T];
		} else if (overrideVal !== undefined) {
			result[key] = overrideVal as T[keyof T];
		}
	}
	return result;
}
