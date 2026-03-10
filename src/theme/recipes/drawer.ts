import { defineSlotRecipe } from "@chakra-ui/react";

export const drawerTheme = defineSlotRecipe({
	slots: ["content"],
	variants: {
		size: {
			xl: {
				content: { minW: "50vw", h: "100vh" },
			},
			xxl: {
				content: { minW: "51vw", h: "100vh", maxW: "70vw" },
			},
			full: {
				content: { maxW: "90vw", h: "100vh" },
			},
		},
	},
});
