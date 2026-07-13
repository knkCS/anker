import { defineSlotRecipe } from "@chakra-ui/react";

export const dialog = defineSlotRecipe({
	slots: ["content", "backdrop"],
	base: {
		// Ported from the dead v2 `modal` slot recipe (2026-07 sweep, #153
		// class): the frosted-glass overlay documented in CLAUDE.md's
		// "Component Visual Polish" was registered under a key nothing
		// consumes. Chakra's Dialog.Backdrop consumes THIS slot.
		backdrop: {
			backdropFilter: "blur(4px)",
		},
	},
	variants: {
		size: {
			"7xl": {
				content: {
					maxW: "95%",
					minH: "95%",
					maxH: "95%",
					my: 0,
				},
			},
		},
	},
});
