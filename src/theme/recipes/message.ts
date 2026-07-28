import { defineSlotRecipe } from "@chakra-ui/react";

/**
 * Chat message primitives (MessageGroup / MessageBubble).
 *
 * Soft-tint bubbles: `other` messages sit on bg-surface with a border,
 * `self` messages on primary.subtle — never inverted, so arbitrary segment
 * content stays readable with the default text color.
 */
export const messageTheme = defineSlotRecipe({
	slots: [
		"group",
		"header",
		"avatar",
		"content",
		"bubbleRow",
		"bubble",
		"timestamp",
		"toolbar",
		"tombstone",
	],
	base: {
		group: {
			display: "flex",
			alignItems: "flex-start",
			gap: 2,
		},
		header: {
			fontSize: "sm",
			fontWeight: "medium",
			color: "emphasized",
			marginBlockEnd: 1,
		},
		avatar: {
			flexShrink: 0,
		},
		content: {
			display: "flex",
			flexDirection: "column",
			alignItems: "flex-start",
			gap: 1,
			minWidth: 0,
			flex: "1",
		},
		bubbleRow: {
			display: "flex",
			alignItems: "flex-end",
			gap: 2,
			"&:hover .message__toolbar, &:focus-within .message__toolbar": {
				opacity: 1,
				pointerEvents: "auto",
				animationName: "fadeIn",
				animationDuration: "fast",
				animationTimingFunction: "ease-out",
			},
		},
		bubble: {
			position: "relative",
			paddingInline: 3,
			paddingBlock: 2,
			borderRadius: "xl",
			minWidth: 0,
		},
		timestamp: {
			fontSize: "xs",
			color: "muted",
			whiteSpace: "nowrap",
			flexShrink: 0,
		},
		toolbar: {
			position: "absolute",
			insetBlockStart: "-3",
			insetInlineEnd: "2",
			display: "inline-flex",
			alignItems: "center",
			gap: 1,
			paddingInline: 1,
			paddingBlock: 0.5,
			bg: "bg-surface",
			borderWidth: "1px",
			borderColor: "border",
			borderRadius: "full",
			boxShadow: "sm",
			opacity: 0,
			pointerEvents: "none",
			zIndex: 1,
		},
		tombstone: {
			fontSize: "sm",
			fontStyle: "italic",
			color: "muted",
		},
	},
	variants: {
		variant: {
			other: {
				bubbleRow: {
					justifyContent: "flex-start",
				},
				bubble: {
					bg: "bg-surface",
					borderWidth: "1px",
					borderColor: "border",
					borderStartStartRadius: "sm",
				},
			},
			self: {
				group: {
					flexDirection: "row-reverse",
				},
				content: {
					alignItems: "flex-end",
				},
				bubbleRow: {
					flexDirection: "row-reverse",
					justifyContent: "flex-start",
				},
				bubble: {
					bg: "primary.subtle",
					borderEndEndRadius: "sm",
				},
			},
		},
	},
	defaultVariants: {
		variant: "other",
	},
});
