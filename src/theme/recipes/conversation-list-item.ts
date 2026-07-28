import { defineSlotRecipe } from "@chakra-ui/react";

/**
 * One row in a conversation list (ConversationListItem).
 *
 * The row is a native button spanning the list width. Selected rows use the
 * soft primary tint (`primary.subtle`) — never an inverted surface, so
 * arbitrary preview/badge content stays readable with default text colors.
 */
export const conversationListItemTheme = defineSlotRecipe({
	slots: [
		"root",
		"avatar",
		"content",
		"titleRow",
		"title",
		"timestamp",
		"previewRow",
		"preview",
		"badge",
	],
	base: {
		root: {
			display: "flex",
			alignItems: "center",
			gap: 3,
			width: "100%",
			// WCAG 2.5.8 touch target: the row spans the list width, so
			// height alone must clear the 44px minimum.
			minHeight: "44px",
			paddingInline: 3,
			paddingBlock: 2,
			borderRadius: "md",
			bg: "transparent",
			textAlign: "start",
			cursor: "pointer",
			transitionProperty: "common",
			transitionDuration: "normal",
			_hover: {
				bg: "bg-subtle",
			},
			_focusVisible: {
				boxShadow: "focus-ring",
				outline: "none",
			},
		},
		avatar: {
			flexShrink: 0,
		},
		content: {
			flex: "1",
			minWidth: 0,
			display: "flex",
			flexDirection: "column",
			gap: 0.5,
		},
		titleRow: {
			display: "flex",
			alignItems: "center",
			gap: 2,
		},
		title: {
			flex: "1",
			minWidth: 0,
			fontSize: "sm",
			fontWeight: "medium",
			color: "emphasized",
			overflow: "hidden",
			textOverflow: "ellipsis",
			whiteSpace: "nowrap",
		},
		timestamp: {
			fontSize: "xs",
			color: "muted",
			whiteSpace: "nowrap",
			flexShrink: 0,
		},
		previewRow: {
			display: "flex",
			alignItems: "center",
			gap: 2,
		},
		preview: {
			flex: "1",
			minWidth: 0,
			fontSize: "sm",
			color: "muted",
			overflow: "hidden",
			textOverflow: "ellipsis",
			whiteSpace: "nowrap",
		},
		badge: {
			flexShrink: 0,
			display: "inline-flex",
			alignItems: "center",
			// Keeps a badge-only preview row end-aligned; a no-op when the
			// preview is present (it already flexes to fill the row).
			marginInlineStart: "auto",
		},
	},
	variants: {
		selected: {
			true: {
				root: {
					bg: "primary.subtle",
					_hover: {
						bg: "primary.muted",
					},
				},
			},
		},
	},
	defaultVariants: {
		selected: false,
	},
});
