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
						borderColor: { base: "primary.500", _dark: "primary.200" },
						boxShadow: "0px 0px 0px 1px var(--chakra-colors-primary-500)",
					},
				},
				addon: {
					borderRadius: "md",
					bg: { base: "gray.50", _dark: "gray.700" },
				},
			},
			"outline-on-accent": {
				field: {
					bg: "white",
					borderRadius: "md",
					color: "gray.900",
					borderWidth: "1px",
					borderColor: "primary.50",
					_placeholder: {
						color: "gray.500",
					},
					_hover: {
						borderColor: "primary.100",
					},
					_focus: {
						borderColor: "primary.200",
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
					color: "primary.500",
					textDecoration: "underline",
					cursor: "pointer",
					_hover: {
						color: "primary.600",
						textDecoration: "underline",
					},
					_focus: {
						boxShadow: "none",
						color: "primary.600",
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
