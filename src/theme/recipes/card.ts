import { defineSlotRecipe } from "@chakra-ui/react";

export const cardSlotRecipe = defineSlotRecipe({
	slots: ["root", "header", "body", "footer", "title", "description"],
	base: {
		root: {
			bg: { base: "white", _dark: "gray.800" },
		},
	},
	variants: {
		variant: {
			elevated: {
				root: {
					boxShadow: "md",
				},
			},
			flat: {
				root: {
					shadow: "md",
				},
			},
		},
	},
	defaultVariants: {
		variant: "elevated",
	},
});

export default cardSlotRecipe;
