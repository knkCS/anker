import { defineSlotRecipe } from "@chakra-ui/react";

export const commentSlotRecipe = defineSlotRecipe({
	slots: [
		"container",
		"avatar",
		"contentContainer",
		"children",
		"field",
		"deletedText",
	],
	base: {
		container: {
			display: "grid",
			position: "relative",
			gap: 2,
			gridTemplateAreas: `"avatar-area comment-area" ". nested-comments-area"`,
			gridTemplateColumns: "auto 1fr",
			fontSize: "sm",
		},
		avatar: {
			gridArea: "avatar-area",
			display: "block",
		},
		contentContainer: {
			minW: 0,
			pt: 1,
			gridArea: "comment-area",
			wordWrap: "break-word",
			bg: { base: "gray.50", _dark: "gray.700" },
			borderRadius: "md",
			p: 4,
		},
		children: {
			gridArea: "nested-comments-area",
			paddingTop: 8,
		},
		field: {
			fontWeight: "inherit",
			"&:not(:hover):not(:active)": {
				color: { base: "gray.500", _dark: "gray.400" },
			},
		},
		deletedText: {
			color: { base: "gray.500", _dark: "gray.400" },
			fontStyle: "italic",
		},
	},
});

export default commentSlotRecipe;
