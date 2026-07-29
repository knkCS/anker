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
 * dot, offline a hollow ring. Both keep the same footprint, so an avatar does
 * not shift as presence changes.
 */
export const avatarPresenceTheme = defineRecipe({
	base: {
		position: "absolute",
		// Logical, so the dot moves to the bottom-left in RTL.
		insetBlockEnd: "0",
		insetInlineEnd: "0",
		// Chakra's avatar recipe publishes `--avatar-size` on the root for every
		// size variant, so one ratio covers 2xs through 2xl — and `size="full"`,
		// where it resolves to a percentage of the avatar box. (The fallback
		// covers `unstyled` avatars, which skip the recipe that sets it.) At this
		// ratio the dot's centre lands on the circle's edge, the classic
		// anchoring.
		//
		// The size rides on `font-size` — the dot holds no text — so that every
		// ring below can be written in `em` and scale with it. Flat pixel rings
		// do not survive the small end: two 2px rings consume the whole 7.2px dot
		// at `2xs`, collapsing the hollow variant into a solid disc and leaving
		// hue as the only difference between the two states.
		fontSize: "calc(var(--avatar-size, 100%) * 0.3)",
		width: "1em",
		height: "1em",
		boxSizing: "border-box",
		borderRadius: "full",
		// The ring separating the dot from the photo behind it. It reads the
		// surface token rather than the actual parent background, so on an
		// off-surface backdrop it is a hairline mismatch, not a hole.
		borderWidth: "0.17em",
		borderStyle: "solid",
		borderColor: "bg-surface",
		// AvatarGroup overlaps each avatar with the next one (`spaceX: -3`) and by
		// default assigns no stacking order, so DOM order would bury this corner
		// under the following avatar. The group is `isolation: isolate`, so
		// lifting the dot stays contained within it. Note this does NOT survive
		// `<AvatarGroup stacking="…">`: that puts an explicit z-index on every
		// avatar root, which makes each one its own stacking context and traps
		// the dot inside it again.
		zIndex: 1,
	},
	variants: {
		presence: {
			online: {
				bg: "success",
			},
			offline: {
				bg: "bg-surface",
				// Hollow: the ring is drawn inward, so the dot keeps its footprint.
				// `subtle` is a text-scale grey rather than the `border` hairline
				// token because this ring is a meaningful graphical object — it is
				// the whole offline signal, and `border` does not clear 3:1 against
				// the surface it sits on (WCAG 1.4.11).
				boxShadow: "inset 0 0 0 0.17em {colors.subtle}",
			},
		},
	},
});
