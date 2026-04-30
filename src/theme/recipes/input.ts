import { defineSlotRecipe } from "@chakra-ui/react";

/**
 * FIX: Replaced `blue.500` / `blue.600` references with `primary.500` / `primary.600`.
 * The Core monolith's input recipe used raw `blue.*` references in the link variant
 * which should reference the `primary` palette instead.
 */
export const inputSlotRecipe = defineSlotRecipe({
	slots: ["field", "addon"],
	variants: {
		variant: {
			outline: {
				field: {
					borderRadius: "md",
					bg: { base: "white", _dark: "gray.800" },
					_hover: { borderColor: { base: "gray.300", _dark: "gray.600" } },
					_focus: {
						borderColor: { base: "primary.700", _dark: "primary.300" },
						boxShadow: "0px 0px 0px 1px var(--chakra-colors-primary-700)",
					},
				},
				addon: {
					borderRadius: "md",
					bg: { base: "gray.50", _dark: "gray.700" },
				},
			},
			"outline-on-accent": {
				field: {
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
			},
			filled: {
				field: {
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
			},
			link: {
				field: {
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
		},
		size: {
			lg: {
				field: {
					fontSize: "md",
					borderRadius: "md",
				},
			},
		},
	},
	defaultVariants: {
		variant: "outline",
		colorPalette: "gray",
	},
});

export default inputSlotRecipe;
