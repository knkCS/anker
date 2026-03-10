import { defineRecipe } from "@chakra-ui/react";

export const tooltipTheme = defineRecipe({
	base: {
		px: "2",
		py: "1",
		bg: "gray.700",
		color: "whiteAlpha.900",
		_dark: {
			bg: "gray.300",
			color: "gray.900",
		},
		borderRadius: "md",
		fontWeight: "medium",
		fontSize: "sm",
		boxShadow: "md",
		maxW: "xs",
		zIndex: "tooltip",
	},
});
