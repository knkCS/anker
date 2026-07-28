import { defineSlotRecipe } from "@chakra-ui/react";

/**
 * Composer: the chat message input — a bordered surface with an auto-growing
 * textarea, a round accent send button, and the mention-autocomplete dropdown
 * opening above the input (the composer sits at the bottom of chat surfaces).
 *
 * The dropdown reuses the surface treatment of menus/popovers (bg-surface +
 * border + shadow) so the floating chat affordances read as one family.
 */
export const composerTheme = defineSlotRecipe({
	slots: ["root", "textarea", "send", "dropdown", "option"],
	base: {
		root: {
			position: "relative",
			display: "flex",
			alignItems: "flex-end",
			gap: 2,
			paddingInline: 3,
			paddingBlock: 2,
			bg: "bg-surface",
			borderWidth: "1px",
			borderColor: "border",
			borderRadius: "xl",
			transitionProperty: "common",
			transitionDuration: "normal",
			_focusWithin: {
				borderColor: "accent",
				boxShadow: "focus-ring",
			},
			"&[data-disabled]": {
				bg: "bg-subtle",
				cursor: "not-allowed",
			},
		},
		textarea: {
			flex: "1",
			minWidth: 0,
			border: "none",
			outline: "none",
			resize: "none",
			bg: "transparent",
			color: "default",
			paddingBlock: 1.5,
			maxBlockSize: "40",
			overflowY: "auto",
			_placeholder: {
				color: "subtle",
			},
			_disabled: {
				cursor: "not-allowed",
				color: "muted",
			},
		},
		send: {
			position: "relative",
			flexShrink: 0,
			display: "inline-flex",
			alignItems: "center",
			justifyContent: "center",
			boxSize: 9,
			bg: "accent",
			color: "on-accent",
			borderRadius: "full",
			cursor: "pointer",
			transitionProperty: "common",
			transitionDuration: "normal",
			_hover: {
				bg: "primary.800",
				_disabled: {
					bg: "accent",
				},
			},
			_active: {
				bg: "primary.900",
				transform: "scale(0.98)",
			},
			_focusVisible: {
				boxShadow: "focus-ring",
				outline: "none",
			},
			_disabled: {
				opacity: 0.4,
				cursor: "not-allowed",
				_active: {
					transform: "none",
				},
			},
			// WCAG 2.5.8 touch target: expand the hit area to 44×44px minimum
			// without changing visual size (same pseudo as the button recipe).
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
		dropdown: {
			position: "absolute",
			insetBlockEnd: "calc(100% + {spacing.2})",
			insetInlineStart: 0,
			minInlineSize: "72",
			maxInlineSize: "100%",
			maxBlockSize: "80",
			overflowY: "auto",
			display: "flex",
			flexDirection: "column",
			gap: 0.5,
			padding: 1,
			bg: "bg-surface",
			borderWidth: "1px",
			borderColor: "border",
			borderRadius: "md",
			boxShadow: "lg",
			zIndex: "dropdown",
			animationName: "slideUp",
			animationDuration: "fast",
			animationTimingFunction: "ease-out",
		},
		option: {
			display: "flex",
			alignItems: "center",
			gap: 2,
			paddingInline: 2,
			paddingBlock: 1.5,
			borderRadius: "md",
			fontSize: "sm",
			cursor: "pointer",
			"&[data-highlighted]": {
				bg: "bg-subtle",
			},
		},
	},
});
