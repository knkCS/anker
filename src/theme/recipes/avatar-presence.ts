import { defineRecipe } from "@chakra-ui/react";

/**
 * The presence dot anchored to an Avatar (the `presence` prop).
 *
 * Single-part recipe, consumed explicitly via
 * `useRecipe({ key: "avatarPresence" })` — the same live pattern as `prose` and
 * `unreadBadge`. A plain `recipes.*` registration only applies when either a
 * Chakra single-part component owns the key or a component reads it by hand;
 * see anker#153/#154 for the dead-registration class of bug this avoids.
 *
 * It is a separate recipe rather than a slot added to Chakra's `avatar` recipe:
 * that slot list comes from `avatarAnatomy`, so an anker-only slot has no
 * Chakra component to render it.
 *
 * Online and offline never differ by hue alone (WCAG 1.4.1): online is a filled
 * dot, offline a hollow ring drawn with an inset shadow. Both keep the same
 * footprint, so an avatar does not shift as presence changes.
 */
export const avatarPresenceTheme = defineRecipe({
	base: {
		position: "absolute",
		// Logical, so the dot moves to the bottom-left in RTL.
		insetBlockEnd: "0",
		insetInlineEnd: "0",
		// Chakra's avatar recipe publishes `--avatar-size` on the root for every
		// size variant, so one ratio covers 2xs through 2xl — and `size="full"`,
		// where it resolves to a percentage of the avatar box. At this ratio the
		// dot's centre lands on the circle's edge, the classic anchoring.
		width: "calc(var(--avatar-size, 100%) * 0.3)",
		height: "calc(var(--avatar-size, 100%) * 0.3)",
		boxSizing: "border-box",
		borderRadius: "full",
		// The separating ring against the photo behind it, matching the width and
		// token family of the ring Chakra puts on grouped avatars. It reads the
		// surface token rather than the actual parent background, so on an
		// off-surface backdrop it is a hairline mismatch, not a hole.
		borderWidth: "2px",
		borderStyle: "solid",
		borderColor: "bg-surface",
		// AvatarGroup overlaps each avatar with the next one (`spaceX: -3`) and
		// assigns no stacking order, so DOM order would bury this corner under the
		// following avatar. The group is `isolation: isolate`, so lifting the dot
		// stays contained within it.
		zIndex: 1,
	},
	variants: {
		status: {
			online: {
				bg: "success",
			},
			offline: {
				bg: "bg-surface",
				// Hollow: the ring is drawn inward so the dot keeps its footprint.
				boxShadow: "inset 0 0 0 2px {colors.subtle}",
			},
		},
	},
	defaultVariants: {
		status: "offline",
	},
});
