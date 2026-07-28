import { defineSlotRecipe } from "@chakra-ui/react";

/**
 * VirtualizedMessageList: the scroll viewport, absolutely-positioned virtual
 * rows, day dividers, and the floating jump-to-latest pill.
 *
 * The pill reuses the message toolbar's neutral surface (bg-surface + border
 * + shadow) so the two floating chat affordances read as one family.
 */
export const messageListTheme = defineSlotRecipe({
	slots: [
		"root",
		"viewport",
		"inner",
		"item",
		"divider",
		"dividerLabel",
		"jump",
	],
	base: {
		root: {
			position: "relative",
			blockSize: "100%",
			minBlockSize: 0,
			overflow: "hidden",
		},
		viewport: {
			blockSize: "100%",
			overflowY: "auto",
			overscrollBehavior: "contain",
		},
		inner: {
			position: "relative",
			inlineSize: "100%",
		},
		item: {
			position: "absolute",
			insetBlockStart: 0,
			insetInlineStart: 0,
			inlineSize: "100%",
		},
		divider: {
			display: "flex",
			alignItems: "center",
			gap: 3,
			paddingBlock: 3,
			"&::before, &::after": {
				content: '""',
				flex: "1",
				borderBlockStart: "1px solid",
				borderColor: "border",
			},
		},
		dividerLabel: {
			fontSize: "xs",
			fontWeight: "medium",
			color: "muted",
			whiteSpace: "nowrap",
		},
		jump: {
			position: "absolute",
			insetBlockEnd: 4,
			insetInline: 0,
			marginInline: "auto",
			inlineSize: "fit-content",
			display: "inline-flex",
			alignItems: "center",
			gap: 1,
			paddingInline: 3,
			paddingBlock: 1.5,
			bg: "bg-surface",
			color: "default",
			fontSize: "sm",
			fontWeight: "medium",
			borderWidth: "1px",
			borderColor: "border",
			borderRadius: "full",
			boxShadow: "md",
			cursor: "pointer",
			zIndex: 1,
			animationName: "slideUp",
			animationDuration: "entrance",
			animationTimingFunction: "ease-out",
			transitionProperty: "common",
			transitionDuration: "normal",
			_hover: {
				bg: "bg-subtle",
			},
			_focusVisible: {
				boxShadow: "focus-ring",
				outline: "none",
			},
			_active: {
				transform: "scale(0.98)",
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
	},
});
