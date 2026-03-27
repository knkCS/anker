import {
	createSystem,
	defaultConfig,
	defineSlotRecipe,
} from "@chakra-ui/react";
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
	colors,
	durations,
	easings,
	fonts,
	keyframes,
	radii,
	semanticTokens,
	space,
	textStyles,
	zIndex,
} from "./tokens";

const system = createSystem(defaultConfig, {
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

export type CustomTheme = typeof system;

export default system;

export { createAnkerTheme } from "./create-theme";
export type { ThemePreset } from "./presets";
export { defaultPreset } from "./presets";
// Re-export all tokens and utilities for consumer overrides
export {
	colors,
	durations,
	easings,
	fonts,
	keyframes,
	radii,
	semanticTokens,
	space,
	textStyles,
	zIndex,
} from "./tokens";
export { getColor, transparentize } from "./utils";
