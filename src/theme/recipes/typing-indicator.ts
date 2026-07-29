import { defineSlotRecipe } from "@chakra-ui/react";

/**
 * The "who is typing" row (TypingIndicator).
 *
 * The row keeps a constant height whether or not it holds a label, so a
 * consumer that reserves its space never sees the message list nudge when
 * typing starts and stops.
 *
 * Open/closed is driven by `data-state` rather than a variant: the closed
 * state only exists for `reserveSpace` callers, and pairing it with the
 * entrance animation in one selector keeps the two from fighting (a mount in
 * the closed state would otherwise fade *in* and then snap to transparent).
 * The dots' bounce and the row's fade both stop under `prefers-reduced-motion`
 * — the theme's global `_motionReduce` rule handles that; never add a
 * per-component media query.
 */
export const typingIndicatorTheme = defineSlotRecipe({
	slots: ["root", "dots", "dot", "label"],
	base: {
		root: {
			display: "flex",
			alignItems: "center",
			gap: 2,
			// A constant height keeps the row from nudging its neighbours as the
			// label appears, disappears, or changes length.
			minHeight: "6",
			paddingInline: 1,
			color: "muted",
			fontSize: "sm",
			lineHeight: "1.2",
			transitionProperty: "opacity",
			transitionDuration: "normal",
			transitionTimingFunction: "ease-out",
			'&[data-state="open"]': {
				opacity: 1,
				animation: "fadeIn 150ms ease-out",
			},
			'&[data-state="closed"]': {
				opacity: 0,
				pointerEvents: "none",
			},
		},
		dots: {
			display: "inline-flex",
			alignItems: "center",
			gap: 1,
			flexShrink: 0,
		},
		dot: {
			width: "1.5",
			height: "1.5",
			borderRadius: "full",
			// currentColor keeps the dots on whatever text colour the row (or a
			// consumer override) resolves to.
			bg: "currentColor",
			animation: "typingBounce 1.2s ease-in-out infinite",
			// Staggering the three dots is what reads as "typing" rather than
			// "loading" — they must not pulse in unison.
			"&:nth-of-type(2)": {
				animationDelay: "0.16s",
			},
			"&:nth-of-type(3)": {
				animationDelay: "0.32s",
			},
			// A reserved row sits invisible for as long as nobody types — leaving
			// three dots bouncing behind `opacity: 0` burns frames for nothing.
			'[data-state="closed"] &': {
				animationPlayState: "paused",
			},
		},
		label: {
			minWidth: 0,
			overflow: "hidden",
			textOverflow: "ellipsis",
			whiteSpace: "nowrap",
		},
	},
});
