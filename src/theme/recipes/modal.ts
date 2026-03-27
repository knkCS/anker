import { defineSlotRecipe } from "@chakra-ui/react";

export const modalSlotRecipe = defineSlotRecipe({
	slots: ["header", "closeButton", "dialog", "backdrop"],
	base: {
		header: {
			px: "6",
			py: "4",
			fontSize: "xl",
			fontWeight: "semibold",
			roundedTop: "md",
		},
		closeButton: {},
		backdrop: {
			backdropFilter: "blur(4px)",
		},
	},
	variants: {
		size: {
			"7xl": {
				dialog: {
					maxW: "95%",
					minH: "95%",
					maxH: "95%",
					my: 0,
				},
			},
		},
	},
});
