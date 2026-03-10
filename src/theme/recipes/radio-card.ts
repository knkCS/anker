import { defineRecipe } from "@chakra-ui/react";

export const radioCardTheme = defineRecipe({
	base: {
		borderWidth: "1px",
		borderRadius: "md",
		p: "4",
		bg: "bg-surface",
		transitionProperty: "common",
		transitionDuration: "normal",
		_hover: {
			borderColor: { base: "gray.300", _dark: "gray.600" },
		},
		_checked: {
			borderColor: { base: "primary.500", _dark: "primary.200" },
			boxShadow: {
				base: "0px 0px 0px 1px var(--chakra-colors-primary-500)",
				_dark: "0px 0px 0px 1px var(--chakra-colors-primary-200)",
			},
		},
	},
});
