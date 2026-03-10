import { defineSlotRecipe } from "@chakra-ui/react";

export const dialog = defineSlotRecipe({
	slots: ["content"],
	variants: {
		size: {
			"7xl": {
				content: {
					maxW: "95%",
					minH: "95%",
					maxH: "95%",
					my: 0,
				},
			},
		},
	},
});
