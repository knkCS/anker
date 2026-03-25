import { defineRecipe } from "@chakra-ui/react";

export const buttonTheme = defineRecipe({
	base: {
		lineHeight: "1.2",
		borderRadius: "md",
		fontWeight: "semibold",
		transitionProperty: "common",
		transitionDuration: "normal",
		_focusVisible: {
			boxShadow: "none",
			outlineOffset: "2px",
			outlineWidth: "2px",
			outlineStyle: "solid",
			outlineColor: "primary.600",
		},
		_disabled: {
			opacity: 0.4,
			cursor: "not-allowed",
			boxShadow: "none",
		},
		_hover: {
			_disabled: {
				bg: "initial",
			},
		},
		// WCAG 2.5.8 touch target: expand hit area to 44×44px minimum
		// without changing visual size. The pseudo is invisible and captures
		// pointer events beyond the button's visual bounds.
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

	variants: {
		size: {
			xl: {
				rounded: "md",
				px: 3.5,
				fontSize: "sm",
				lineHeight: 1.5,
				fontWeight: 600,
				h: "10",
				minW: "10",
			},
			lg: {
				rounded: "md",
				px: 3,
				fontSize: "sm",
				lineHeight: 1.5,
				fontWeight: 600,
				h: "9",
				minW: "9",
			},
			md: {
				rounded: "md",
				px: 2.5,
				fontSize: "sm",
				lineHeight: 1.5,
				fontWeight: 600,
				h: "8",
				minW: "8",
			},
			sm: {
				rounded: "md",
				px: 2,
				fontSize: "sm",
				lineHeight: 1.5,
				fontWeight: 600,
				h: "7",
				minW: "7",
			},
			xs: {
				h: "6",
				minW: "6",
				rounded: "md",
				px: 2,
				fontSize: "xs",
				lineHeight: "1rem",
				fontWeight: 600,
			},
		},

		variant: {
			// Solid variant: highlights the current page item
			solid: {
				'&[aria-current="page"]': {
					bg: "colorPalette.300",
					_dark: {
						bg: "colorPalette.400",
					},
				},
			},

			// Primary: solid style locked to the primary color palette
			primary: {
				bg: "primary.500",
				color: "white",
				_hover: {
					bg: "primary.600",
					_disabled: {
						bg: "primary.500",
					},
				},
				_active: {
					bg: "primary.700",
				},
			},

			// Secondary: outline style using gray color palette
			secondary: {
				bg: { base: "white", _dark: "gray.800" },
				borderWidth: "1px",
				borderColor: "gray.200",
				color: "gray.800",
				_dark: {
					borderColor: "gray.600",
					color: "gray.200",
				},
				_hover: {
					bg: { base: "gray.50", _dark: "gray.700" },
				},
				_active: {
					bg: { base: "gray.100", _dark: "gray.700" },
				},
			},

			// Outline: white background with subtle hover/active states
			outline: {
				bg: { base: "white", _dark: "gray.800" },
				_hover: {
					bg: { base: "gray.50", _dark: "gray.700/40" },
				},
				_checked: {
					bg: { base: "gray.100", _dark: "gray.700" },
				},
				_active: {
					bg: { base: "gray.100", _dark: "gray.700" },
				},
			},

			// Ghost: transparent hover that shifts to primary color, gray active
			ghost: {
				_hover: {
					bg: "transparent",
					color: "primary.500",
				},
				_active: {
					bg: "gray.200",
				},
			},

			// Link: no background, text color based on color palette.
			link: {
				color: { base: "colorPalette.600", _dark: "colorPalette.200" },
				_hover: {
					color: { base: "colorPalette.700", _dark: "colorPalette.300" },
					textDecoration: "none",
				},
				_active: {
					color: { base: "colorPalette.700", _dark: "colorPalette.300" },
				},
			},

			// Link variant for gray colorPalette
			"link-gray": {
				color: "muted",
				_hover: {
					textDecoration: "none",
					color: "default",
				},
				_active: {
					color: "default",
				},
			},
		},
	},

	defaultVariants: {
		size: "lg",
		variant: "solid",
	},
});
