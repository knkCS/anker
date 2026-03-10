import { defineSlotRecipe } from "@chakra-ui/react";

export const checkboxSlotRecipe = defineSlotRecipe({
	slots: ["root", "label", "control", "indicator", "group"],
	base: {
		label: {
			color: "muted",
			fontWeight: "medium",
		},
		control: {
			bg: { base: "white", _dark: "gray.800" },
			borderRadius: "base",
		},
	},
	variants: {
		size: {
			md: {
				label: {
					fontSize: "sm",
				},
			},
		},
	},
	defaultVariants: {
		size: "md",
		colorPalette: "primary" as never,
	},
});

export default checkboxSlotRecipe;
