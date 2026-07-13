import { defineRecipe } from "@chakra-ui/react";

/**
 * Chakra v3's `Input` is a SINGLE-PART component: it resolves the plain
 * `recipes.input`, and `InputAddon` resolves `recipes.inputAddon`. The
 * previous v2-style `defineSlotRecipe({ slots: ["field", "addon"] })`
 * registered under `slotRecipes.input` was never read by v3 — the
 * registration was dead, Chakra's default (`outline` with
 * `bg: "transparent"`) applied, and every text input rendered transparent
 * on non-white surfaces (#153). Styles below are unchanged from the old
 * recipe; only their registration moved. The composed system deep-merges
 * this over Chakra's default input recipe (borders, sizes, focus ring
 * plumbing come from there), exactly like `textarea` always has.
 *
 * FIX (kept from the original Core port): `blue.500`/`blue.600` references
 * replaced with `primary.500`/`primary.600`.
 */
export const inputTheme = defineRecipe({
	variants: {
		variant: {
			outline: {
				borderRadius: "md",
				bg: { base: "white", _dark: "gray.800" },
				_hover: { borderColor: { base: "gray.300", _dark: "gray.600" } },
				_focus: {
					borderColor: { base: "primary.700", _dark: "primary.300" },
					boxShadow: "0px 0px 0px 1px var(--chakra-colors-primary-700)",
				},
			},
			"outline-on-accent": {
				bg: { base: "white", _dark: "gray.800" },
				borderRadius: "md",
				color: { base: "gray.900", _dark: "gray.100" },
				borderWidth: "1px",
				borderColor: { base: "primary.50", _dark: "primary.800" },
				_placeholder: {
					color: { base: "gray.500", _dark: "gray.400" },
				},
				_hover: {
					borderColor: { base: "primary.100", _dark: "primary.700" },
				},
				_focus: {
					borderColor: { base: "primary.200", _dark: "primary.600" },
					boxShadow: "0px 0px 0px 1px var(--chakra-colors-primary-200)",
				},
			},
			filled: {
				bg: { base: "white", _dark: "gray.800" },
				_hover: {
					borderColor: { base: "gray.200", _dark: "gray.700" },
					bg: { base: "white", _dark: "gray.700" },
				},
				_focus: {
					borderColor: "accent",
					bg: { base: "white", _dark: "gray.800" },
				},
			},
			link: {
				background: "transparent",
				border: "none",
				boxShadow: "none",
				padding: 0,
				minHeight: "auto",
				color: "primary.700",
				textDecoration: "underline",
				cursor: "pointer",
				_hover: {
					color: "primary.800",
					textDecoration: "underline",
				},
				_focus: {
					boxShadow: "none",
					color: "primary.800",
				},
			},
		},
		size: {
			lg: {
				fontSize: "md",
				borderRadius: "md",
			},
		},
	},
	defaultVariants: {
		variant: "outline",
		colorPalette: "gray" as never,
	},
});

/**
 * Addon styles — Chakra v3 keeps `InputAddon` a separate plain recipe
 * (`recipes.inputAddon`). Carries the old `addon` slot styles unchanged.
 */
export const inputAddonTheme = defineRecipe({
	variants: {
		variant: {
			outline: {
				borderRadius: "md",
				bg: { base: "gray.50", _dark: "gray.700" },
			},
		},
	},
});
