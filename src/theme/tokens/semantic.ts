/**
 * Semantic tokens for colors and shadows.
 *
 * These map abstract names (bg-canvas, accent, border, etc.) to raw color
 * scale values, with automatic light/dark mode variants.
 *
 * Shadows are consolidated here from the legacy `foundations/shadows.ts`
 * (static strings) and `foundations/tokens.ts` (responsive token objects).
 * Only the token-based system is kept.
 */
const semanticTokens = {
	colors: {
		"bg-canvas": {
			value: { base: "gray.50", _dark: "gray.900" },
		},
		"bg-surface": {
			value: { base: "white", _dark: "gray.800" },
		},
		"bg-subtle": {
			value: { base: "gray.50", _dark: "gray.700" },
		},
		"bg-muted": {
			value: { base: "gray.100", _dark: "gray.600" },
		},
		default: {
			value: { base: "gray.900", _dark: "white" },
		},
		inverted: {
			value: { base: "white", _dark: "gray.900" },
		},
		emphasized: {
			value: { base: "gray.700", _dark: "gray.100" },
		},
		muted: {
			value: { base: "gray.600", _dark: "gray.300" },
		},
		subtle: {
			value: { base: "gray.500", _dark: "gray.400" },
		},
		border: {
			value: { base: "gray.200", _dark: "gray.700" },
		},
		accent: {
			value: { base: "primary.500", _dark: "primary.200" },
		},
		success: {
			value: { base: "green.600", _dark: "green.200" },
		},
		error: {
			value: { base: "red.600", _dark: "red.200" },
		},
		// Color palette tokens for colorPalette="primary" (required by Chakra v3
		// for solid/subtle/outline/ghost button variants and other components)
		primary: {
			contrast: { value: { base: "white", _dark: "white" } },
			fg: {
				value: {
					base: "{colors.primary.700}",
					_dark: "{colors.primary.300}",
				},
			},
			subtle: {
				value: {
					base: "{colors.primary.100}",
					_dark: "{colors.primary.900}",
				},
			},
			muted: {
				value: {
					base: "{colors.primary.200}",
					_dark: "{colors.primary.800}",
				},
			},
			emphasized: {
				value: {
					base: "{colors.primary.300}",
					_dark: "{colors.primary.700}",
				},
			},
			solid: {
				value: {
					base: "{colors.primary.500}",
					_dark: "{colors.primary.500}",
				},
			},
			focusRing: {
				value: {
					base: "{colors.primary.500}",
					_dark: "{colors.primary.500}",
				},
			},
			border: {
				value: {
					base: "{colors.primary.500}",
					_dark: "{colors.primary.400}",
				},
			},
		},
		// Secondary color palette tokens (for colorPalette="secondary")
		secondary: {
			contrast: { value: { base: "white", _dark: "white" } },
			fg: {
				value: {
					base: "{colors.secondary.700}",
					_dark: "{colors.secondary.300}",
				},
			},
			subtle: {
				value: {
					base: "{colors.secondary.100}",
					_dark: "{colors.secondary.900}",
				},
			},
			muted: {
				value: {
					base: "{colors.secondary.200}",
					_dark: "{colors.secondary.800}",
				},
			},
			emphasized: {
				value: {
					base: "{colors.secondary.300}",
					_dark: "{colors.secondary.700}",
				},
			},
			solid: {
				value: {
					base: "{colors.secondary.500}",
					_dark: "{colors.secondary.500}",
				},
			},
			focusRing: {
				value: {
					base: "{colors.secondary.500}",
					_dark: "{colors.secondary.500}",
				},
			},
			border: {
				value: {
					base: "{colors.secondary.500}",
					_dark: "{colors.secondary.400}",
				},
			},
		},
		// Accent surface tokens
		"bg-accent": { value: { base: "primary.600", _dark: "primary.400" } },
		"bg-accent-subtle": {
			value: { base: "primary.500", _dark: "primary.500" },
		},
		"bg-accent-muted": {
			value: { base: "primary.400", _dark: "primary.600" },
		},
		"on-accent": { value: { base: "white", _dark: "white" } },
		"on-accent-muted": {
			value: { base: "primary.50", _dark: "primary.100" },
		},
		"on-accent-subtle": {
			value: { base: "primary.100", _dark: "primary.200" },
		},
	},
	shadows: {
		xs: {
			value: {
				base: "0px 0px 1px rgba(45, 55, 72, 0.05), 0px 1px 2px rgba(45, 55, 72, 0.1)",
				_dark:
					"0px 0px 1px rgba(13, 14, 20, 1), 0px 1px 2px rgba(13, 14, 20, 0.9)",
			},
		},
		sm: {
			value: {
				base: "0px 0px 1px rgba(45, 55, 72, 0.05), 0px 2px 4px rgba(45, 55, 72, 0.1)",
				_dark:
					"0px 0px 1px rgba(13, 14, 20, 1), 0px 2px 4px rgba(13, 14, 20, 0.9)",
			},
		},
		md: {
			value: {
				base: "0px 0px 1px rgba(45, 55, 72, 0.05), 0px 4px 8px rgba(45, 55, 72, 0.1)",
				_dark:
					"0px 0px 1px rgba(13, 14, 20, 1), 0px 4px 8px rgba(13, 14, 20, 0.9)",
			},
		},
		lg: {
			value: {
				base: "0px 0px 1px rgba(45, 55, 72, 0.05), 0px 8px 16px rgba(45, 55, 72, 0.1)",
				_dark:
					"0px 0px 1px rgba(13, 14, 20, 1), 0px 8px 16px rgba(13, 14, 20, 0.9)",
			},
		},
		xl: {
			value: {
				base: "0px 0px 1px rgba(45, 55, 72, 0.05), 0px 16px 24px rgba(45, 55, 72, 0.1)",
				_dark:
					"0px 0px 1px rgba(13, 14, 20, 1), 0px 16px 24px rgba(13, 14, 20, 0.9)",
			},
		},
	},
	opacity: {
		disabled: { value: 0.4 },
		readOnly: { value: 0.8 },
	},
};

export default semanticTokens;
