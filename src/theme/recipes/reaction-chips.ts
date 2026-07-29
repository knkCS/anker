import { defineSlotRecipe } from "@chakra-ui/react";

/**
 * The aggregated-reactions row under a message (ReactionChips).
 *
 * Every chip is a toggle button, so the reacted-by-me state is carried for
 * assistive tech by `aria-pressed` — this recipe only has to make it visible.
 * It does so twice over: the accent tint *and* a heavier count, so the two
 * states never differ by hue alone (WCAG 1.4.1) — the same line unread-badge
 * draws around its `@` glyph and avatar-presence around its hollow ring.
 *
 * The reacted tint is `primary.subtle`, NOT `bg-accent-subtle`: the latter is
 * an inverted accent surface that would swallow the chip's own text. Same rule
 * as message self-bubbles and selected conversation rows.
 *
 * Borders are always present and only change colour between states, so a chip
 * never changes size as it is toggled and the row never reflows under the
 * pointer.
 */
export const reactionChipsTheme = defineSlotRecipe({
	slots: ["root", "chip", "emoji", "count"],
	base: {
		root: {
			display: "flex",
			flexWrap: "wrap",
			alignItems: "center",
			// Wide enough that the chips' 44px hit areas (below) stay clear of
			// each other even where a chip is visually narrower than that.
			gap: 1.5,
		},
		chip: {
			// Anchors the touch-target pseudo below.
			position: "relative",
			display: "inline-flex",
			alignItems: "center",
			gap: 1,
			minHeight: "7",
			paddingInline: 2,
			borderRadius: "full",
			borderWidth: "1px",
			borderStyle: "solid",
			borderColor: "border",
			bg: "bg-surface",
			color: "default",
			fontSize: "xs",
			lineHeight: "1",
			whiteSpace: "nowrap",
			flexShrink: 0,
			cursor: "pointer",
			transitionProperty: "background-color, border-color",
			transitionDuration: "fast",
			transitionTimingFunction: "ease-out",
			_hover: {
				bg: "bg-muted",
			},
			_focusVisible: {
				outline: "2px solid",
				outlineColor: "focus-ring",
				outlineOffset: "1px",
			},
			_disabled: {
				opacity: 0.5,
				cursor: "not-allowed",
				_hover: {
					bg: "bg-surface",
				},
			},
			// WCAG 2.5.8 touch target: expand the hit area to 44×44px minimum
			// without changing visual size (same pseudo as the button recipe).
			// A reaction chip that is actually 44px tall dwarfs the message it
			// hangs under, so the visual height stays at 28px.
			_after: {
				content: '""',
				position: "absolute",
				top: "50%",
				insetInlineStart: "50%",
				minWidth: "44px",
				minHeight: "44px",
				transform: "translate(-50%, -50%)",
			},
		},
		emoji: {
			// Emoji render from the system's colour font — a hair larger than
			// the count so the glyph, not the digit, is what the eye lands on.
			fontSize: "sm",
			lineHeight: "1",
		},
		count: {
			// Counts tick up in place — proportional digits would make the chip
			// jitter as a reaction is added or removed.
			fontVariantNumeric: "tabular-nums",
			fontWeight: "medium",
		},
	},
	variants: {
		reacted: {
			true: {
				chip: {
					bg: "primary.subtle",
					borderColor: "primary.border",
					color: "primary.fg",
					_hover: {
						bg: "primary.muted",
					},
				},
				// The second, non-colour signal for the same state.
				count: {
					fontWeight: "bold",
				},
			},
		},
	},
	defaultVariants: {
		reacted: false,
	},
});
