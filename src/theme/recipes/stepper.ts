import { defineSlotRecipe } from "@chakra-ui/react";

/**
 * FIX: Replaced `colorPalette: "blue"` with `colorPalette: "primary"` in
 * defaultVariants to use our primary palette consistently.
 */
export const stepperTheme = defineSlotRecipe({
	slots: [
		"container",
		"steps",
		"icon",
		"content",
		"title",
		"separator",
		"step",
	],
	base: {
		container: {
			display: "flex",
			flexDirection: "column",
			py: 4,
		},
		steps: {
			display: "flex",
			mb: 4,
		},
		step: {
			display: "flex",
			alignItems: "center",
			flexDirection: "row",
		},
		icon: {
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			borderRadius: "full",
			fontSize: "1em",
			bg: "whiteAlpha.400",
			lineHeight: 1,
			flexShrink: 0,
			transitionProperty: "common",
			transitionDuration: "normal",
		},
		separator: {
			flex: 1,
			transitionProperty: "common",
			transitionDuration: "normal",
		},
	},
	variants: {
		variant: {
			subtle: {
				icon: {
					bg: "blackAlpha.300",
					color: "blackAlpha.600",
					_dark: {
						bg: "whiteAlpha.200",
						color: "whiteAlpha.600",
					},
				},
				step: {
					"&[data-active] .stepper__icon, &[data-completed] .stepper__icon": {
						bg: "colorPalette.muted",
						color: "colorPalette.fg",
					},
				},
				separator: {
					"&[data-active]": {
						bg: "colorPalette.emphasized",
					},
				},
			},
			solid: {
				icon: {
					bg: "gray.300",
					color: "gray.600",
					_dark: {
						bg: "gray.600",
						color: "gray.400",
					},
				},
				step: {
					"&[data-active] .stepper__icon": {
						bg: "colorPalette.muted",
						borderColor: "colorPalette.solid",
						color: "colorPalette.fg",
					},
					"&[data-completed] .stepper__icon": {
						bg: "colorPalette.solid",
						color: "colorPalette.contrast",
					},
				},
				separator: {
					"&[data-active]": {
						borderColor: "colorPalette.solid",
					},
				},
			},
		},
		size: {
			md: {
				icon: {
					boxSize: 6,
					fontSize: "sm",
				},
				title: {
					fontSize: "md",
				},
			},
			lg: {
				icon: {
					boxSize: 8,
				},
				title: {
					fontSize: "lg",
				},
			},
		},
		orientation: {
			vertical: {
				steps: {
					flexDirection: "column",
					alignItems: "stretch",
				},
				icon: {
					me: 2,
				},
				separator: {
					minHeight: 4,
					borderLeftWidth: 1,
					borderTopWidth: 0,
					mx: 3,
				},
				content: {
					borderLeftWidth: 1,
					ms: 3,
					ps: 5,
				},
			},
			horizontal: {
				steps: {
					flexDirection: "row",
					alignItems: { base: "flex-start", sm: "center" },
					position: "relative",
				},
				icon: {
					me: { base: 0, sm: 2 },
				},
				title: {
					mt: { base: 2, sm: 0 },
					textAlign: "center",
				},
				separator: {
					borderTopWidth: 1,
					mx: { base: 0, sm: 3 },
					mt: { base: 5, sm: 0 },
					alignSelf: { base: "flex-start", sm: "center" },
					flex: { base: "inherit", sm: 1 },
				},
			},
		},
	},
	defaultVariants: {
		variant: "solid",
		colorPalette: "primary" as never,
		size: "lg",
		orientation: "horizontal",
	},
});
