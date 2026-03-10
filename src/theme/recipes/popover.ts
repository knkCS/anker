import { defineSlotRecipe } from "@chakra-ui/react";

/**
 * FIX: Replaced `lg-dark` shadow reference with semantic `lg` shadow token.
 * The semantic shadow system handles dark mode via the _dark condition.
 */
export const popoverSlotRecipe = defineSlotRecipe({
	slots: ["content"],
	base: {
		content: {
			borderWidth: "1px",
			boxShadow: "lg",
			borderRadius: "md",
			background: "bg-surface",
			overflow: "hidden",
		},
	},
});

export default popoverSlotRecipe;
