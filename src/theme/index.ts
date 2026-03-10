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
	fonts,
	radii,
	semanticTokens,
	space,
	textStyles,
} from "./tokens";

const system = createSystem(defaultConfig, {
	globalCss: {
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
	},

	theme: {
		tokens: {
			colors,
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
		},

		textStyles,
		semanticTokens,

		recipes: {
			button,
			container,
			separator,
			formLabel,
			textarea,
			tooltip,
			tsRadioCard,
			tsProperty,
			treeItem,
			tag,
		},

		slotRecipes: {
			card,
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

// Re-export all tokens and utilities for consumer overrides
export {
	colors,
	fonts,
	radii,
	semanticTokens,
	space,
	textStyles,
} from "./tokens";
export { getColor, transparentize } from "./utils";
