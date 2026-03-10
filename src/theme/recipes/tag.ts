import { defineRecipe } from "@chakra-ui/react";

export const tagTheme = defineRecipe({
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
	},
	variants: {
		variant: {
			solid: {
				'&[aria-current="page"]': {
					bg: { base: "colorPalette.300", _dark: "colorPalette.400" },
				},
			},
			primary: {
				bg: { base: "primary.300", _dark: "primary.400" },
			},
			secondary: {
				borderWidth: "1px",
				bg: { base: "white", _dark: "gray.800" },
				color: { base: "gray.800", _dark: "whiteAlpha.900" },
			},
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
			ghost: {
				_hover: {
					bg: "transparent",
					color: "primary.500",
				},
				_active: {
					bg: "transparent",
				},
			},
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
		},
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
				rounded: "base",
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
				rounded: "base",
				px: 2,
				fontSize: "xs",
				lineHeight: "1rem",
				fontWeight: 600,
			},
		},
	},
	defaultVariants: {
		size: "lg",
	},
});
