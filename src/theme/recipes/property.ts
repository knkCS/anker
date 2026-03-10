import { defineSlotRecipe } from "@chakra-ui/react";

export const propertyTheme = defineSlotRecipe({
	slots: ["property", "label", "value"],
	base: {
		label: {
			color: "muted",
		},
	},
});
