import { defineSlotRecipe } from "@chakra-ui/react";

export const tabTheme = defineSlotRecipe({
	slots: ["root", "list", "trigger", "content", "contentGroup", "indicator"],
	variants: {
		variant: {
			"with-line": {
				list: {
					borderBottom: "1px solid",
					borderColor: "border",
				},
				trigger: {
					color: "muted",
					borderBottom: "2px solid transparent",
					marginBottom: "-1px",
					pt: "0",
					pb: "4.5",
					px: "1",
					justifyContent: "start",
					"&:not(:last-child)": {
						me: "4",
					},
					_selected: {
						color: "colorPalette.solid",
						borderBottom: "2px solid",
						borderBottomColor: "colorPalette.solid",
					},
					_active: {
						bg: "transparent",
					},
				},
			},
			"with-line-vertical": {
				list: {
					borderStart: "1px solid",
					borderColor: "border",
				},
				trigger: {
					color: "muted",
					borderStart: "2px solid transparent",
					marginStart: "-1px",
					justifyContent: "start",
					px: "3",
					"&:not(:last-child)": {
						mb: "2",
					},
					_selected: {
						color: "colorPalette.solid",
						borderStartColor: "colorPalette.solid",
					},
					_active: {
						bg: "transparent",
					},
				},
			},
		},
	},
});
