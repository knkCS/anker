import { defineRecipe } from "@chakra-ui/react";

/**
 * FIX: Replaced `brand.500`/`brand.200` references with `primary.500`/`primary.200`.
 */
export default defineRecipe({
	variants: {
		variant: {
			outline: {
				borderRadius: "md",
				bg: { base: "white", _dark: "gray.800" },
				_hover: { borderColor: { base: "gray.300", _dark: "gray.600" } },
				_focus: {
					borderColor: { base: "primary.700", _dark: "primary.300" },
					boxShadow: {
						base: "0px 0px 0px 1px var(--chakra-colors-primary-700)",
						_dark: "0px 0px 0px 1px var(--chakra-colors-primary-300)",
					},
				},
			},
		},
	},
});
