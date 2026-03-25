import { defineSlotRecipe } from "@chakra-ui/react";

const $bg = "--menu-bg";
const $shadow = "--menu-shadow";

/**
 * FIX: Replaced `shadows.dark-lg` with semantic shadow token `shadows.lg`
 * (the semantic shadow system already handles dark mode via _dark).
 */
export const menuTheme = defineSlotRecipe({
	slots: ["content", "item", "itemGroupLabel", "itemCommand", "separator"],
	base: {
		content: {
			[$bg]: "colors.white",
			[$shadow]: "shadows.md",
			_dark: {
				[$bg]: "colors.gray.700",
				[$shadow]: "shadows.lg",
			},
			color: "inherit",
			minW: "3xs",
			py: "2",
			zIndex: 1,
			borderRadius: "md",
			borderWidth: "1px",
			bg: `var(${$bg})`,
			boxShadow: `var(${$shadow})`,
		},
		item: {
			py: "0.4rem",
			px: "0.8rem",
			fontSize: "sm",
			fontWeight: "normal",
			color: { base: "gray.800", _dark: "gray.100" },
			transitionProperty: "background",
			transitionDuration: "ultra-fast",
			transitionTimingFunction: "ease-in",
			_focus: {
				[$bg]: "colors.gray.100",
				_dark: {
					[$bg]: "colors.whiteAlpha.100",
				},
			},
			_active: {
				[$bg]: "colors.gray.200",
				_dark: {
					[$bg]: "colors.whiteAlpha.200",
				},
			},
			_expanded: {
				[$bg]: "colors.gray.100",
				_dark: {
					[$bg]: "colors.whiteAlpha.100",
				},
			},
			_disabled: {
				opacity: 0.4,
				cursor: "not-allowed",
			},
			bg: `var(${$bg})`,
		},
		itemGroupLabel: {
			mx: 4,
			my: 2,
			fontWeight: "semibold",
			fontSize: "sm",
		},
		itemCommand: {
			opacity: 0.6,
		},
		separator: {
			border: 0,
			borderBottom: "1px solid",
			borderColor: "inherit",
			my: "2",
			opacity: 0.6,
		},
	},
});
