import { defineSlotRecipe } from "@chakra-ui/react";

export const personaSlotRecipe = defineSlotRecipe({
	slots: [
		"container",
		"details",
		"avatar",
		"label",
		"secondaryLabel",
		"tertiaryLabel",
	],
	base: {
		container: {},
		avatar: {},
		label: {},
		secondaryLabel: {
			color: { base: "gray.500", _dark: "whiteAlpha.600" },
			overflow: "hidden",
			whiteSpace: "nowrap",
			textOverflow: "ellipsis",
		},
		tertiaryLabel: {
			color: { base: "gray.500", _dark: "whiteAlpha.600" },
			overflow: "hidden",
			whiteSpace: "nowrap",
			textOverflow: "ellipsis",
		},
	},
	variants: {
		size: {
			"2xs": {
				details: { ms: 2 },
				label: { fontSize: "xs" },
				secondaryLabel: { display: "none" },
				tertiaryLabel: { display: "none" },
			},
			xs: {
				details: { ms: 2 },
				label: { fontSize: "md" },
				secondaryLabel: { display: "none" },
				tertiaryLabel: { display: "none" },
			},
			sm: {
				details: { ms: 2 },
				label: { fontSize: "md" },
				secondaryLabel: { fontSize: "sm" },
				tertiaryLabel: { display: "none" },
			},
			md: {
				details: { ms: 2 },
				label: { fontSize: "md" },
				secondaryLabel: { fontSize: "sm" },
				tertiaryLabel: { display: "none" },
			},
			lg: {
				details: { ms: 3 },
				label: { fontSize: "md" },
				secondaryLabel: { fontSize: "sm" },
				tertiaryLabel: { fontSize: "sm" },
			},
			xl: {
				details: { ms: 3 },
				label: { fontSize: "xl" },
				secondaryLabel: { fontSize: "md" },
				tertiaryLabel: { fontSize: "md" },
			},
			"2xl": {
				details: { ms: 4 },
				label: { fontSize: "2xl" },
				secondaryLabel: { fontSize: "lg" },
				tertiaryLabel: { fontSize: "lg" },
			},
		},
	},
	defaultVariants: {
		size: "md",
	},
});

export default personaSlotRecipe;
