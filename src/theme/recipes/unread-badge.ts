import { defineRecipe } from "@chakra-ui/react";

/**
 * The unread-count pill (UnreadBadge).
 *
 * Single-part recipe, consumed explicitly via `useRecipe({ key: "unreadBadge" })`
 * — the same live pattern as `prose`. A plain `recipes.*` registration only
 * applies when either a Chakra single-part component owns the key or a
 * component reads it by hand; see anker#153/#154 for the dead-registration
 * class of bug this avoids.
 *
 * Plain unread counts stay neutral: an unread count is information, not an
 * action, so the accent fill is reserved for the mention variant. Colour is
 * the secondary signal — the component also prefixes mentions with an `@`
 * glyph, so the two states never rely on hue alone (WCAG 1.4.1).
 */
export const unreadBadgeTheme = defineRecipe({
	base: {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		gap: 0.5,
		// Equal min-width and height render a single digit as a circle; longer
		// labels ("99+") grow horizontally from it.
		minWidth: "5",
		height: "5",
		paddingInline: 1.5,
		borderRadius: "full",
		fontSize: "xs",
		fontWeight: "semibold",
		lineHeight: "1",
		// Counts tick up in place — proportional digits would make the pill jitter.
		fontVariantNumeric: "tabular-nums",
		whiteSpace: "nowrap",
		flexShrink: 0,
		bg: "gray.solid",
		color: "gray.contrast",
	},
	variants: {
		mention: {
			true: {
				bg: "primary.solid",
				color: "primary.contrast",
			},
		},
	},
	defaultVariants: {
		mention: false,
	},
});
