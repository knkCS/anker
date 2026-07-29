import { defineSlotRecipe } from "@chakra-ui/react";

/**
 * The quick-set emoji grid inside ReactionQuickSetPopover.
 *
 * Eight columns is fixed here rather than exposed as a prop: the default set
 * is sixteen, which lands as two even rows, and the column count is the one
 * thing that decides whether the sheet reads as a grid or a list. A consumer
 * passing a different set gets the same rhythm rather than a new layout
 * decision to make.
 *
 * The options are sized at the 44px touch-target minimum outright instead of
 * with the button recipe's invisible pseudo — they are laid out on a grid, so
 * making them genuinely 44px costs no more room than faking it would, and the
 * glyph gets to sit in the middle of its own hit area.
 */
export const reactionQuickSetTheme = defineSlotRecipe({
	slots: ["grid", "option"],
	base: {
		grid: {
			display: "grid",
			gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
			gap: 1,
		},
		option: {
			display: "inline-flex",
			alignItems: "center",
			justifyContent: "center",
			// WCAG 2.5.8 touch target, met directly rather than via a pseudo.
			minWidth: "44px",
			minHeight: "44px",
			borderRadius: "md",
			// The glyph renders from the system's colour emoji font, so this is
			// a glyph size rather than a text size.
			fontSize: "xl",
			lineHeight: "1",
			bg: "transparent",
			cursor: "pointer",
			transitionProperty: "background-color, transform",
			transitionDuration: "fast",
			transitionTimingFunction: "ease-out",
			_hover: {
				bg: "bg-muted",
				// A small lift is what makes a dense grid of same-size glyphs
				// readable under the pointer; the theme's global reduced-motion
				// rule parks it, so never add a per-component media query.
				transform: "scale(1.15)",
			},
			_focusVisible: {
				outline: "2px solid",
				outlineColor: "focus-ring",
				outlineOffset: "-2px",
			},
		},
	},
});
